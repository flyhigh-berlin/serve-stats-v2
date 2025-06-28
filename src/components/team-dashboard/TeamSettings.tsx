
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Save, Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TeamSettingsProps {
  teamId: string;
}

export function TeamSettings({ teamId }: TeamSettingsProps) {
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const queryClient = useQueryClient();

  const { data: teamDetails, isLoading } = useQuery({
    queryKey: ['team-details', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  // Update form when data is loaded
  useEffect(() => {
    if (teamDetails) {
      setTeamName(teamDetails.name);
      setTeamDescription((teamDetails as any).description || "");
    }
  }, [teamDetails]);

  const updateTeamMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .update({ 
          name: name.trim(), 
          description: description.trim() || null,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', teamId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-details', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team settings updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update team settings');
      console.error('Error updating team:', error);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      // Delete team members first
      await supabase.from('team_members').delete().eq('team_id', teamId);
      
      // Delete team invitations
      await supabase.from('team_invitations').delete().eq('team_id', teamId);
      
      // Delete team activity
      await supabase.from('team_activity_audit').delete().eq('team_id', teamId);
      
      // Finally delete the team
      const { error } = await supabase.from('teams').delete().eq('id', teamId);
      if (error) throw error;
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Team deleted successfully');
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast.error('Failed to delete team');
      console.error('Error deleting team:', error);
    },
  });

  const handleSaveSettings = () => {
    if (!teamName.trim()) {
      toast.error('Team name is required');
      return;
    }

    updateTeamMutation.mutate({
      name: teamName,
      description: teamDescription,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Team Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamDescription">Team Description</Label>
            <Textarea
              id="teamDescription"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="Enter team description (optional)"
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSaveSettings}
            disabled={updateTeamMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateTeamMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Delete Team</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete this team and all associated data. This action cannot be undone.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{teamDetails?.name}"? This will permanently delete:
                    <ul className="list-disc ml-6 mt-2">
                      <li>All team members and their data</li>
                      <li>All team invitations</li>
                      <li>All players and game data</li>
                      <li>All team settings and configurations</li>
                    </ul>
                    <br />
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteTeamMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
