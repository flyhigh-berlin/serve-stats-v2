
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamInvitationsTabs } from "./TeamInvitationsTabs";
import { Settings, Users, Shield, BarChart3 } from "lucide-react";
import { useTeam } from "@/context/TeamContext";
import { PlayerManagementDialog } from "./PlayerManagementDialog";

interface UnifiedTeamManagementDialogProps {
  children: React.ReactNode;
}

export function UnifiedTeamManagementDialog({ children }: UnifiedTeamManagementDialogProps) {
  const { currentTeam, isTeamAdmin } = useTeam();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentTeam) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            Manage Team: {currentTeam.name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </TabsTrigger>
            {isTeamAdmin && (
              <TabsTrigger value="invitations" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Invitations
              </TabsTrigger>
            )}
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Team Stats
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Team Members</h3>
                {isTeamAdmin && (
                  <PlayerManagementDialog>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Players
                    </Button>
                  </PlayerManagementDialog>
                )}
              </div>
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Team member management interface will be implemented here.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {isTeamAdmin && (
            <TabsContent value="invitations" className="mt-0">
              <TeamInvitationsTabs teamId={currentTeam.id} teamName={currentTeam.name} />
            </TabsContent>
          )}
          
          <TabsContent value="stats" className="mt-0">
            <div className="bg-muted/30 rounded-lg p-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                Team statistics and analytics will be displayed here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
