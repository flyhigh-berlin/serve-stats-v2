
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamInvitationsManagement } from "./TeamInvitationsManagement";
import { TeamMemberInvitationManagement } from "./TeamMemberInvitationManagement";
import { Shield, Users } from "lucide-react";

interface TeamInvitationsTabsProps {
  teamId: string;
  teamName: string;
}

export function TeamInvitationsTabs({ teamId, teamName }: TeamInvitationsTabsProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="admin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admin Invitations
          </TabsTrigger>
          <TabsTrigger value="member" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Member Invitations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="admin" className="mt-6">
          <TeamInvitationsManagement teamId={teamId} teamName={teamName} />
        </TabsContent>
        
        <TabsContent value="member" className="mt-6">
          <TeamMemberInvitationManagement teamId={teamId} teamName={teamName} />
        </TabsContent>
      </Tabs>

      <div className="bg-muted/50 border rounded-lg p-4">
        <h3 className="font-medium mb-2">Understanding Invitation Types</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 text-orange-600" />
            <div>
              <strong className="text-orange-600">Admin Invitations:</strong> Single-use, email-specific invitations that grant administrative privileges. Admins can manage team settings, players, and invitations.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <strong className="text-blue-600">Member Invitations:</strong> Reusable invitation codes that allow multiple users to join as team members. Members can view team data but cannot manage settings.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
