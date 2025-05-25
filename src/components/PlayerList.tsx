
import React from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { PlayerCard } from "./PlayerCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export function PlayerList() {
  const { players, currentGameDay, gameTypeFilter, gameTypes } = useVolleyball();
  
  // Format game display text
  const formatGameDisplay = (gameDay: any) => {
    const typeLabel = `[${gameDay.gameType}]`;
    const titlePart = gameDay.title || format(new Date(gameDay.date), "EEEE");
    const datePart = format(new Date(gameDay.date), "dd.MM.yy");
    
    return `${typeLabel} ${titlePart} (${datePart})`;
  };

  // Get description based on current context
  const getDescription = () => {
    if (currentGameDay) {
      return `Recording stats for ${formatGameDisplay(currentGameDay)}`;
    } else if (gameTypeFilter) {
      return `Stats will be recorded for game type [${gameTypeFilter}] ${gameTypes[gameTypeFilter]}`;
    } else {
      return "No game day selected. Stats will be recorded for all games.";
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle>Players</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {getDescription()}
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
