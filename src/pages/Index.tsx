
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
import { VolleyballProvider } from "../context/VolleyballContext";
import { LogOut, Settings } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();
  const { currentTeam, loading } = useTeam();

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
        
        {/* User info and logout */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Welcome, <strong>{user?.email}</strong>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Team Selection */}
      <div className="mb-4">
        <TeamSelector />
      </div>

      {/* Show volleyball tracking only when a team is selected */}
      {currentTeam ? (
        <VolleyballProvider>
          <div className="mb-4">
            <GameDaySelector />
          </div>
          
          <Tabs defaultValue="players" className="w-full">
            <StatsDescription />
            
            <TabsList className="mb-4 w-full grid grid-cols-3 h-auto">
              <TabsTrigger value="players" className="text-xs sm:text-sm py-2">Players</TabsTrigger>
              <TabsTrigger value="scoreboard" className="text-xs sm:text-sm py-2">Scoreboard</TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm py-2">Game History</TabsTrigger>
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
          </Tabs>
        </VolleyballProvider>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Select or create a team to start tracking volleyball statistics.
        </div>
      )}
    </div>
  );
};

export default Index;
