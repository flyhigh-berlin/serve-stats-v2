
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

export function TeamMembersTab({ teamId }: TeamMembersTabProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          user_profiles!inner(
            full_name,
            email
          )
        `)
        .eq('team_id', teamId);
      
      if (error) throw error;
      
      const membersWithProfiles: TeamMember[] = data?.map(member => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        full_name: member.user_profiles?.full_name || null,
        email: member.user_profiles?.email || 'No email'
      })) || [];
      
      return membersWithProfiles;
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
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
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);
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

  const bulkRemoveMutation = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .in('id', memberIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success(`${selectedMembers.length} members removed successfully`);
      setSelectedMembers([]);
    },
    onError: (error) => {
      console.error('Error removing members:', error);
      toast.error('Failed to remove members');
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

  const getDisplayName = (member: TeamMember) => {
    if (member.full_name) return member.full_name;
    if (member.email && member.email !== 'No email') return member.email;
    return 'Profile incomplete';
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={bulkRemoveMutation.isPending}>
                    {bulkRemoveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Remove Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Members</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {selectedMembers.length} selected members from the team?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => bulkRemoveMutation.mutate(selectedMembers)}
                      className="bg-red-600"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                      {getDisplayName(member)}
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
                          Are you sure you want to remove {getDisplayName(member)} from the team?
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
            {(!members || members.length === 0) && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No team members found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
