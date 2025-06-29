
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Users, Trash2, Settings, Shield } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/dateUtils";

interface TeamMembersTabProps {
  teamId: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  full_name?: string;
  email?: string;
}

interface BulkUpdateResult {
  success: boolean;
  affected_count: number;
  operation: string;
  error?: string;
}

export function TeamMembersTab({ teamId }: TeamMembersTabProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      // First get team members
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);
      
      if (error) throw error;
      
      // Then get user profiles for each member
      const memberIds = teamMembers?.map(m => m.user_id) || [];
      if (memberIds.length === 0) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .in('user_id', memberIds);
      
      if (profilesError) throw profilesError;
      
      // Combine team member data with profile data
      const membersWithProfiles: TeamMember[] = teamMembers?.map(member => {
        const profile = profiles?.find(p => p.user_id === member.user_id);
        return {
          ...member,
          full_name: profile?.full_name || null,
          email: profile?.email || 'Unknown'
        };
      }) || [];
      
      return membersWithProfiles;
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
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'admin' | 'member' }) => {
      const { error } = await supabase.rpc('change_member_role', {
        member_id_param: memberId,
        new_role: role
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success('Role updated successfully');
    },
    onError: (error) => {
      console.error('Error changing role:', error);
      toast.error('Failed to change role');
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (operation: string) => {
      const { data, error } = await supabase.rpc('bulk_update_members', {
        member_ids: selectedMembers,
        operation: operation,
        new_role: newRole as any
      });
      if (error) throw error;
      return data as unknown as BulkUpdateResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success(`${data.operation} completed for ${data.affected_count} members`);
      setSelectedMembers([]);
      setBulkAction('');
    },
    onError: (error) => {
      console.error('Error with bulk operation:', error);
      toast.error('Failed to complete bulk operation');
    }
  });

  const handleMemberSelect = (memberId: string, checked: boolean) => {
    setSelectedMembers(prev => 
      checked 
        ? [...prev, memberId]
        : prev.filter(id => id !== memberId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedMembers(checked ? (members?.map(m => m.id) || []) : []);
  };

  const handleBulkAction = () => {
    if (bulkAction && selectedMembers.length > 0) {
      bulkUpdateMutation.mutate(bulkAction);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage team members and their roles
          </p>
        </div>
        <Badge variant="secondary">
          <Users className="h-3 w-3 mr-1" />
          {members?.length || 0} members
        </Badge>
      </div>

      {/* Bulk Actions */}
      {selectedMembers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bulk Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {selectedMembers.length} members selected
              </span>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Choose action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remove">Remove</SelectItem>
                  <SelectItem value="change_role">Change Role</SelectItem>
                </SelectContent>
              </Select>
              {bulkAction === 'change_role' && (
                <Select value={newRole} onValueChange={(value: 'admin' | 'member') => setNewRole(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button 
                onClick={handleBulkAction} 
                disabled={!bulkAction || bulkUpdateMutation.isPending}
                variant={bulkAction === 'remove' ? 'destructive' : 'default'}
              >
                {bulkUpdateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Members</CardTitle>
            <Checkbox
              checked={selectedMembers.length === members?.length && members.length > 0}
              onCheckedChange={handleSelectAll}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members?.map(member => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={(checked) => handleMemberSelect(member.id, checked as boolean)}
                  />
                  <div>
                    <p className="font-medium">
                      {member.full_name || member.email || 'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(member.joined_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                    {member.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                    {member.role}
                  </Badge>
                  <Select 
                    value={member.role} 
                    onValueChange={(value: 'admin' | 'member') => 
                      changeRoleMutation.mutate({ memberId: member.id, role: value })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <Settings className="h-3 w-3" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {member.full_name || member.email} from the team?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => removeMemberMutation.mutate(member.id)}
                          className="bg-red-600"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
