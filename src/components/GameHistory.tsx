
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { GameServeHistoryDialog } from "./GameServeHistoryDialog";

export function GameHistory() {
  const { 
    gameDays, 
    players, 
    currentGameDay, 
    gameTypeFilter, 
    getAllGameTypes,
    getPlayerStats
  } = useVolleyball();
  
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  
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
    let totalErrors = 0;
    let totalAces = 0;

    // Get players who participated in this game
    const gamePlayerIds = [...new Set(players.flatMap(player => 
      player.serves
        .filter(serve => serve.gameId === gameId)
        .map(() => player.id)
    ))];
    
    const gamePlayers = players.filter(p => gamePlayerIds.includes(p.id));
    
    // Calculate stats for each player in this game
    const playerStats = gamePlayers.map(player => {
      const stats = getPlayerStats(player.id, gameId);
      
      totalAces += stats.aces;
      totalErrors += stats.errors;
      
      // Calculate A/E Ratio
      const aeRatio = stats.errors === 0 ? stats.aces : stats.aces / stats.errors;
      
      // Calculate Quality Score
      const playerServes = players.find(p => p.id === player.id)?.serves.filter(s => s.gameId === gameId) || [];
      const totalPlayerServes = playerServes.length;
      
      let qualityScore = 0;
      if (totalPlayerServes > 0) {
        const score = playerServes.reduce((sum, serve) => {
          const qualityValue = serve.quality === "good" ? 1 : serve.quality === "neutral" ? 0 : -1;
          return sum + qualityValue;
        }, 0);
        qualityScore = score / totalPlayerServes;
      }
      
      return {
        aeRatio,
        qualityScore
      };
    });
    
    // Calculate averages
    const avgAERatio = playerStats.length > 0 
      ? playerStats.reduce((sum, p) => sum + p.aeRatio, 0) / playerStats.length
      : 0;
    
    const avgQualityScore = playerStats.length > 0
      ? playerStats.reduce((sum, p) => sum + p.qualityScore, 0) / playerStats.length
      : 0;

    return { totalErrors, totalAces, avgAERatio, avgQualityScore };
  };

  // Color helpers for stats
  const getAERatioColor = (ratio: number) => {
    if (ratio === 0) return "text-muted-foreground";
    if (ratio > 1) return "ace-text";
    if (ratio < 1) return "error-text";
    return "text-muted-foreground";
  };
  
  const getQualityScoreColor = (score: number) => {
    if (score === 0) return "text-muted-foreground";
    if (score > 0) return "ace-text";
    if (score < 0) return "error-text";
    return "text-muted-foreground";
  };
  
  const formatValue = (value: number, showSign: boolean = false) => {
    if (value === 0) return "0.00";
    if (showSign && value > 0) return `+${value.toFixed(2)}`;
    return value.toFixed(2);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3 px-3 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Game History</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4">
          {sortedGames.length > 0 ? (
            <div className="space-y-3">
              {sortedGames.map(game => {
                const stats = calculateGameStats(game.id);
                const isSelected = currentGameDay?.id === game.id;
                
                return (
                  <div 
                    key={game.id} 
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-all duration-200 shadow-sm hover:shadow-md ${isSelected ? 'bg-muted border-primary ring-1 ring-primary/20' : ''}`}
                    onClick={() => setSelectedGameId(game.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          [{game.gameType}] {allGameTypes[game.gameType]}
                        </Badge>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {format(new Date(game.date), "dd.MM.yy")}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">
                      {game.title || format(new Date(game.date), "EEEE")}
                    </h3>
                    
                    {game.notes && (
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                        {game.notes}
                      </p>
                    )}
                    
                    <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
                      <span>Aces: <strong className="ace-text">{stats.totalAces}</strong></span>
                      <span>Errors: <strong className="error-text">{stats.totalErrors}</strong></span>
                      <span>A/E: <strong className={getAERatioColor(stats.avgAERatio)}>{formatValue(stats.avgAERatio)}</strong></span>
                      <span>QS: <strong className={getQualityScoreColor(stats.avgQualityScore)}>{formatValue(stats.avgQualityScore, true)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No games found for the selected criteria.
            </div>
          )}
        </CardContent>
      </Card>
      
      <GameServeHistoryDialog
        gameId={selectedGameId}
        isOpen={!!selectedGameId}
        onClose={() => setSelectedGameId(null)}
      />
    </>
  );
}
