
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeam } from "@/context/TeamContext";
import { TeamOverview } from "@/components/team-dashboard/TeamOverview";
import { TeamMemberList } from "@/components/team-dashboard/TeamMemberList";
import { TeamSettings } from "@/components/team-dashboard/TeamSettings";
import { TeamActivity } from "@/components/team-dashboard/TeamActivity";
import { TeamInvitations } from "@/components/team-dashboard/TeamInvitations";
import { Navigate } from "react-router-dom";
import { Users, Settings, Activity, Mail, BarChart3 } from "lucide-react";

export default function TeamDashboard() {
  const { currentTeam, isTeamAdmin, loading } = useTeam();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentTeam) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Team Dashboard</h1>
            <p className="text-muted-foreground">
              {currentTeam.name} • {isTeamAdmin ? "Administrator" : "Member"}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Invitations</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            {isTeamAdmin && (
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <TeamOverview teamId={currentTeam.id} />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <TeamMemberList teamId={currentTeam.id} isAdmin={isTeamAdmin} />
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <TeamInvitations teamId={currentTeam.id} isAdmin={isTeamAdmin} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <TeamActivity teamId={currentTeam.id} />
          </TabsContent>

          {isTeamAdmin && (
            <TabsContent value="settings" className="space-y-6">
              <TeamSettings teamId={currentTeam.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
