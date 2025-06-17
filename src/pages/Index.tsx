
import React from "react";
import { VolleyballProvider } from "../context/VolleyballContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerList } from "@/components/PlayerList";
import { GameDaySelector } from "@/components/GameDaySelector";
import { Scoreboard } from "@/components/Scoreboard";
import { GameHistory } from "@/components/GameHistory";
import { StatsDescription } from "@/components/StatsDescription";

const Index = () => {
  return (
    <VolleyballProvider>
      <div className="container py-4 px-2 sm:px-4 max-w-7xl">
        <header className="mb-4 text-center">
          <div className="flex flex-col items-center justify-center gap-2 mb-2">
            <img 
              src="/lovable-uploads/9d00919c-607d-49af-87e1-11c7dc280cba.png" 
              alt="Serve Stats Logo" 
              className="h-10 sm:h-12 w-auto"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-team-primary">Serve Stats</h1>
          </div>
        </header>
        
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
      </div>
    </VolleyballProvider>
  );
};

export default Index;
