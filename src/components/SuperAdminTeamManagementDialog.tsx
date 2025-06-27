
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TeamInvitationsTabs } from "./TeamInvitationsTabs";

interface SuperAdminTeamManagementDialogProps {
  team: {
    id: string;
    name: string;
    created_at: string;
    created_by: string;
    member_count: number;
    admin_count: number;
  };
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Team: {team.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Team ID</div>
              <div className="font-mono text-sm">{team.id}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created</div>
              <div className="text-sm">{new Date(team.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Members</div>
              <div className="text-sm">{team.member_count}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Administrators</div>
              <div className="text-sm">{team.admin_count}</div>
            </div>
          </div>

          <TeamInvitationsTabs teamId={team.id} teamName={team.name} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
