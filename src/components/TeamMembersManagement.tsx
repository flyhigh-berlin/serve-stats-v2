
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Crown, UserMinus, RefreshCw, Mail } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_profiles: {
    email: string;
    full_name: string | null;
  } | null;
}

interface TeamMembersManagementProps {
  teamId: string;
  teamName: string;
  currentUserId: string;
  isTeamAdmin: boolean;
}

export function TeamMembersManagement({ teamId, teamName, currentUserId, isTeamAdmin }: TeamMembersManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, [teamId]);

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      // First get team members
      const { data: teamMembersData, error: membersError } = await supabase
        .from('team_members')
        .select('id, user_id, role, joined_at')
        .eq('team_id', teamId)
        .order('role', { ascending: false }) // Admins first
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      if (!teamMembersData || teamMembersData.length === 0) {
        setMembers([]);
        return;
      }

      // Get user IDs
      const userIds = teamMembersData.map(member => member.user_id);

      // Then get user profiles for those user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const membersWithProfiles = teamMembersData.map(member => {
        const profile = profilesData?.find(p => p.user_id === member.user_id);
        return {
          ...member,
          user_profiles: profile ? {
            email: profile.email,
            full_name: profile.full_name
          } : null
        };
      });

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string, memberName: string) => {
    setRemovingMemberId(memberId);
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success(`${memberName} removed from team`);
      await loadTeamMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Members ({members.length})</h3>
          <p className="text-sm text-muted-foreground">
            Manage your team's members and their roles
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadTeamMembers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {members.map(member => (
          <Card key={member.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {member.user_profiles?.full_name || member.user_profiles?.email || 'Unknown User'}
                      </span>
                      {member.role === 'admin' && (
                        <Crown className="h-4 w-4 text-yellow-600" />
                      )}
                      {member.user_id === currentUserId && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    {member.user_profiles && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.user_profiles.email}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Joined {formatDate(member.joined_at)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                    {member.role === 'admin' ? 'Admin' : 'Member'}
                  </Badge>
                  
                  {isTeamAdmin && member.user_id !== currentUserId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={removingMemberId === member.id}
                        >
                          {removingMemberId === member.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {member.user_profiles?.full_name || member.user_profiles?.email || 'this user'} from the team? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => removeMember(member.id, member.user_profiles?.full_name || member.user_profiles?.email || 'Unknown User')}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove Member
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No team members found</p>
        </div>
      )}
    </div>
  );
}
