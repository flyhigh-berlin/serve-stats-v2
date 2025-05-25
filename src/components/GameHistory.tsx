
import React from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServeQuality } from "../types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function GameHistory() {
  const { 
    gameDays, 
    getGameDayServes, 
    players, 
    setCurrentGameDay, 
    currentGameDay, 
    gameTypeFilter, 
    getAllGameTypes 
  } = useVolleyball();

  const allGameTypes = getAllGameTypes();

  // Helper to get badge color for serve quality
  const getQualityColor = (quality: ServeQuality) => {
    switch (quality) {
      case "good":
        return "bg-serve-good";
      case "neutral":
        return "bg-serve-neutral text-black";
      case "bad":
        return "bg-serve-bad";
      default:
        return "";
    }
  };
  
  // Helper to find player name by serve
  const getPlayerName = (serve: { id: string }) => {
    for (const player of players) {
      if (player.serves.some(s => s.id === serve.id)) {
        return player.name;
      }
    }
    return "Unknown Player";
  };
  
  // Format game display text
  const formatGameDisplay = (gameDay: any) => {
    const typeLabel = `[${gameDay.gameType}]`;
    const titlePart = gameDay.title || format(new Date(gameDay.date), "EEEE");
    const datePart = format(new Date(gameDay.date), "dd.MM.yy");
    
    return `${typeLabel} ${titlePart} (${datePart})`;
  };
  
  // Get filtered game days
  const getFilteredGameDays = () => {
    if (currentGameDay) {
      // If specific game is selected, show all games with the same game type
      return gameDays.filter(gameDay => gameDay.gameType === currentGameDay.gameType);
    } else if (gameTypeFilter) {
      // If game type filter is applied, show games of that type
      return gameDays.filter(gameDay => gameDay.gameType === gameTypeFilter);
    } else {
      // Show all games
      return gameDays;
    }
  };
  
  // Get filtered and sorted game days (latest first)
  const sortedGameDays = [...getFilteredGameDays()].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Get header title
  const getHeaderTitle = () => {
    if (currentGameDay) {
      return `Game History - ${allGameTypes[currentGameDay.gameType]} Games`;
    } else if (gameTypeFilter) {
      return `Game History - ${allGameTypes[gameTypeFilter]}`;
    } else {
      return "Game History";
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{getHeaderTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedGameDays.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {sortedGameDays.map((gameDay) => {
              const serves = getGameDayServes(gameDay.id);
              const failCount = serves.filter(s => s.type === "fail").length;
              const aceCount = serves.filter(s => s.type === "ace").length;
              
              return (
                <AccordionItem key={gameDay.id} value={gameDay.id}>
                  <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                    <div className="flex justify-between items-center w-full">
                      <div className="font-medium">
                        {formatGameDisplay(gameDay)}
                      </div>
                      <div className="flex gap-2 mr-4">
                        <Badge variant="outline" className="bg-destructive/10">
                          {failCount} fails
                        </Badge>
                        <Badge variant="outline" className="bg-primary/10">
                          {aceCount} aces
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="mb-4">
                      {gameDay.notes && (
                        <p className="text-sm text-muted-foreground">
                          Notes: {gameDay.notes}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-4"
                      onClick={() => setCurrentGameDay(gameDay.id)}
                    >
                      View Detailed Stats
                    </Button>
                    
                    {serves.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Serve Records:</h4>
                        <ul className="space-y-1">
                          {serves.map(serve => (
                            <li key={serve.id} className="text-sm flex items-center gap-2">
                              <Badge variant={serve.type === "fail" ? "destructive" : "default"} className="w-12">
                                {serve.type === "fail" ? "Fail" : "Ace"}
                              </Badge>
                              <Badge className={getQualityColor(serve.quality)}>
                                {serve.quality}
                              </Badge>
                              <span className="text-muted-foreground">
                                {getPlayerName(serve)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {format(new Date(serve.timestamp), "p")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No serve records for this game.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No games found for the current filter.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
