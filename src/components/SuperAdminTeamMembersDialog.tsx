import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, Search, UserPlus, UserMinus, Crown, User } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_profiles?: {
    email: string;
    full_name?: string;
  };
}

interface SuperAdminTeamMembersDialogProps {
  team: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onTeamUpdated: () => void;
}

export function SuperAdminTeamMembersDialog({ 
  team, 
  isOpen, 
  onClose, 
  onTeamUpdated 
}: SuperAdminTeamMembersDialogProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [memberInviteCode, setMemberInviteCode] = useState("");
  const [generatingInvite, setGeneratingInvite] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      loadMemberInviteCode();
    }
  }, [isOpen, team.id]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      // First get team members
      const { data: teamMembers, error: teamMembersError } = await supabase
        .from('team_members')
        .select('id, user_id, role, joined_at')
        .eq('team_id', team.id)
        .order('role')
        .order('joined_at');

      if (teamMembersError) throw teamMembersError;

      // Then get user profiles for each member
      const membersWithProfiles = await Promise.all(
        (teamMembers || []).map(async (member) => {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('email, full_name')
            .eq('user_id', member.user_id)
            .single();

          return {
            ...member,
            user_profiles: profileError ? null : profile
          };
        })
      );

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const loadMemberInviteCode = async () => {
    try {
      // STRICTLY filter for member invitation type only - NEVER show admin codes
      const { data, error } = await supabase
        .from('team_invitations')
        .select('invite_code')
        .eq('team_id', team.id)
        .eq('invitation_type', 'member')  // CRITICAL: Only member invitations
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      // Only set the code if we found a member invitation
      if (data && data.length > 0) {
        setMemberInviteCode(data[0].invite_code);
      } else {
        setMemberInviteCode(""); // Clear any existing code
      }
    } catch (error) {
      console.error('Error loading member invite code:', error);
      setMemberInviteCode(""); // Clear on error
    }
  };

  const generateMemberInviteCode = async () => {
    setGeneratingInvite(true);
    try {
      // Use the existing function that creates member invitations
      const { data, error } = await supabase.rpc('create_member_invitation_for_team', {
        team_id_param: team.id
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        setMemberInviteCode(result.invite_code);
        toast.success('Member invite code generated successfully');
      } else {
        toast.error(result.error || 'Failed to generate member invite code');
      }
    } catch (error) {
      console.error('Error generating member invite code:', error);
      toast.error('Failed to generate member invite code');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteCode = () => {
    if (memberInviteCode) {
      navigator.clipboard.writeText(memberInviteCode);
      toast.success('Member invite code copied to clipboard');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      const { error } = await supabase.rpc('remove_team_member', {
        member_id_param: memberId
      });

      if (error) throw error;
      
      toast.success(`${memberName} removed from team`);
      loadMembers();
      onTeamUpdated();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member', memberName: string) => {
    try {
      const { error } = await supabase.rpc('change_member_role', {
        member_id_param: memberId,
        new_role: newRole
      });

      if (error) throw error;
      
      toast.success(`${memberName} role changed to ${newRole}`);
      loadMembers();
      onTeamUpdated();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Failed to change member role');
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchTerm || 
      (member.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getMemberDisplayName = (member: TeamMember) => {
    return member.user_profiles?.full_name || member.user_profiles?.email || 'Unknown User';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="large" className="flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members: {team.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Member Invite Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite New Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {memberInviteCode ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={memberInviteCode}
                        readOnly
                        className="font-mono"
                      />
                      <Button onClick={copyInviteCode} className="flex-shrink-0">
                        Copy Code
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share this code with new members to join the team as regular members
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                      <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">No active member invitation</p>
                      <p className="text-sm text-muted-foreground">Generate a member invite code to allow new users to join as team members</p>
                    </div>
                    <Button 
                      onClick={generateMemberInviteCode} 
                      disabled={generatingInvite}
                      className="w-full"
                    >
                      {generatingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate Member Invite Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="member">Members</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Team Members ({filteredMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {members.length === 0 ? 'No members found' : 'No members match your search criteria'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMembers.map((member) => (
                      <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {member.role === 'admin' ? (
                              <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {getMemberDisplayName(member)}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {member.user_profiles?.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Joined {new Date(member.joined_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={member.role === 'admin' ? 'destructive' : 'secondary'}>
                            {member.role}
                          </Badge>
                          
                          <Select
                            value={member.role}
                            onValueChange={(newRole: 'admin' | 'member') => 
                              handleChangeRole(member.id, newRole, getMemberDisplayName(member))
                            }
                          >
                            <SelectTrigger className="w-24 sm:w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 flex-shrink-0">
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove "{getMemberDisplayName(member)}" from the team? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleRemoveMember(member.id, getMemberDisplayName(member))}
                                  className="bg-red-600"
                                >
                                  Remove Member
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
