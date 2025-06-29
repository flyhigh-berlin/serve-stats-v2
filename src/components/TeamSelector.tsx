
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTeam } from "@/context/TeamContext";
import { EnhancedTeamCreationDialog } from "./EnhancedTeamCreationDialog";
import { UnifiedTeamManagementDialog } from "./UnifiedTeamManagementDialog";
import { Users, Settings, Plus, Crown, Shield } from "lucide-react";

export function TeamSelector() {
  const { teams, currentTeam, switchTeam, isSuperAdmin, isTeamAdmin } = useTeam();
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);

  const handleTeamChange = (teamId: string) => {
    switchTeam(teamId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium mb-2 block">Current Team</label>
            <Select value={currentTeam?.id || ""} onValueChange={handleTeamChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <span>{team.name}</span>
                      {team.role === 'admin' && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            {currentTeam && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => setIsManagementDialogOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  Manage Team
                </Button>
                
                <UnifiedTeamManagementDialog
                  isOpen={isManagementDialogOpen}
                  onClose={() => setIsManagementDialogOpen(false)}
                  teamId={currentTeam.id}
                  teamName={currentTeam.name}
                  teamDescription={currentTeam.description}
                  teamLogoUrl={currentTeam.logo_url}
                />
              </>
            )}
            
            {isSuperAdmin && (
              <EnhancedTeamCreationDialog>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Team
                </Button>
              </EnhancedTeamCreationDialog>
            )}
          </div>
        </div>

        {currentTeam && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Role:</span>
            <Badge variant={currentTeam.role === 'admin' ? 'default' : 'secondary'}>
              {currentTeam.role === 'admin' ? (
                <>
                  <Crown className="h-3 w-3 mr-1" />
                  Administrator
                </>
              ) : (
                <>
                  <Users className="h-3 w-3 mr-1" />
                  Member
                </>
              )}
            </Badge>
            {isSuperAdmin && (
              <Badge variant="destructive" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
            )}
          </div>
        )}

        {teams.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p>You are not a member of any teams yet.</p>
            <p className="text-sm">Ask your team administrator for an invitation code to join a team.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
