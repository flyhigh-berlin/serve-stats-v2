import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AdminAssignmentSection } from "./AdminAssignmentSection";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminAssignment {
  email: string;
  type: 'existing' | 'invitation';
  inviteCode?: string;
  expiresAt?: string;
  userId?: string;
  fullName?: string;
}

interface EnhancedTeamCreationDialogProps {
  children: React.ReactNode;
  onTeamCreated?: () => void;
}

export function EnhancedTeamCreationDialog({
  children,
  onTeamCreated
}: EnhancedTeamCreationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [adminAssignments, setAdminAssignments] = useState<AdminAssignment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);
  const [creationStatus, setCreationStatus] = useState<{
    step: string;
    results: Array<{ email: string; success: boolean; message: string; }>;
  } | null>(null);

  const resetForm = () => {
    setTeamName("");
    setTeamDescription("");
    setAdminAssignments([]);
    setCreatedTeamId(null);
    setCreationStatus(null);
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleTeamCreated = (teamId: string) => {
    setCreatedTeamId(teamId);
    if (!teamName.trim()) {
      setTeamName("New Team");
    }
  };

  const finalizeTeamCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      toast.error("Team name is required");
      return;
    }

    setIsSubmitting(true);
    setCreationStatus({ step: "Creating team...", results: [] });

    try {
      let currentTeamId = createdTeamId;

      // Create team if not already created
      if (!currentTeamId) {
        const { data, error } = await supabase.rpc('create_team_with_admin_invites', {
          team_name_param: teamName.trim(),
          team_description_param: teamDescription.trim() || null
        });

        if (error) throw error;

        const result = data as any;
        if (result.success) {
          currentTeamId = result.team_id;
          setCreatedTeamId(currentTeamId);
        } else {
          throw new Error(result.error || 'Failed to create team');
        }
      } else {
        // Update team name if it was created with a placeholder
        const { error } = await supabase
          .from('teams')
          .update({ name: teamName.trim() })
          .eq('id', currentTeamId);

        if (error) throw error;
      }

      // Process admin assignments if any
      const assignmentResults: Array<{ email: string; success: boolean; message: string; }> = [];
      
      if (adminAssignments.length > 0) {
        setCreationStatus({ step: "Processing admin assignments...", results: [] });
        
        for (const admin of adminAssignments) {
          try {
            if (admin.type === 'existing') {
              // Assign existing user directly
              const { data: result, error } = await supabase.rpc('assign_team_admin_by_email', {
                team_id_param: currentTeamId,
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
              // Invitation already created, just track it
              assignmentResults.push({
                email: admin.email,
                success: true,
                message: `Admin invitation ready (Code: ${admin.inviteCode})`
              });
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
      }

      setCreationStatus({ 
        step: "Team creation completed", 
        results: assignmentResults 
      });

      if (adminAssignments.length > 0) {
        const successCount = assignmentResults.filter(r => r.success).length;
        if (successCount > 0) {
          toast.success(`Team "${teamName}" created with ${successCount} admin(s) assigned!`);
        } else {
          toast.warning(`Team "${teamName}" created but no admins were assigned successfully`);
        }
      } else {
        toast.success(`Team "${teamName}" created successfully!`);
        toast.warning("Remember to assign at least one administrator to manage this team");
      }
      
      onTeamCreated?.();

    } catch (error) {
      console.error('Error finalizing team creation:', error);
      toast.error('Failed to finalize team creation');
      setCreationStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = teamName.trim() && !isSubmitting;
  const hasNoAdmins = adminAssignments.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent size="large" className="flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>

        {creationStatus ? (
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
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
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.email}</div>
                        <div className="text-sm text-muted-foreground">{result.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <form onSubmit={finalizeTeamCreation} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1">
              <div className="space-y-6 pr-4">
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
                  teamId={createdTeamId}
                  onTeamCreated={handleTeamCreated}
                />

                {hasNoAdmins && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> No administrators have been assigned to this team. 
                      Teams should have at least one administrator to manage members and settings. 
                      You can assign administrators later from the team management page.
                    </AlertDescription>
                  </Alert>
                )}

                {createdTeamId && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      Team created successfully! You can continue adding admins or finalize the setup.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="flex-shrink-0 mt-6">
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!canSubmit}
                className={hasNoAdmins ? 'bg-orange-600 hover:bg-orange-700' : undefined}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <span className="hidden sm:inline">
                  {hasNoAdmins ? 'Create Team (No Admin)' : (createdTeamId ? 'Finalize Team Setup' : 'Create Team')}
                </span>
                <span className="sm:hidden">
                  {createdTeamId ? 'Finalize' : 'Create'}
                </span>
              </Button>
            </DialogFooter>
          </form>
        )}

        {creationStatus && !isSubmitting && (
          <DialogFooter className="flex-shrink-0">
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
