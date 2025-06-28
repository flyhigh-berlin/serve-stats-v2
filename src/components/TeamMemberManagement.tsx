
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Crown, UserMinus, Settings } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/dateUtils";

interface TeamMemberManagementProps {
  teamId: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_profile?: {
    email: string;
    full_name: string | null;
  };
}

export function TeamMemberManagement({ teamId }: TeamMemberManagementProps) {
  const queryClient = useQueryClient();
  const [changingRoles, setChangingRoles] = useState<Set<string>>(new Set());

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          joined_at
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = data.map(member => member.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const membersWithProfiles = data.map(member => ({
        ...member,
        user_profile: profiles.find(profile => profile.user_id === member.user_id)
      }));

      return membersWithProfiles as TeamMember[];
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: 'admin' | 'member' }) => {
      const { data, error } = await supabase.rpc('change_member_role', {
        member_id_param: memberId,
        new_role: newRole
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success('Member role updated successfully');
    },
    onError: (error) => {
      console.error('Error changing member role:', error);
      toast.error('Failed to update member role');
    },
    onSettled: (_, __, { memberId }) => {
      setChangingRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { data, error } = await supabase.rpc('remove_team_member', {
        member_id_param: memberId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success('Member removed from team');
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  });

  const handleRoleChange = (memberId: string, newRole: 'admin' | 'member') => {
    setChangingRoles(prev => new Set(prev).add(memberId));
    changeRoleMutation.mutate({ memberId, newRole });
  };

  const handleRemoveMember = (memberId: string) => {
    removeMemberMutation.mutate(memberId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading members...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members ({members?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {members?.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">
                    {member.user_profile?.full_name || member.user_profile?.email || 'Unknown User'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.user_profile?.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Joined: {formatDate(member.joined_at)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Select
                value={member.role}
                onValueChange={(newRole: 'admin' | 'member') => handleRoleChange(member.id, newRole)}
                disabled={changingRoles.has(member.id)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Member
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-3 w-3" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                {member.role === 'admin' ? (
                  <>
                    <Crown className="h-3 w-3 mr-1" />
                    Admin
                  </>
                ) : (
                  <>
                    <Users className="h-3 w-3 mr-1" />
                    Member
                  </>
                )}
              </Badge>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {member.user_profile?.full_name || member.user_profile?.email} from the team? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleRemoveMember(member.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Remove Member
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {members?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p>No team members found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
