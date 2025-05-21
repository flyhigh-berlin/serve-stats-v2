
import React from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { PlayerCard } from "./PlayerCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PlayerList() {
  const { players, currentGameDay } = useVolleyball();
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle>Players</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {currentGameDay 
            ? `Recording stats for game on ${new Date(currentGameDay.date).toLocaleDateString()}`
            : "No game day selected. Stats will be recorded for all games."}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 py-2 sm:px-4">
        <ScrollArea className="h-[calc(100vh-20rem)] pr-2">
          <div className="space-y-2">
            {players.length > 0 ? (
              players.map(player => (
                <PlayerCard 
                  key={player.id} 
                  player={player} 
                  gameId={currentGameDay?.id}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No players added yet. Add a player to get started.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
