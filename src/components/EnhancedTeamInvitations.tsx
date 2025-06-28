
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Mail, Link, Users, UserPlus, Trash2, Copy, Shield, Crown } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/utils/dateUtils";

interface EnhancedTeamInvitationsProps {
  teamId: string;
  teamName: string;
}

export function EnhancedTeamInvitations({ teamId, teamName }: EnhancedTeamInvitationsProps) {
  const queryClient = useQueryClient();
  const [adminEmail, setAdminEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['team-invitations', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const createMemberInviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_member_invitation_for_team', {
        team_id_param: teamId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] });
      toast.success('Member invitation link created');
    },
    onError: (error) => {
      console.error('Error creating member invitation:', error);
      toast.error('Failed to create invitation link');
    }
  });

  const createAdminInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.rpc('create_admin_invitation_for_team', {
        team_id_param: teamId,
        admin_email: email
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] });
      setAdminEmail("");
      toast.success('Admin invitation created and sent');
    },
    onError: (error) => {
      console.error('Error creating admin invitation:', error);
      toast.error('Failed to create admin invitation');
    }
  });

  const deactivateInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('team_invitations')
        .update({ is_active: false })
        .eq('id', inviteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] });
      toast.success('Invitation deactivated');
    },
    onError: (error) => {
      console.error('Error deactivating invitation:', error);
      toast.error('Failed to deactivate invitation');
    }
  });

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied to clipboard');
  };

  const handleCreateMemberInvite = () => {
    createMemberInviteMutation.mutate();
  };

  const handleCreateAdminInvite = () => {
    if (!adminEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    createAdminInviteMutation.mutate(adminEmail);
  };

  const handleDeactivateInvite = (inviteId: string) => {
    deactivateInviteMutation.mutate(inviteId);
  };

  const activeInvitations = invitations?.filter(inv => inv.is_active) || [];
  const memberInvitations = activeInvitations.filter(inv => inv.invitation_type === 'member');
  const adminInvitations = activeInvitations.filter(inv => inv.invitation_type === 'admin');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Invitations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="member" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="member" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Member Invite
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Admin Invite
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="member" className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Create Member Invitation Link</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a reusable invitation link that allows people to join as team members.
                </p>
                <Button 
                  onClick={handleCreateMemberInvite}
                  disabled={createMemberInviteMutation.isPending}
                  className="w-full"
                >
                  <Link className="h-4 w-4 mr-2" />
                  {createMemberInviteMutation.isPending ? 'Creating...' : 'Create Member Invitation Link'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="admin" className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Create Admin Invitation</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Send an admin invitation to a specific email address.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="admin-email">Email Address</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateAdminInvite}
                    disabled={createAdminInviteMutation.isPending || !adminEmail.trim()}
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {createAdminInviteMutation.isPending ? 'Creating...' : 'Create Admin Invitation'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Active Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading invitations...</div>
          ) : activeInvitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link className="h-8 w-8 mx-auto mb-2" />
              <p>No active invitations found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memberInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        Member Invitation
                      </Badge>
                      <Badge variant="outline">
                        Uses: {invitation.current_uses}/{invitation.max_uses}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created: {formatDateTime(invitation.created_at)}
                      {invitation.expires_at && (
                        <span className="ml-2">
                          • Expires: {formatDateTime(invitation.expires_at)}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs bg-muted p-2 rounded mt-2">
                      {invitation.invite_code}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteCode(invitation.invite_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate Invitation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to deactivate this invitation? This will prevent anyone from using this invite code to join the team.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeactivateInvite(invitation.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Deactivate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              {adminInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin Invitation
                      </Badge>
                      <Badge variant="outline">
                        {invitation.invited_email}
                      </Badge>
                      {invitation.accepted_at && (
                        <Badge variant="success">Accepted</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created: {formatDateTime(invitation.created_at)}
                      {invitation.expires_at && (
                        <span className="ml-2">
                          • Expires: {formatDateTime(invitation.expires_at)}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs bg-muted p-2 rounded mt-2">
                      {invitation.invite_code}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteCode(invitation.invite_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!invitation.accepted_at && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deactivate Invitation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to deactivate this admin invitation for {invitation.invited_email}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeactivateInvite(invitation.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Deactivate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
