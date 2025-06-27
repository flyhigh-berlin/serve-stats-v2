
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Settings, Mail } from "lucide-react";
import { toast } from "sonner";
import { TeamInvitationsManagement } from "./TeamInvitationsManagement";

interface TeamWithMembers {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  member_count: number;
  admin_count: number;
}

interface SuperAdminTeamManagementDialogProps {
  team: TeamWithMembers;
  isOpen: boolean;
  onClose: () => void;
  onTeamUpdated: () => void;
}

export function SuperAdminTeamManagementDialog({
  team,
  isOpen,
  onClose,
  onTeamUpdated
}: SuperAdminTeamManagementDialogProps) {
  const [teamName, setTeamName] = useState(team.name);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTeamName(team.name);
  }, [team]);

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      toast.error("Team name is required");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: teamName.trim() })
        .eq('id', team.id);

      if (error) throw error;

      toast.success("Team updated successfully");
      onTeamUpdated();
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Team: {team.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Admin Invitations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveTeam}
                  disabled={isSaving || teamName.trim() === team.name}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="mt-6">
            <TeamInvitationsManagement teamId={team.id} teamName={team.name} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
