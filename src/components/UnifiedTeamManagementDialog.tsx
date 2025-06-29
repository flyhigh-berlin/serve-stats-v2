
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeam } from "@/context/TeamContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Users, UserPlus, Database, Activity, Gamepad2, BarChart3 } from "lucide-react";
import { TeamOverviewTab } from "./team-admin/TeamOverviewTab";
import { EnhancedTeamMemberManagement } from "./team-admin/EnhancedTeamMemberManagement";
import { EnhancedTeamInvitations } from "./EnhancedTeamInvitations";
import { TeamSettingsTab } from "./team-admin/TeamSettingsTab";
import { TeamActivityLogTab } from "./team-admin/TeamActivityLogTab";
import { TeamGameTypesTab } from "./team-admin/TeamGameTypesTab";

interface UnifiedTeamManagementDialogProps {
  children: React.ReactNode;
}

export function UnifiedTeamManagementDialog({ children }: UnifiedTeamManagementDialogProps) {
  const { currentTeam, isTeamAdmin } = useTeam();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentTeam || !isTeamAdmin) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent size="adaptive" className="flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            Team Administration: {currentTeam.name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-6 mb-6 flex-shrink-0 h-auto">
            <TabsTrigger value="overview" className="flex flex-col items-center gap-1 p-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex flex-col items-center gap-1 p-2">
              <Users className="h-4 w-4" />
              <span className="text-xs">Members</span>
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex flex-col items-center gap-1 p-2">
              <UserPlus className="h-4 w-4" />
              <span className="text-xs">Invites</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col items-center gap-1 p-2">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex flex-col items-center gap-1 p-2">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="gametypes" className="flex flex-col items-center gap-1 p-2">
              <Gamepad2 className="h-4 w-4" />
              <span className="text-xs">Games</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 min-h-0">
            <TabsContent value="overview" className="mt-0 h-full">
              <ScrollArea className="h-full">
                <div className="pr-4">
                  <TeamOverviewTab teamId={currentTeam.id} />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="members" className="mt-0 h-full">
              <ScrollArea className="h-full">
                <div className="pr-4">
                  <EnhancedTeamMemberManagement teamId={currentTeam.id} />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="invitations" className="mt-0 h-full">
              <ScrollArea className="h-full">
                <div className="pr-4">
                  <EnhancedTeamInvitations 
                    teamId={currentTeam.id} 
                    teamName={currentTeam.name} 
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0 h-full">
              <ScrollArea className="h-full">
                <div className="pr-4">
                  <TeamSettingsTab teamId={currentTeam.id} />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-0 h-full">
              <ScrollArea className="h-full">
                <div className="pr-4">
                  <TeamActivityLogTab teamId={currentTeam.id} />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="gametypes" className="mt-0 h-full">
              <ScrollArea className="h-full">
                <div className="pr-4">
                  <TeamGameTypesTab teamId={currentTeam.id} />
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
