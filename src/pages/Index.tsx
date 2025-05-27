
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
      <div className="container py-6 max-w-5xl">
        <header className="mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img 
              src="/lovable-uploads/9d00919c-607d-49af-87e1-11c7dc280cba.png" 
              alt="Serve Stats Logo" 
              className="h-12 w-auto"
            />
            <h1 className="text-3xl font-bold text-team-primary">Serve Stats</h1>
          </div>
        </header>
        
        <div className="mb-6">
          <GameDaySelector />
        </div>
        
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="scoreboard">Scoreboard</TabsTrigger>
            <TabsTrigger value="history">Game History</TabsTrigger>
          </TabsList>
          
          <StatsDescription />
          
          <TabsContent value="players" className="min-h-[400px]">
            <PlayerList />
          </TabsContent>
          
          <TabsContent value="scoreboard" className="min-h-[400px]">
            <Scoreboard />
          </TabsContent>
          
          <TabsContent value="history" className="min-h-[400px]">
            <GameHistory />
          </TabsContent>
        </Tabs>
      </div>
    </VolleyballProvider>
  );
};

export default Index;
