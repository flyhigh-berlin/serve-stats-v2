
import React from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function GameHistory() {
  const { 
    gameDays, 
    players, 
    currentGameDay, 
    gameTypeFilter, 
    getAllGameTypes,
    gameTypes 
  } = useVolleyball();
  
  const allGameTypes = getAllGameTypes();
  
  // Get games to display based on current context
  const getDisplayedGames = () => {
    if (currentGameDay) {
      // Show all games with the same game type as the selected game
      return gameDays.filter(game => game.gameType === currentGameDay.gameType);
    } else if (gameTypeFilter) {
      // Show games of the filtered game type
      return gameDays.filter(game => game.gameType === gameTypeFilter);
    } else {
      // Show all games
      return gameDays;
    }
  };

  const displayedGames = getDisplayedGames();

  // Sort games by date (newest first)
  const sortedGames = [...displayedGames].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate game stats
  const calculateGameStats = (gameId: string) => {
    let totalServes = 0;
    let totalFails = 0;
    let totalAces = 0;

    players.forEach(player => {
      const gameServes = player.serves.filter(serve => serve.gameId === gameId);
      gameServes.forEach(serve => {
        totalServes++;
        if (serve.type === "fail") totalFails++;
        if (serve.type === "ace") totalAces++;
      });
    });

    return { totalServes, totalFails, totalAces };
  };

  // Format game display text
  const formatGameDisplay = (gameDay: any) => {
    const typeLabel = `[${gameDay.gameType}]`;
    const titlePart = gameDay.title || format(new Date(gameDay.date), "EEEE");
    const datePart = format(new Date(gameDay.date), "dd.MM.yy");
    
    return `${typeLabel} ${titlePart} (${datePart})`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game History</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedGames.length > 0 ? (
          <div className="space-y-4">
            {sortedGames.map(game => {
              const stats = calculateGameStats(game.id);
              const isSelected = currentGameDay?.id === game.id;
              
              return (
                <div 
                  key={game.id} 
                  className={`p-4 border rounded-lg ${isSelected ? 'bg-muted border-primary' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        [{game.gameType}] {allGameTypes[game.gameType]}
                      </Badge>
                      {isSelected && (
                        <Badge variant="default" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(game.date), "dd.MM.yy")}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold mb-2">
                    {game.title || format(new Date(game.date), "EEEE")}
                  </h3>
                  
                  {game.notes && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {game.notes}
                    </p>
                  )}
                  
                  <div className="flex gap-4 text-sm">
                    <span>Total Serves: <strong>{stats.totalServes}</strong></span>
                    <span>Fails: <strong>{stats.totalFails}</strong></span>
                    <span>Aces: <strong>{stats.totalAces}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No games found for the selected criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
