import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Copy, Plus, Trash2, Mail, Users, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/dateUtils";

interface TeamInvitationsTabProps {
  teamId: string;
}

interface Invitation {
  id: string;
  invite_code: string;
  invitation_type: 'admin' | 'member';
  invited_email?: string;
  admin_role: boolean;
  expires_at?: string;
  created_at: string;
  current_uses: number;
  max_uses: number;
  is_active: boolean;
}

interface InvitationResponse {
  success: boolean;
  error?: string;
  invite_code?: string;
  expires_at?: string;
}

interface MemberInvitationResponse {
  success: boolean;
  invitation?: Invitation;
}

export function TeamInvitationsTab({ teamId }: TeamInvitationsTabProps) {
  const [adminEmail, setAdminEmail] = useState('');
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['team-invitations', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invitation[];
    }
  });

  const { data: memberInvitation } = useQuery({
    queryKey: ['member-invitation', teamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_member_invitation', {
        team_id_param: teamId
      });
      if (error) throw error;
      return data as unknown as MemberInvitationResponse;
    }
  });

  const createAdminInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.rpc('create_admin_invitation_for_team', {
        team_id_param: teamId,
        admin_email: email
      });
      if (error) throw error;
      return data as unknown as InvitationResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] });
        toast.success(`Admin invitation created for ${adminEmail}`);
        setAdminEmail('');
      } else {
        toast.error(data.error || 'Failed to create invitation');
      }
    },
    onError: (error) => {
      console.error('Error creating admin invitation:', error);
      toast.error('Failed to create admin invitation');
    }
  });

  const createMemberInviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_member_invitation_for_team', {
        team_id_param: teamId
      });
      if (error) throw error;
      return data as unknown as InvitationResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['member-invitation', teamId] });
        queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] });
        toast.success('Member invitation created');
      } else {
        toast.error(data.error || 'Failed to create invitation');
      }
    },
    onError: (error) => {
      console.error('Error creating member invitation:', error);
      toast.error('Failed to create member invitation');
    }
  });

  const deactivateInviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('deactivate_member_invitation', {
        team_id_param: teamId
      });
      if (error) throw error;
      return data as unknown as InvitationResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-invitation', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] });
      toast.success('Member invitation deactivated');
    },
    onError: (error) => {
      console.error('Error deactivating invitation:', error);
      toast.error('Failed to deactivate invitation');
    }
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCreateAdminInvite = () => {
    if (adminEmail.trim()) {
      createAdminInviteMutation.mutate(adminEmail.trim());
    } else {
      toast.error('Please enter an email address');
    }
  };

  const getInviteUrl = (code: string) => {
    return `${window.location.origin}?invite=${code}`;
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
      <div>
        <h3 className="text-lg font-semibold">Team Invitations</h3>
        <p className="text-sm text-muted-foreground">
          Create and manage invitations for new team members
        </p>
      </div>

      {/* Create Admin Invitation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Create Admin Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="Enter email address"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleCreateAdminInvite}
              disabled={createAdminInviteMutation.isPending}
              className="w-full"
            >
              {createAdminInviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Mail className="mr-2 h-4 w-4" />
              Create Admin Invitation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Member Invitation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Invitation Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          {memberInvitation?.invitation ? (
            <div className="space-y-4">
              <div>
                <Label>Current Member Invitation</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={getInviteUrl(memberInvitation.invitation.invite_code)}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(getInviteUrl(memberInvitation.invitation.invite_code))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Expires: {formatDate(memberInvitation.invitation.expires_at)}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => deactivateInviteMutation.mutate()}
                disabled={deactivateInviteMutation.isPending}
              >
                {deactivateInviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="mr-2 h-4 w-4" />
                Deactivate Link
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => createMemberInviteMutation.mutate()}
              disabled={createMemberInviteMutation.isPending}
              className="w-full"
            >
              {createMemberInviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-2 h-4 w-4" />
              Create Member Invitation Link
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invitations?.map(invitation => (
              <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={invitation.invitation_type === 'admin' ? 'default' : 'secondary'}>
                      {invitation.invitation_type === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                      {invitation.invitation_type}
                    </Badge>
                    <Badge variant={invitation.is_active ? 'default' : 'secondary'}>
                      {invitation.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {invitation.invited_email && (
                    <p className="text-sm font-medium">{invitation.invited_email}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created: {formatDate(invitation.created_at)}
                  </p>
                  {invitation.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {formatDate(invitation.expires_at)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Uses: {invitation.current_uses}/{invitation.max_uses}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(getInviteUrl(invitation.invite_code))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!invitations || invitations.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No invitations created yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
