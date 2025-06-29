
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamOverviewTab } from "./team-admin/TeamOverviewTab";
import { TeamMembersTab } from "./team-admin/TeamMembersTab";
import { TeamInvitationsTab } from "./team-admin/TeamInvitationsTab";
import { TeamActivityLogTab } from "./team-admin/TeamActivityLogTab";
import { TeamGameTypesTab } from "./team-admin/TeamGameTypesTab";
import { TeamSettingsTab } from "./team-admin/TeamSettingsTab";
import { BarChart3, Users, Mail, Activity, Gamepad2, Settings } from "lucide-react";

interface UnifiedTeamManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  teamDescription?: string;
  teamLogoUrl?: string;
}

export function UnifiedTeamManagementDialog({ 
  isOpen, 
  onClose, 
  teamId, 
  teamName, 
  teamDescription,
  teamLogoUrl 
}: UnifiedTeamManagementDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Team Administration - {teamName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Members</span>
              </TabsTrigger>
              <TabsTrigger value="invites" className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Invites</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
              <TabsTrigger value="game-types" className="flex items-center gap-1">
                <Gamepad2 className="h-4 w-4" />
                <span className="hidden sm:inline">Game Types</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <TabsContent value="overview" className="mt-0">
                <TeamOverviewTab teamId={teamId} />
              </TabsContent>
              
              <TabsContent value="members" className="mt-0">
                <TeamMembersTab teamId={teamId} />
              </TabsContent>
              
              <TabsContent value="invites" className="mt-0">
                <TeamInvitationsTab teamId={teamId} />
              </TabsContent>
              
              <TabsContent value="activity" className="mt-0">
                <TeamActivityLogTab teamId={teamId} />
              </TabsContent>
              
              <TabsContent value="game-types" className="mt-0">
                <TeamGameTypesTab teamId={teamId} />
              </TabsContent>
              
              <TabsContent value="settings" className="mt-0">
                <TeamSettingsTab 
                  teamId={teamId}
                  teamName={teamName}
                  teamDescription={teamDescription}
                  teamLogoUrl={teamLogoUrl}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
