
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, UserPlus, Copy, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminAssignment {
  email: string;
  type: 'existing' | 'invitation';
  inviteCode?: string;
  expiresAt?: string;
  userId?: string;
  fullName?: string;
  isValidating?: boolean;
}

interface AdminAssignmentSectionProps {
  adminAssignments: AdminAssignment[];
  onAdminAssignmentsChange: (assignments: AdminAssignment[]) => void;
  teamId?: string;
  onTeamCreated?: (teamId: string) => void;
}

interface UserExistsResponse {
  exists: boolean;
  user_id?: string;
  full_name?: string;
}

export function AdminAssignmentSection({ 
  adminAssignments, 
  onAdminAssignmentsChange,
  teamId,
  onTeamCreated
}: AdminAssignmentSectionProps) {
  const [emailInput, setEmailInput] = useState("");
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    exists: boolean;
    fullName?: string;
  } | null>(null);

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

  const createTeamIfNeeded = async (teamName: string): Promise<string | null> => {
    if (teamId) return teamId;

    try {
      const { data, error } = await supabase.rpc('create_team_with_admin_invites', {
        team_name_param: teamName,
        team_description_param: null
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        const newTeamId = result.team_id;
        if (onTeamCreated) {
          onTeamCreated(newTeamId);
        }
        return newTeamId;
      } else {
        toast.error(result.error || 'Failed to create team');
        return null;
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
      return null;
    }
  };

  const addExistingAdmin = async () => {
    if (!emailInput.trim() || !emailValidation?.exists) {
      toast.error("Please enter a valid existing user email");
      return;
    }

    const emailExists = adminAssignments.some(
      admin => admin.email.toLowerCase() === emailInput.toLowerCase()
    );

    if (emailExists) {
      toast.error("This email has already been added");
      return;
    }

    const newAssignment: AdminAssignment = {
      email: emailInput.trim(),
      type: 'existing',
      fullName: emailValidation.fullName
    };

    onAdminAssignmentsChange([...adminAssignments, newAssignment]);
    setEmailInput("");
    setEmailValidation(null);
    toast.success("Existing admin added successfully");
  };

  const generateInviteCode = async () => {
    if (!emailInput.trim()) {
      toast.error("Please enter an email address first");
      return;
    }

    if (!isValidEmail(emailInput)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (emailValidation?.exists) {
      toast.error("User already exists. Use 'Add Admin' instead.");
      return;
    }

    const emailExists = adminAssignments.some(
      admin => admin.email.toLowerCase() === emailInput.toLowerCase()
    );

    if (emailExists) {
      toast.error("This email has already been added");
      return;
    }

    // Create team first if it doesn't exist
    const currentTeamId = await createTeamIfNeeded("New Team");
    if (!currentTeamId) return;

    try {
      const { data, error } = await supabase.rpc('create_admin_invitation_for_team', {
        team_id_param: currentTeamId,
        admin_email: emailInput.trim()
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        const newAssignment: AdminAssignment = {
          email: emailInput.trim(),
          type: 'invitation',
          inviteCode: result.invite_code,
          expiresAt: result.expires_at
        };

        onAdminAssignmentsChange([...adminAssignments, newAssignment]);
        setEmailInput("");
        setEmailValidation(null);
        toast.success("Admin invitation generated successfully");
      } else {
        toast.error(result.error || "Failed to generate invitation");
      }
    } catch (error) {
      console.error('Error generating invitation:', error);
      toast.error("Failed to generate admin invitation");
    }
  };

  const removeAdminEmail = (email: string) => {
    const filtered = adminAssignments.filter(admin => admin.email !== email);
    onAdminAssignmentsChange(filtered);
  };

  const copyInviteCode = (code: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(code);
    toast.success("Admin invitation code copied to clipboard");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (emailValidation?.exists) {
        addExistingAdmin();
      } else if (emailValidation !== null) {
        generateInviteCode();
      }
    }
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

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="admin-email">Assign Team Administrators</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Add users by email to assign as team administrators. At least one admin is required.
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
          
          <div className="flex gap-2">
            {emailValidation?.exists ? (
              <Button 
                type="button" 
                variant="outline" 
                onClick={addExistingAdmin}
                disabled={!emailInput.trim() || isValidatingEmail}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Existing Admin
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateInviteCode}
                disabled={!emailInput.trim() || isValidatingEmail || emailValidation?.exists}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Generate Admin Invite
              </Button>
            )}
          </div>
        </div>
      </div>

      {adminAssignments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Assigned Administrators ({adminAssignments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {adminAssignments.map((admin, index) => (
              <div key={admin.email} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <div className="font-medium">{admin.email}</div>
                    {admin.fullName && (
                      <div className="text-sm text-muted-foreground">{admin.fullName}</div>
                    )}
                    {admin.type === 'invitation' && admin.expiresAt && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires {new Date(admin.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  {admin.inviteCode && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded border">
                      <div className="text-xs text-muted-foreground font-medium">Admin Invite:</div>
                      <code className="text-xs font-mono">{admin.inviteCode}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => copyInviteCode(admin.inviteCode!, e)}
                        className="h-6 w-6 p-0"
                        type="button"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={admin.type === 'existing' ? 'default' : 'secondary'}>
                    {admin.type === 'existing' ? 'Existing User' : 'Pending Admin Invite'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdminEmail(admin.email)}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {adminAssignments.length === 0 && (
        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
          <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No administrators assigned yet</p>
          <p className="text-sm">Add at least one admin email to proceed</p>
        </div>
      )}
    </div>
  );
}
