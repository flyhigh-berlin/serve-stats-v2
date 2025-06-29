
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Users, UserMinus, UserCheck, MoreHorizontal, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/dateUtils";

interface EnhancedTeamMemberManagementProps {
  teamId: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

interface BulkUpdateResult {
  success: boolean;
  affected_count: number;
  operation: string;
  error?: string;
}

export function EnhancedTeamMemberManagement({ teamId }: EnhancedTeamMemberManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      // First get team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .order('joined_at', { ascending: false });
      
      if (membersError) throw membersError;
      
      // Then get user profiles for each member
      const memberIds = teamMembers?.map(m => m.user_id) || [];
      if (memberIds.length === 0) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .in('user_id', memberIds);
      
      if (profilesError) throw profilesError;
      
      // Combine the data
      const membersWithProfiles: TeamMember[] = teamMembers?.map(member => ({
        ...member,
        user_profiles: profiles?.find(p => p.user_id === member.user_id) || null
      })) || [];
      
      return membersWithProfiles;
    }
  });

  // Filter members based on search and role filter
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    
    return members.filter(member => {
      const matchesSearch = !searchTerm || 
        member.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [members, searchTerm, roleFilter]);

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ memberIds, operation, newRole }: { 
      memberIds: string[], 
      operation: string, 
      newRole?: string 
    }) => {
      const { data, error } = await supabase.rpc('bulk_update_members', {
        member_ids: memberIds,
        operation,
        new_role: newRole as any
      });
      if (error) throw error;
      return data as unknown as BulkUpdateResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      setSelectedMembers([]);
      setBulkAction("");
      toast.success(`Successfully ${data.operation.replace('_', ' ')} ${data.affected_count} member(s)`);
    },
    onError: (error: any) => {
      toast.error('Failed to update members: ' + error.message);
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.rpc('remove_team_member', {
        member_id_param: memberId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success('Member removed successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to remove member: ' + error.message);
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string, newRole: string }) => {
      const { error } = await supabase.rpc('change_member_role', {
        member_id_param: memberId,
        new_role: newRole as any
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success('Member role updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to change role: ' + error.message);
    }
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(filteredMembers.map(m => m.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleBulkAction = () => {
    if (selectedMembers.length === 0 || !bulkAction) return;
    
    if (bulkAction === 'remove') {
      bulkUpdateMutation.mutate({
        memberIds: selectedMembers,
        operation: 'remove'
      });
    } else if (bulkAction.startsWith('role_')) {
      const newRole = bulkAction.replace('role_', '');
      bulkUpdateMutation.mutate({
        memberIds: selectedMembers,
        operation: 'change_role',
        newRole
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading members...</div>;
  }

  const totalMembers = members?.length || 0;
  const adminCount = members?.filter(m => m.role === 'admin').length || 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            {totalMembers} total members ({adminCount} admins)
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="member">Members</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedMembers.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedMembers.length} member(s) selected
          </span>
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Bulk action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="role_admin">Promote to Admin</SelectItem>
              <SelectItem value="role_member">Change to Member</SelectItem>
              <SelectItem value="remove">Remove Members</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                disabled={!bulkAction}
              >
                Apply Action
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to {bulkAction.replace('_', ' ')} {selectedMembers.length} member(s)? 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkAction}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({filteredMembers.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={(checked) => handleSelectMember(member.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.user_profiles?.full_name || member.user_profiles?.email || 'Unknown User'}
                      </p>
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role === 'admin' ? (
                          <><Crown className="h-3 w-3 mr-1" />Admin</>
                        ) : (
                          'Member'
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.user_profiles?.email || 'No email'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(member.joined_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(newRole) => changeRoleMutation.mutate({
                      memberId: member.id,
                      newRole
                    })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {member.user_profiles?.full_name || member.user_profiles?.email || 'this member'} from the team?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMemberMutation.mutate(member.id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            
            {filteredMembers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No members found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
