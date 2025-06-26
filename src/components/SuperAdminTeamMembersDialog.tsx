
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
  const [inviteCode, setInviteCode] = useState("");
  const [generatingInvite, setGeneratingInvite] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      loadActiveInviteCode();
    }
  }, [isOpen, team.id]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          user_profiles (
            email,
            full_name
          )
        `)
        .eq('team_id', team.id)
        .order('role')
        .order('joined_at');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveInviteCode = async () => {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('invite_code')
        .eq('team_id', team.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setInviteCode(data[0].invite_code);
      }
    } catch (error) {
      console.error('Error loading invite code:', error);
    }
  };

  const generateInviteCode = async () => {
    setGeneratingInvite(true);
    try {
      const { data: codeData, error: codeError } = await supabase.rpc('generate_invite_code');
      if (codeError) throw codeError;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: team.id,
          invite_code: codeData,
          max_uses: 10,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;
      
      setInviteCode(codeData);
      toast.success('Invite code generated successfully');
    } catch (error) {
      console.error('Error generating invite code:', error);
      toast.error('Failed to generate invite code');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Invite code copied to clipboard');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members: {team.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invite New Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inviteCode ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={inviteCode}
                      readOnly
                      className="font-mono"
                    />
                    <Button onClick={copyInviteCode}>
                      Copy Code
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share this code with new members to join the team
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={generateInviteCode} 
                  disabled={generatingInvite}
                  className="w-full"
                >
                  {generatingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Invite Code
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <div className="flex gap-4">
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
              <SelectTrigger className="w-40">
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
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {member.role === 'admin' ? (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium">
                              {getMemberDisplayName(member)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.user_profiles?.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === 'admin' ? 'destructive' : 'secondary'}>
                          {member.role}
                        </Badge>
                        
                        <Select
                          value={member.role}
                          onValueChange={(newRole: 'admin' | 'member') => 
                            handleChangeRole(member.id, newRole, getMemberDisplayName(member))
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600">
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
      </DialogContent>
    </Dialog>
  );
}
