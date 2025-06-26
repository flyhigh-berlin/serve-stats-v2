import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, Trash2, RotateCcw, Users, Activity } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TeamWithDetails {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
  admin_count: number;
  player_count?: number;
  game_count?: number;
  serve_count?: number;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_profile?: {
    email: string;
    full_name?: string;
  };
}

interface SuperAdminTeamManagementDialogProps {
  team: TeamWithDetails;
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
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState(team.name);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTeamName(team.name);
      loadTeamMembers();
      loadTeamStats();
    }
  }, [isOpen, team.id]);

  const loadTeamMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          user_profiles:user_id (
            email,
            full_name
          )
        `)
        .eq('team_id', team.id);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadTeamStats = async () => {
    try {
      const [playersRes, gamesRes, servesRes] = await Promise.all([
        supabase.from('players').select('id', { count: 'exact' }).eq('team_id', team.id),
        supabase.from('game_days').select('id', { count: 'exact' }).eq('team_id', team.id),
        supabase.from('serves').select('id', { count: 'exact' }).eq('team_id', team.id)
      ]);

      setTeamStats({
        players: playersRes.count || 0,
        games: gamesRes.count || 0,
        serves: servesRes.count || 0
      });
    } catch (error) {
      console.error('Error loading team stats:', error);
    }
  };

  const handleUpdateTeamName = async () => {
    if (!teamName.trim() || teamName === team.name) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: teamName.trim() })
        .eq('id', team.id);

      if (error) throw error;
      
      toast.success('Team name updated successfully');
      onTeamUpdated();
    } catch (error) {
      console.error('Error updating team name:', error);
      toast.error('Failed to update team name');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (memberId: string) => {
    try {
      const { error } = await supabase.rpc('change_member_role', {
        member_id_param: memberId,
        new_role: 'admin'
      });

      if (error) throw error;
      
      toast.success('Member promoted to admin');
      loadTeamMembers();
      onTeamUpdated();
    } catch (error) {
      console.error('Error promoting member:', error);
      toast.error('Failed to promote member');
    }
  };

  const handleDemoteFromAdmin = async (memberId: string) => {
    try {
      const { error } = await supabase.rpc('change_member_role', {
        member_id_param: memberId,
        new_role: 'member'
      });

      if (error) throw error;
      
      toast.success('Admin demoted to member');
      loadTeamMembers();
      onTeamUpdated();
    } catch (error) {
      console.error('Error demoting admin:', error);
      toast.error('Failed to demote admin');
    }
  };

  const handleDeleteTeam = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('delete_team_and_data', {
        team_id_param: team.id
      });

      if (error) throw error;
      
      toast.success('Team deleted successfully');
      onTeamUpdated();
      onClose();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    } finally {
      setLoading(false);
    }
  };

  const handleResetTeamData = async (preservePlayers: boolean = true) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('reset_team_data', {
        team_id_param: team.id,
        preserve_players: preservePlayers
      });

      if (error) throw error;
      
      toast.success(`Team data reset ${preservePlayers ? '(players preserved)' : '(all data cleared)'}`);
      loadTeamStats();
      onTeamUpdated();
    } catch (error) {
      console.error('Error resetting team data:', error);
      toast.error('Failed to reset team data');
    } finally {
      setLoading(false);
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

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="team-name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name"
                    />
                    <Button
                      onClick={handleUpdateTeamName}
                      disabled={loading || !teamName.trim() || teamName === team.name}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created:</span>
                    <span className="ml-2">{new Date(team.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Team ID:</span>
                    <span className="ml-2 font-mono text-xs">{team.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Administrators
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {member.user_profile?.full_name || member.user_profile?.email || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.user_profile?.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.role === 'admin' ? 'destructive' : 'secondary'}>
                            {member.role}
                          </Badge>
                          {member.role === 'admin' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDemoteFromAdmin(member.id)}
                            >
                              Demote
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteToAdmin(member.id)}
                            >
                              Promote
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Team Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamStats ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{teamStats.players}</div>
                      <div className="text-sm text-muted-foreground">Players</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{teamStats.games}</div>
                      <div className="text-sm text-muted-foreground">Games</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{teamStats.serves}</div>
                      <div className="text-sm text-muted-foreground">Serves</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Destructive Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Reset Team Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Clear all game data while optionally preserving players
                  </p>
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-orange-600">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset (Keep Players)
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset Team Data?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete all games, serves, and custom game types but keep all players and their roster information.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleResetTeamData(true)}>
                            Reset Data
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-red-600">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset All
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset All Team Data?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete ALL team data including players, games, and serves. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleResetTeamData(false)} className="bg-red-600">
                            Reset Everything
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Delete Team</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this team and all associated data
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Team
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
                        <AlertDialogAction onClick={handleDeleteTeam} className="bg-red-600">
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Delete Team
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
