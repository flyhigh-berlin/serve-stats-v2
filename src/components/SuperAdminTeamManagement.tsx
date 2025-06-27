
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Users, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminTeamManagementDialog } from "./SuperAdminTeamManagementDialog";
import { SuperAdminTeamMembersDialog } from "./SuperAdminTeamMembersDialog";
import { EnhancedTeamCreationDialog } from "./EnhancedTeamCreationDialog";

interface TeamWithMembers {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  member_count: number;
  admin_count: number;
}

export function SuperAdminTeamManagement() {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTeamForManagement, setSelectedTeamForManagement] = useState<TeamWithMembers | null>(null);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<TeamWithMembers | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          created_at,
          created_by,
          team_members (
            id,
            role
          )
        `);

      if (error) throw error;

      const teamsWithCounts = data.map(team => ({
        id: team.id,
        name: team.name,
        created_at: team.created_at,
        created_by: team.created_by,
        member_count: team.team_members.length,
        admin_count: team.team_members.filter(m => m.role === 'admin').length
      }));

      setTeams(teamsWithCounts);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    setDeletingTeamId(teamId);
    try {
      const { error } = await supabase.rpc('delete_team_and_data', {
        team_id_param: teamId
      });

      if (error) throw error;
      
      toast.success(`Team "${teamName}" deleted successfully`);
      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    } finally {
      setDeletingTeamId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground">
            Create and manage teams with administrator assignments
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      <div className="grid gap-4">
        {teams.map(team => (
          <Card key={team.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(team.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {team.member_count} members
                  </Badge>
                  <Badge variant="outline">
                    {team.admin_count} admins
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTeamForManagement(team)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTeamForMembers(team)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Members
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="ml-auto">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Team "{team.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the team and ALL associated data including members, players, games, and serves. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className="bg-red-600"
                      >
                        {deletingTeamId === team.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Team
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Team Creation Dialog */}
      <EnhancedTeamCreationDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onTeamCreated={() => {
          setIsCreateDialogOpen(false);
          loadTeams();
        }}
      />

      {/* Team Management Dialog */}
      {selectedTeamForManagement && (
        <SuperAdminTeamManagementDialog
          team={selectedTeamForManagement}
          isOpen={!!selectedTeamForManagement}
          onClose={() => setSelectedTeamForManagement(null)}
          onTeamUpdated={loadTeams}
        />
      )}

      {/* Team Members Dialog */}
      {selectedTeamForMembers && (
        <SuperAdminTeamMembersDialog
          team={selectedTeamForMembers}
          isOpen={!!selectedTeamForMembers}
          onClose={() => setSelectedTeamForMembers(null)}
          onTeamUpdated={loadTeams}
        />
      )}
    </div>
  );
}
