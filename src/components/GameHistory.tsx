
import React, { useState } from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { GameServeHistoryDialog } from "./GameServeHistoryDialog";
import { RefreshCw, Wifi, WifiOff, Clock } from "lucide-react";

export function GameHistory() {
  const { 
    gameDays, 
    players, 
    currentGameDay, 
    gameTypeFilter, 
    getAllGameTypes,
    getPlayerStats,
    lastUpdateTimestamp,
    lastRealTimeEvent,
    realtimeConnectionStatus,
    refreshData
  } = useSupabaseVolleyball();
  
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  
  const allGameTypes = getAllGameTypes();
  
  // Component render tracking
  React.useEffect(() => {
    console.log('🎮 GAME HISTORY DEBUG - Component rendered:', {
      lastUpdateTimestamp,
      gameDaysCount: gameDays.length,
      lastRealTimeEvent,
      realtimeConnectionStatus,
      timestamp: new Date().toISOString()
    });
  }); // Run on every render to track all updates
  
  // Get games to display based on current context
  const getDisplayedGames = () => {
    if (currentGameDay) {
      return gameDays.filter(game => game.gameType === currentGameDay.gameType);
    } else if (gameTypeFilter) {
      return gameDays.filter(game => game.gameType === gameTypeFilter);
    } else {
      return gameDays;
    }
  };

  const displayedGames = getDisplayedGames();
  const sortedGames = [...displayedGames].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate game stats
  const calculateGameStats = (gameId: string) => {
    let totalErrors = 0;
    let totalAces = 0;

    const gameServes = players.flatMap(player => 
      player.serves
        .filter(serve => serve.gameId === gameId)
        .map(serve => ({
          ...serve,
          playerName: player.name,
          playerId: player.id
        }))
    );

    totalAces = gameServes.filter(s => s.type === "ace").length;
    totalErrors = gameServes.filter(s => s.type === "fail").length;

    const gamePlayerIds = [...new Set(gameServes.map(serve => serve.playerId))];
    const gamePlayers = players.filter(p => gamePlayerIds.includes(p.id));
    
    const playerStats = gamePlayers.map(player => {
      const stats = getPlayerStats(player.id, gameId);
      const aeRatio = stats.errors === 0 ? stats.aces : stats.aces / stats.errors;
      return { aeRatio };
    });
    
    const avgAERatio = playerStats.length > 0 
      ? playerStats.reduce((sum, p) => sum + p.aeRatio, 0) / playerStats.length
      : 0;
    
    const overallQualityScore = gameServes.length > 0
      ? gameServes.reduce((sum, serve) => {
          const qualityValue = serve.quality === "good" ? 1 : serve.quality === "neutral" ? 0 : -1;
          return sum + qualityValue;
        }, 0) / gameServes.length
      : 0;

    return { totalErrors, totalAces, avgAERatio, avgQualityScore: overallQualityScore };
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl">Game History</CardTitle>
              
              {/* Real-time connection status */}
              <div className="flex items-center gap-1 text-xs">
                {realtimeConnectionStatus === 'connected' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Wifi className="h-3 w-3" />
                    <span>Live</span>
                  </div>
                )}
                {realtimeConnectionStatus === 'disconnected' && (
                  <div className="flex items-center gap-1 text-red-600">
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                  </div>
                )}
                {realtimeConnectionStatus === 'connecting' && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Clock className="h-3 w-3 animate-spin" />
                    <span>Connecting...</span>
                  </div>
                )}
              </div>
              
              {/* Real-time event indicator for game days */}
              {lastRealTimeEvent && lastRealTimeEvent.table === 'game_days' && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  <Clock className="h-3 w-3" />
                  <span>
                    Last {lastRealTimeEvent.type.toLowerCase()}: {lastRealTimeEvent.entityName}
                  </span>
                  <span className="text-xs opacity-75">
                    {new Date(lastRealTimeEvent.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Manual refresh button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={refreshData}
              className="h-8 w-8 p-0"
              title="Manual refresh"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-4">
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-slate-100 rounded text-xs text-slate-600">
              <div>Games: {sortedGames.length} | Update: {lastUpdateTimestamp}</div>
              <div>Connection: {realtimeConnectionStatus}</div>
              {lastRealTimeEvent && lastRealTimeEvent.table === 'game_days' && (
                <div>Last Event: {lastRealTimeEvent.type} - {lastRealTimeEvent.entityName}</div>
              )}
            </div>
          )}
          
          {sortedGames.length > 0 ? (
            <div className="space-y-3">
              {sortedGames.map(game => {
                const stats = calculateGameStats(game.id);
                const isSelected = currentGameDay?.id === game.id;
                
                return (
                  <div 
                    key={game.id} // Use stable game ID only
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
