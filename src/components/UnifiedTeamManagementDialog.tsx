
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamInvitationsTabs } from "./TeamInvitationsTabs";
import { TeamMembersManagement } from "./TeamMembersManagement";
import { Settings, Users, Shield, BarChart3 } from "lucide-react";
import { useTeam } from "@/context/TeamContext";
import { useAuth } from "@/context/AuthContext";

interface UnifiedTeamManagementDialogProps {
  children: React.ReactNode;
}

export function UnifiedTeamManagementDialog({ children }: UnifiedTeamManagementDialogProps) {
  const { currentTeam, isTeamAdmin } = useTeam();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentTeam || !user) {
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
            <TeamMembersManagement
              teamId={currentTeam.id}
              teamName={currentTeam.name}
              currentUserId={user.id}
              isTeamAdmin={isTeamAdmin}
            />
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
