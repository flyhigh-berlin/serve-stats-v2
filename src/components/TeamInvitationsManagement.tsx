
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Clock, Mail, Trash2, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

interface TeamInvitation {
  id: string;
  invite_code: string;
  admin_role: boolean;
  expires_at: string;
  is_active: boolean;
  current_uses: number;
  max_uses: number;
  created_at: string;
  last_used_at?: string;
}

interface TeamInvitationsManagementProps {
  teamId: string;
  teamName: string;
}

export function TeamInvitationsManagement({ teamId, teamName }: TeamInvitationsManagementProps) {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvitations();
  }, [teamId]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error('Failed to load team invitations');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invitation code copied to clipboard");
  };

  const deactivateInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ is_active: false })
        .eq('id', invitationId);

      if (error) throw error;
      
      toast.success("Invitation deactivated");
      loadInvitations();
    } catch (error) {
      console.error('Error deactivating invitation:', error);
      toast.error('Failed to deactivate invitation');
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const isUsedUp = (invitation: TeamInvitation) => {
    return invitation.current_uses >= invitation.max_uses;
  };

  const getInvitationStatus = (invitation: TeamInvitation) => {
    if (!invitation.is_active) return { label: 'Inactive', variant: 'secondary' as const };
    if (isExpired(invitation.expires_at)) return { label: 'Expired', variant: 'destructive' as const };
    if (isUsedUp(invitation)) return { label: 'Used Up', variant: 'secondary' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Admin Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading invitations...
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeInvitations = invitations.filter(inv => 
    inv.is_active && !isExpired(inv.expires_at) && !isUsedUp(inv)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Admin Invitations for {teamName}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadInvitations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No admin invitations found</p>
            <p className="text-sm">Create invitations when setting up the team</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeInvitations.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-green-700 mb-2">Active Invitations ({activeInvitations.length})</h4>
                <div className="space-y-2">
                  {activeInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="default">Admin Invitation</Badge>
                          <Badge variant={getInvitationStatus(invitation).variant}>
                            {getInvitationStatus(invitation).label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                          <span>Uses: {invitation.current_uses}/{invitation.max_uses}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <code className="text-xs font-mono">{invitation.invite_code}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyInviteCode(invitation.invite_code)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate Invitation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will prevent the invitation code from being used. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deactivateInvitation(invitation.id)}
                                className="bg-red-600"
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invitations.filter(inv => !activeInvitations.includes(inv)).length > 0 && (
              <div>
                <h4 className="font-medium text-muted-foreground mb-2">
                  Inactive/Expired Invitations ({invitations.filter(inv => !activeInvitations.includes(inv)).length})
                </h4>
                <div className="space-y-2">
                  {invitations
                    .filter(inv => !activeInvitations.includes(inv))
                    .map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">Admin Invitation</Badge>
                            <Badge variant={getInvitationStatus(invitation).variant}>
                              {getInvitationStatus(invitation).label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {isExpired(invitation.expires_at) ? 
                              `Expired ${new Date(invitation.expires_at).toLocaleDateString()}` :
                              `Uses: ${invitation.current_uses}/${invitation.max_uses}`
                            }
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-2 bg-muted rounded border">
                          <code className="text-xs font-mono">{invitation.invite_code}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyInviteCode(invitation.invite_code)}
                            className="h-6 w-6 p-0"
                            disabled={!invitation.is_active}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
