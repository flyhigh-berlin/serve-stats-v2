
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/utils/dateUtils";
import { toast } from "sonner";
import { Users, Crown, Search, MoreVertical, UserMinus, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamMemberListProps {
  teamId: string;
  isAdmin: boolean;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  email?: string;
  full_name?: string;
}

export function TeamMemberList({ teamId, isAdmin }: TeamMemberListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      // First get team members
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .order('joined_at', { ascending: false });
      
      if (memberError) throw memberError;
      
      if (!memberData || memberData.length === 0) {
        return [];
      }

      // Get user profile details
      const userIds = memberData.map(member => member.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;

      // Combine member data with profile data
      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, { email: string; full_name: string | null }>) || {};

      return memberData.map(member => ({
        ...member,
        email: profileMap[member.user_id]?.email,
        full_name: profileMap[member.user_id]?.full_name,
      })) as TeamMember[];
    },
    enabled: !!teamId,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: 'admin' | 'member' }) => {
      const { data, error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-stats', teamId] });
      toast.success('Member role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update member role');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-stats', teamId] });
      toast.success('Member removed successfully');
      setMemberToRemove(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });

  const filteredMembers = members?.filter(member => 
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({filteredMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">
                      {member.full_name || member.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Joined: {formatDate(member.joined_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                    {member.role === 'admin' ? (
                      <>
                        <Crown className="h-3 w-3 mr-1" />
                        Administrator
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3 mr-1" />
                        Member
                      </>
                    )}
                  </Badge>

                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role === 'member' ? (
                          <DropdownMenuItem
                            onClick={() => updateRoleMutation.mutate({
                              memberId: member.id,
                              newRole: 'admin'
                            })}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Promote to Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => updateRoleMutation.mutate({
                              memberId: member.id,
                              newRole: 'member'
                            })}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Demote to Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setMemberToRemove(member)}
                          className="text-destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No members found matching your search.' : 'No members found.'}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.full_name || memberToRemove?.email} from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && removeMemberMutation.mutate(memberToRemove.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
