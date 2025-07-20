
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useTeam } from "../context/TeamContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TeamSelector } from "@/components/TeamSelector";
import { PlayerList } from "@/components/PlayerList";
import { GameDaySelector } from "@/components/GameDaySelector";
import { Scoreboard } from "@/components/Scoreboard";
import { GameHistory } from "@/components/GameHistory";
import { StatsDescription } from "@/components/StatsDescription";
import { RealTimeStatus } from "@/components/RealTimeStatus";
import { RealTimeDebugger } from "@/components/RealTimeDebugger";
import { UnifiedTeamManagementDialog } from "@/components/UnifiedTeamManagementDialog";
import { LogOut, Settings, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

// Create a wrapper component for the volleyball tracking
const VolleyballTracker = () => {
  return (
    <>
      <div className="mb-4">
        <GameDaySelector />
      </div>
      
      <Tabs defaultValue="players" className="w-full">
        <StatsDescription />
        
        <TabsList className="mb-4 w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="players" className="text-xs sm:text-sm py-2">Players</TabsTrigger>
          <TabsTrigger value="scoreboard" className="text-xs sm:text-sm py-2">Scoreboard</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm py-2">Game History</TabsTrigger>
          <TabsTrigger value="debug" className="text-xs sm:text-sm py-2">Debug</TabsTrigger>
        </TabsList>
        
        <TabsContent value="players" className="mt-0">
          <PlayerList />
        </TabsContent>
        
        <TabsContent value="scoreboard" className="mt-0">
          <Scoreboard />
        </TabsContent>
        
        <TabsContent value="history" className="mt-0">
          <GameHistory />
        </TabsContent>
        
        <TabsContent value="debug" className="mt-0">
          <div className="flex justify-center">
            <RealTimeDebugger />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

const Index = () => {
  const { user, signOut } = useAuth();
  const { currentTeam, loading, isSuperAdmin, isTeamAdmin } = useTeam();
  const [isTeamManagementOpen, setIsTeamManagementOpen] = useState(false);

  if (loading) {
    return (
      <div className="container py-4 px-2 sm:px-4 max-w-7xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container py-4 px-2 sm:px-4 max-w-7xl">
      <header className="mb-4">
        <div className="flex flex-col items-center justify-center gap-2 mb-4">
          <img src="/lovable-uploads/9d00919c-607d-49af-87e1-11c7dc280cba.png" alt="Serve Stats Logo" className="h-16 md:h-24" />
          <h1 className="text-2xl sm:text-3xl font-bold text-team-primary">Serve Stats</h1>
        </div>
        
        {/* User info and actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            Welcome, <strong>{user?.email}</strong>
            {isSuperAdmin && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                <Shield className="h-3 w-3 mr-1" />
                Super Admin
              </span>
            )}
            {isTeamAdmin && !isSuperAdmin && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                <Settings className="h-3 w-3 mr-1" />
                Team Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Link>
              </Button>
            )}
            {isTeamAdmin && currentTeam && (
              <Button variant="outline" size="sm" onClick={() => setIsTeamManagementOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Team Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Real-time connection status */}
        {currentTeam && (
          <div className="flex justify-center mb-4">
            <RealTimeStatus />
          </div>
        )}
      </header>

      {/* Team Selection */}
      <div className="mb-4">
        <TeamSelector />
      </div>

      {/* Show volleyball tracking only when a team is selected */}
      {currentTeam ? (
        <VolleyballTracker />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Select or create a team to start tracking volleyball statistics.
        </div>
      )}

      {/* Team Management Dialog */}
      {currentTeam && (
        <UnifiedTeamManagementDialog
          isOpen={isTeamManagementOpen}
          onClose={() => setIsTeamManagementOpen(false)}
          teamId={currentTeam.id}
          teamName={currentTeam.name}
        />
      )}
    </div>
  );
};

export default Index;
