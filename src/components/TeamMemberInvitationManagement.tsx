
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Users, UserPlus, Trash2, RefreshCw, Calendar, Clock, Info, AlertCircle } from "lucide-react";
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
  invitation_type: string;
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
      // Strictly load only member invitations, never admin invitations
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('invitation_type', 'member')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading member invitation:', error);
        throw error;
      }

      // Validate that we only have member invitations
      const memberInvitation = data?.find(inv => inv.invitation_type === 'member');
      
      if (memberInvitation) {
        setInvitation(memberInvitation);
        console.log('Loaded member invitation:', memberInvitation);
      } else {
        setInvitation(null);
        console.log('No active member invitation found');
      }
    } catch (error) {
      console.error('Error loading member invitation:', error);
      toast.error('Failed to load member invitation');
      setInvitation(null);
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

  const copyInviteCode = (code: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(code);
    toast.success("Member invitation code copied to clipboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
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
    <Card className="max-w-4xl mx-auto">
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
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">No Active Member Invitation</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              No member invitation code currently exists for this team. Generate a member invite to allow new users to join as team members.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Please generate a member invite</p>
                  <p>Member invitations are separate from admin invitations and allow multiple users to join with member-level permissions.</p>
                </div>
              </div>
            </div>
            
            <Button onClick={createMemberInvitation} disabled={creating} size="lg">
              {creating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              <UserPlus className="h-4 w-4 mr-2" />
              Generate Member Invitation
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Active Member Invitation</Badge>
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
                  <AlertDialogContent className="max-w-2xl">
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

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Invitation Code</label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 text-sm font-mono bg-muted px-4 py-3 rounded border">
                      {invitation.invite_code}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => copyInviteCode(invitation.invite_code, e)}
                      type="button"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(invitation.created_at)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expires</label>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(invitation.expires_at)}
                    </div>
                  </div>
                </div>

                {invitation.last_used_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Used</label>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(invitation.last_used_at)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-2">Member Invitation Info:</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• This invitation code can be used by multiple people to join as team members</li>
                    <li>• Members can view and participate in team activities but cannot manage team settings</li>
                    <li>• Share this code with users you want to join your team as members</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
