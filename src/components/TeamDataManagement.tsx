
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Database, RotateCcw, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

interface TeamDataManagementProps {
  teamId: string;
  teamName: string;
}

export function TeamDataManagement({ teamId, teamName }: TeamDataManagementProps) {
  const queryClient = useQueryClient();
  const [preservePlayers, setPreservePlayers] = useState(true);

  const resetTeamDataMutation = useMutation({
    mutationFn: async (preservePlayersFlag: boolean) => {
      const { data, error } = await supabase.rpc('reset_team_data', {
        team_id_param: teamId,
        preserve_players: preservePlayersFlag
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      queryClient.invalidateQueries({ queryKey: ['game-days'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success(preservePlayers ? 'Team data reset successfully (players preserved)' : 'Team data reset successfully (all data cleared)');
    },
    onError: (error) => {
      console.error('Error resetting team data:', error);
      toast.error('Failed to reset team data');
    }
  });

  const handleResetTeamData = () => {
    resetTeamDataMutation.mutate(preservePlayers);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Team Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Data Management Options</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  These operations will permanently affect your team's data. Please proceed with caution.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <RotateCcw className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium">Reset Team Data</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Remove all game data and serves while optionally preserving your player roster and team settings.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserve-players"
                    checked={preservePlayers}
                    onCheckedChange={(checked) => setPreservePlayers(checked === true)}
                  />
                  <label
                    htmlFor="preserve-players"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Preserve player roster (recommended)
                  </label>
                </div>

                <div className="text-sm text-muted-foreground pl-6">
                  {preservePlayers ? (
                    <>
                      <strong>What will be deleted:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>All game days and match data</li>
                        <li>All serve records and statistics</li>
                        <li>All custom game types</li>
                      </ul>
                      <strong className="block mt-2">What will be preserved:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Player roster (names will be kept, stats reset to 0)</li>
                        <li>Team settings and configuration</li>
                        <li>Team members and their roles</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <strong className="text-red-600">This will delete everything except:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Team members and their roles</li>
                        <li>Basic team information (name, creation date)</li>
                      </ul>
                      <strong className="block mt-2 text-red-600">All other data will be permanently deleted!</strong>
                    </>
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      disabled={resetTeamDataMutation.isPending}
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {resetTeamDataMutation.isPending ? 'Resetting...' : 'Reset Team Data'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Team Data</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>
                          Are you sure you want to reset the data for team "{teamName}"? This action cannot be undone.
                        </p>
                        {preservePlayers ? (
                          <p className="text-green-600 font-medium">
                            ✓ Player roster will be preserved (stats reset to 0)
                          </p>
                        ) : (
                          <p className="text-red-600 font-medium">
                            ⚠️ ALL data including players will be deleted!
                          </p>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetTeamData}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {preservePlayers ? 'Reset Data (Keep Players)' : 'Reset All Data'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
