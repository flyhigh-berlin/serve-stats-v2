
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminAssignmentSection } from "./AdminAssignmentSection";

interface AdminAssignment {
  email: string;
  type: 'existing' | 'invitation';
  inviteCode?: string;
  expiresAt?: string;
}

interface EnhancedTeamCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
}

export function EnhancedTeamCreationDialog({
  isOpen,
  onClose,
  onTeamCreated
}: EnhancedTeamCreationDialogProps) {
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [adminAssignments, setAdminAssignments] = useState<AdminAssignment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationStatus, setCreationStatus] = useState<{
    step: string;
    results: Array<{ email: string; success: boolean; message: string; }>;
  } | null>(null);

  const resetForm = () => {
    setTeamName("");
    setTeamDescription("");
    setAdminAssignments([]);
    setCreationStatus(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const createTeamWithAdmins = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      toast.error("Team name is required");
      return;
    }

    if (adminAssignments.length === 0) {
      toast.error("At least one administrator must be assigned");
      return;
    }

    setIsSubmitting(true);
    setCreationStatus({ step: "Creating team...", results: [] });

    try {
      // Step 1: Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ name: teamName.trim() })
        .select()
        .single();

      if (teamError) throw teamError;

      setCreationStatus({ step: "Assigning administrators...", results: [] });

      // Step 2: Process admin assignments
      const assignmentResults: Array<{ email: string; success: boolean; message: string; }> = [];
      
      for (const admin of adminAssignments) {
        try {
          // Check if user exists first
          const { data: userExists } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('email', admin.email)
            .single();

          if (userExists) {
            // User exists - assign directly
            const { data: result, error } = await supabase.rpc('assign_team_admin_by_email', {
              team_id_param: team.id,
              admin_email: admin.email
            });

            if (error) throw error;

            const resultData = result as any;
            if (resultData.success) {
              assignmentResults.push({
                email: admin.email,
                success: true,
                message: "Successfully assigned as admin"
              });
            } else {
              assignmentResults.push({
                email: admin.email,
                success: false,
                message: resultData.error || "Failed to assign admin"
              });
            }
          } else {
            // User doesn't exist - create invitation
            const { data: result, error } = await supabase.rpc('create_admin_invitation', {
              team_id_param: team.id,
              admin_email: admin.email
            });

            if (error) throw error;

            const resultData = result as any;
            if (resultData.success) {
              assignmentResults.push({
                email: admin.email,
                success: true,
                message: `Admin invitation sent (Code: ${resultData.invite_code})`
              });
            } else {
              assignmentResults.push({
                email: admin.email,
                success: false,
                message: resultData.error || "Failed to create admin invitation"
              });
            }
          }
        } catch (error) {
          console.error('Error processing admin assignment:', error);
          assignmentResults.push({
            email: admin.email,
            success: false,
            message: "Error processing admin assignment"
          });
        }
      }

      setCreationStatus({ 
        step: "Team creation completed", 
        results: assignmentResults 
      });

      const successCount = assignmentResults.filter(r => r.success).length;
      if (successCount > 0) {
        toast.success(`Team "${teamName}" created with ${successCount} admin(s) assigned!`);
        onTeamCreated();
      } else {
        toast.error("Team created but no admins were assigned successfully");
      }

    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
      setCreationStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>

        {creationStatus ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium">{creationStatus.step}</h3>
              {isSubmitting && <Loader2 className="h-6 w-6 animate-spin mx-auto mt-2" />}
            </div>

            {creationStatus.results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Administrator Assignment Results:</h4>
                {creationStatus.results.map((result, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{result.email}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSubmitting && (
              <div className="flex justify-end">
                <Button onClick={handleClose}>Close</Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={createTeamWithAdmins}>
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name *</Label>
                  <Input
                    id="team-name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="team-description">Description (Optional)</Label>
                  <Textarea
                    id="team-description"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Brief description of the team"
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              <AdminAssignmentSection
                adminAssignments={adminAssignments}
                onAdminAssignmentsChange={setAdminAssignments}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !teamName.trim() || adminAssignments.length === 0}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Team
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
