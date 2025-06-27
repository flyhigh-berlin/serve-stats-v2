import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Plus, UserPlus, Trash2, RefreshCw, Calendar, Clock, Info, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TeamInvitation {
  id: string;
  invite_code: string;
  invited_email: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  accepted_at?: string;
  accepted_by?: string;
  admin_role: boolean;
  invitation_type: string;
}

interface TeamInvitationsManagementProps {
  teamId: string;
  teamName: string;
  onInvitationChange?: () => void;
}

interface UserExistsResponse {
  exists: boolean;
  user_id?: string;
  full_name?: string;
}

export function TeamInvitationsManagement({ teamId, teamName, onInvitationChange }: TeamInvitationsManagementProps) {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    exists: boolean;
    fullName?: string;
  } | null>(null);

  useEffect(() => {
    loadAdminInvitations();
  }, [teamId]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateEmail = async (email: string) => {
    if (!isValidEmail(email)) return null;
    
    setIsValidatingEmail(true);
    try {
      const { data, error } = await supabase.rpc('check_user_exists_by_email', {
        email_param: email
      });

      if (error) throw error;
      
      const result = data as unknown as UserExistsResponse;
      const validation = { exists: result.exists, fullName: result.full_name };
      setEmailValidation(validation);
      return validation;
    } catch (error) {
      console.error('Error validating email:', error);
      toast.error('Failed to validate email');
      return null;
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const handleEmailChange = async (email: string) => {
    setEmailInput(email);
    setEmailValidation(null);
    
    if (email && isValidEmail(email)) {
      await validateEmail(email);
    }
  };

  const loadAdminInvitations = async () => {
    setLoading(true);
    try {
      // STRICTLY load only admin invitations - never member invitations
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('invitation_type', 'admin') // STRICT filter for admin invitations only
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Double-check: ensure we only process admin invitations
      const adminInvitations = data?.filter(inv => inv.invitation_type === 'admin') || [];
      setInvitations(adminInvitations);
      console.log('Loaded admin invitations:', adminInvitations);
      
      // Call the callback to notify parent of data change
      if (onInvitationChange) {
        onInvitationChange();
      }
    } catch (error) {
      console.error('Error loading admin invitations:', error);
      toast.error('Failed to load admin invitations');
    } finally {
      setLoading(false);
    }
  };

  const createAdminInvitation = async () => {
    if (!emailInput.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!isValidEmail(emailInput)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check if invitation already exists for this email
    const existingInvitation = invitations.find(
      inv => inv.invited_email.toLowerCase() === emailInput.toLowerCase()
    );

    if (existingInvitation) {
      toast.error("An invitation already exists for this email");
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_admin_invitation_for_team', {
        team_id_param: teamId,
        admin_email: emailInput.trim()
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast.success("Admin invitation created successfully");
        setEmailInput("");
        setEmailValidation(null);
        await loadAdminInvitations();
      } else {
        toast.error(result.error || "Failed to create admin invitation");
      }
    } catch (error) {
      console.error('Error creating admin invitation:', error);
      toast.error('Failed to create admin invitation');
    } finally {
      setCreating(false);
    }
  };

  const deactivateInvitation = async (invitationId: string, email: string) => {
    setDeactivating(invitationId);
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ is_active: false })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success(`Admin invitation for ${email} deactivated`);
      await loadAdminInvitations();
    } catch (error) {
      console.error('Error deactivating invitation:', error);
      toast.error('Failed to deactivate invitation');
    } finally {
      setDeactivating(null);
    }
  };

  const copyInviteCode = (code: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(code);
    toast.success("Admin invitation code copied to clipboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getEmailValidationDisplay = () => {
    if (isValidatingEmail) {
      return <span className="text-xs text-muted-foreground">Validating...</span>;
    }
    
    if (emailValidation?.exists) {
      return (
        <span className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          User exists{emailValidation.fullName && `: ${emailValidation.fullName}`}
        </span>
      );
    }
    
    if (emailValidation && !emailValidation.exists && emailInput) {
      return <span className="text-xs text-orange-600">New user - will need invitation</span>;
    }
    
    return null;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createAdminInvitation();
    }
  };

  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Admin Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading admin invitations...
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
            <UserPlus className="h-5 w-5" />
            Admin Invitations for {teamName}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadAdminInvitations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Admin Invitation */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div>
            <Label htmlFor="admin-email">Create Admin Invitation</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Enter an email address to create a single-use admin invitation.
            </p>
            
            <div className="space-y-2">
              <Input
                id="admin-email"
                type="email"
                value={emailInput}
                onChange={(e) => handleEmailChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter admin email address"
                className="w-full"
              />
              
              {getEmailValidationDisplay()}
              
              <Button 
                onClick={createAdminInvitation}
                disabled={!emailInput.trim() || isValidatingEmail || creating}
                className="w-full"
              >
                {creating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Admin Invitation
              </Button>
            </div>
          </div>
        </div>

        {/* Existing Admin Invitations */}
        {invitations.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-medium">Active Admin Invitations ({invitations.filter(inv => inv.is_active).length})</h3>
            {invitations.map(invitation => (
              <div key={invitation.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={invitation.is_active ? "default" : "secondary"}>
                      {invitation.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {invitation.accepted_at && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepted
                      </Badge>
                    )}
                  </div>
                  {invitation.is_active && !invitation.accepted_at && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deactivating === invitation.id}>
                          {deactivating === invitation.id ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Deactivate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate Admin Invitation?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will prevent the invitation for {invitation.invited_email} from being used. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deactivateInvitation(invitation.id, invitation.invited_email)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Deactivate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                    <div className="text-sm mt-1">{invitation.invited_email}</div>
                  </div>

                  {invitation.is_active && !invitation.accepted_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Admin Invitation Code</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded border">
                          {invitation.invite_code}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => copyInviteCode(invitation.invite_code, e)}
                          type="button"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(invitation.created_at)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Expires</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(invitation.expires_at)}
                      </div>
                    </div>
                  </div>

                  {invitation.accepted_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Accepted</label>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {formatDate(invitation.accepted_at)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No admin invitations created yet</p>
            <p className="text-sm">Create an invitation above to invite new admins</p>
          </div>
        )}

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-800 mb-2">Admin Invitation Info:</p>
              <ul className="text-orange-700 space-y-1">
                <li>• Admin invitations are single-use and email-specific</li>
                <li>• Admins can manage team settings, players, and create new invitations</li>
                <li>• Send the invitation code to the intended admin via secure communication</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
