
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeam } from "@/context/TeamContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TeamMemberManagement } from "./TeamMemberManagement";
import { EnhancedTeamInvitations } from "./EnhancedTeamInvitations";
import { TeamDataManagement } from "./TeamDataManagement";
import { Settings, Users, UserPlus, Database } from "lucide-react";

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
      <DialogContent size="full-width" className="flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            Team Administration: {currentTeam.name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="members" className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-3 mb-6 flex-shrink-0">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
              <span className="sm:hidden">Members</span>
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Invitations</span>
              <span className="sm:hidden">Invites</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data Management</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 min-h-0">
            <TabsContent value="members" className="mt-0 h-full">
              <ScrollArea className="h-full">
                <div className="pr-4">
                  <TeamMemberManagement teamId={currentTeam.id} />
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
            
            <TabsContent value="data" className="mt-0 h-full">
              <ScrollArea className="h-full">
                <div className="pr-4">
                  <TeamDataManagement 
                    teamId={currentTeam.id} 
                    teamName={currentTeam.name} 
                  />
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
