
import React from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
import { PlayerCard } from "./PlayerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddPlayerForm } from "./AddPlayerForm";
import { PlayerManagementDialog } from "./PlayerManagementDialog";
import { Settings, Plus, Loader2, Clock, RefreshCw } from "lucide-react";

export function PlayerList() {
  const { 
    getFilteredPlayers, 
    currentGameDay, 
    gameTypeFilter, 
    players, 
    loadingStates,
    renderTrigger, // Track render updates
    lastPlayerEvent, // Show last real-time event
    refreshData // Manual refresh function
  } = useSupabaseVolleyball();
  
  // Get filtered players based on current game day or game type filter
  const filteredPlayers = getFilteredPlayers();
  
  // Component render tracking
  React.useEffect(() => {
    console.log('👥 PLAYER LIST DEBUG - Component rendered:', {
      renderTrigger,
      filteredPlayersCount: filteredPlayers.length,
      totalPlayersCount: players.length,
      lastPlayerEvent,
      timestamp: new Date().toISOString()
    });
  }); // Run on every render to track all updates
  
  // Debug component re-renders based on dependencies
  React.useEffect(() => {
    console.log('👥 PLAYER LIST DEBUG - Component dependency change detected:', {
      playersLength: players.length,
      renderTrigger,
      lastPlayerEvent,
      timestamp: new Date().toISOString()
    });
  }, [players.length, renderTrigger, lastPlayerEvent]);
  
  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl">Players</CardTitle>
              {/* Real-time event indicator */}
              {lastPlayerEvent && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  <Clock className="h-3 w-3" />
                  <span>
                    Last {lastPlayerEvent.type.toLowerCase()}: {lastPlayerEvent.playerName}
                  </span>
                  <span className="text-xs opacity-75">
                    {new Date(lastPlayerEvent.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
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
              
              <PlayerManagementDialog>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                  disabled={loadingStates.addingPlayer}
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Manage Tags</span>
                </Button>
              </PlayerManagementDialog>
              <AddPlayerForm />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 py-2 sm:px-4">
          {/* Loading indicator for adding player */}
          {loadingStates.addingPlayer && (
            <div className="flex items-center justify-center py-4 mb-4 bg-muted/50 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Adding player...</span>
            </div>
          )}
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-slate-100 rounded text-xs text-slate-600">
              <div>Players: {filteredPlayers.length} | Render: {renderTrigger}</div>
              {lastPlayerEvent && (
                <div>Last Event: {lastPlayerEvent.type} - {lastPlayerEvent.playerName}</div>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map(player => (
                <PlayerCard 
                  key={`${player.id}-${renderTrigger}`} // Force re-render when renderTrigger changes
                  player={player} 
                  gameId={currentGameDay?.id}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {currentGameDay || gameTypeFilter ? 
                  "No players with matching tags found for this game type." :
                  "No players added yet. Add a player to get started."
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
