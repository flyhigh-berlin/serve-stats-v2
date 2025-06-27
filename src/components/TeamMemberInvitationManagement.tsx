
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Users, UserPlus, Trash2, RefreshCw, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface TeamMemberInvitation {
  id: string;
  invite_code: string;
  expires_at: string;
  is_active: boolean;
  current_uses: number;
  max_uses: number;
  created_at: string;
  last_used_at?: string;
}

interface TeamMemberInvitationManagementProps {
  teamId: string;
  teamName: string;
}

export function TeamMemberInvitationManagement({ teamId, teamName }: TeamMemberInvitationManagementProps) {
  const [invitation, setInvitation] = useState<TeamMemberInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    loadMemberInvitation();
  }, [teamId]);

  const loadMemberInvitation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_team_member_invitation', {
        team_id_param: teamId
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        setInvitation(result.invitation);
      } else {
        console.error('Error loading member invitation:', result.error);
        toast.error('Failed to load member invitation');
      }
    } catch (error) {
      console.error('Error loading member invitation:', error);
      toast.error('Failed to load member invitation');
    } finally {
      setLoading(false);
    }
  };

  const createMemberInvitation = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_member_invitation_for_team', {
        team_id_param: teamId
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast.success("Member invitation created successfully");
        await loadMemberInvitation();
      } else {
        toast.error(result.error || "Failed to create member invitation");
      }
    } catch (error) {
      console.error('Error creating member invitation:', error);
      toast.error('Failed to create member invitation');
    } finally {
      setCreating(false);
    }
  };

  const deactivateMemberInvitation = async () => {
    setDeactivating(true);
    try {
      const { data, error } = await supabase.rpc('deactivate_member_invitation', {
        team_id_param: teamId
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast.success("Member invitation deactivated");
        await loadMemberInvitation();
      } else {
        toast.error(result.error || "Failed to deactivate member invitation");
      }
    } catch (error) {
      console.error('Error deactivating member invitation:', error);
      toast.error('Failed to deactivate member invitation');
    } finally {
      setDeactivating(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invitation code copied to clipboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading member invitation...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Invitations for {teamName}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadMemberInvitation}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!invitation ? (
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Active Member Invitation</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a reusable invitation code that allows multiple users to join as team members
            </p>
            <Button onClick={createMemberInvitation} disabled={creating}>
              {creating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              <UserPlus className="h-4 w-4 mr-2" />
              Create Member Invitation
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Active</Badge>
                  <Badge variant="outline">
                    {invitation.current_uses} / {invitation.max_uses} uses
                  </Badge>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={deactivating}>
                      {deactivating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Deactivate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deactivate Member Invitation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will prevent the invitation code from being used by new members. 
                        This action cannot be undone, but you can create a new invitation afterwards.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={deactivateMemberInvitation}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Deactivate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invitation Code</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded border">
                      {invitation.invite_code}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteCode(invitation.invite_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <div className="flex items-center gap-1 text-sm mt-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(invitation.created_at)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expires</label>
                    <div className="flex items-center gap-1 text-sm mt-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(invitation.expires_at)}
                    </div>
                  </div>
                </div>

                {invitation.last_used_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Used</label>
                    <div className="flex items-center gap-1 text-sm mt-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(invitation.last_used_at)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• This invitation code can be used by multiple people to join as team members</p>
              <p>• Members can view and participate in team activities but cannot manage team settings</p>
              <p>• Share this code with users you want to join your team</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
