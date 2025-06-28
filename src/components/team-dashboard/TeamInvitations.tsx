
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamInvitationsTabs } from "@/components/TeamInvitationsTabs";
import { Mail } from "lucide-react";

interface TeamInvitationsProps {
  teamId: string;
  isAdmin: boolean;
}

export function TeamInvitations({ teamId, isAdmin }: TeamInvitationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Team Invitations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TeamInvitationsTabs teamId={teamId} teamName="" />
      </CardContent>
    </Card>
  );
}
