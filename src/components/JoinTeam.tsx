
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeam } from "@/context/TeamContext";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Users, UserPlus, AlertCircle, CheckCircle, LogOut } from "lucide-react";
import { toast } from "sonner";

interface JoinTeamProps {
  onSuccess?: () => void;
}

export function JoinTeam({ onSuccess }: JoinTeamProps) {
  const { joinTeam } = useTeam();
  const { signOut } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{
    teamName: string;
    role: string;
    isValidating?: boolean;
    error?: string;
  } | null>(null);

  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setInviteInfo(null);
      return;
    }
    
    setInviteInfo(prev => ({ ...prev, isValidating: true, error: undefined }) as any);
    
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.rpc('validate_invite_code', {
        code: code.trim()
      });

      if (error) throw error;
      
      if (data && data[0]?.is_valid) {
        const invitation = data[0];
        const role = invitation.admin_role ? 'Administrator' : 'Member';
        
        setInviteInfo({
          teamName: invitation.team_name,
          role: role,
          isValidating: false
        });
      } else {
        const errorMessage = data[0]?.error_message || 'Invalid invitation code';
        setInviteInfo({
          teamName: '',
          role: '',
          isValidating: false,
          error: errorMessage
        });
      }
    } catch (error) {
      console.error('Error validating invite code:', error);
      setInviteInfo({
        teamName: '',
        role: '',
        isValidating: false,
        error: 'Failed to validate invitation code'
      });
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      toast.error('Please enter an invitation code');
      return;
    }

    if (inviteInfo?.error) {
      toast.error(inviteInfo.error);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await joinTeam(inviteCode.trim());
      
      if (error) {
        toast.error(error);
      } else {
        toast.success(`Successfully joined ${inviteInfo?.teamName}!`);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Join team error:', error);
      toast.error('Failed to join team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="text-center mb-8">
          <Users className="h-16 w-16 mx-auto mb-4 text-team-primary" />
          <h1 className="text-3xl font-bold text-team-primary">Join a Team</h1>
          <p className="text-muted-foreground mt-2">
            Enter an invitation code to join your team and get started
          </p>
        </div>

        {inviteInfo && !inviteInfo.error && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Valid Invitation</p>
                  <p className="text-sm text-green-700">
                    Join <strong>{inviteInfo.teamName}</strong> as a <strong>{inviteInfo.role}</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {inviteInfo?.error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Invalid Invitation</p>
                  <p className="text-sm text-red-700">{inviteInfo.error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Team Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinTeam} className="space-y-6">
              <div>
                <Label htmlFor="invite-code">Invitation Code</Label>
                <Input
                  id="invite-code"
                  type="text"
                  placeholder="Enter invitation code"
                  value={inviteCode}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInviteCode(value);
                    validateInviteCode(value);
                  }}
                  disabled={isSubmitting}
                  className="mt-2"
                />
                {inviteInfo?.isValidating && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Validating invitation code...
                  </div>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || inviteInfo?.isValidating || Boolean(inviteCode && inviteInfo?.error)}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <UserPlus className="mr-2 h-4 w-4" />
                Join Team
              </Button>
            </form>
            
            <div className="mt-6 text-sm text-muted-foreground text-center">
              <p>Don't have an invitation code?</p>
              <p>Ask your team administrator for one to get started.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
