
import React from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
import { PlayerCard } from "./PlayerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddPlayerForm } from "./AddPlayerForm";
import { PlayerManagementDialog } from "./PlayerManagementDialog";
import { Settings, RefreshCw, Loader2, Wifi, WifiOff, Clock } from "lucide-react";

export function PlayerList() {
  const { 
    getFilteredPlayers, 
    currentGameDay, 
    gameTypeFilter, 
    players, 
    loadingStates,
    lastRealTimeEvent,
    realtimeConnectionStatus,
    refreshData
  } = useSupabaseVolleyball();
  
  // Get filtered players based on current game day or game type filter
  const filteredPlayers = getFilteredPlayers();
  
  // Show real-time event indicators for better UX
  const showEventIndicator = lastRealTimeEvent && 
    lastRealTimeEvent.table === 'players' && 
    (Date.now() - new Date(lastRealTimeEvent.timestamp).getTime()) < 3000; // Show for 3 seconds
  
  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl">Players</CardTitle>
              
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
              
              {/* Real-time event indicator - shows briefly when data changes */}
              {showEventIndicator && (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded animate-pulse">
                  <Clock className="h-3 w-3" />
                  <span>
                    {lastRealTimeEvent.type.toLowerCase()}: {lastRealTimeEvent.entityName}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Manual refresh button - only visible when connection issues */}
              {realtimeConnectionStatus !== 'connected' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={refreshData}
                  className="h-8 w-8 p-0"
                  title="Manual refresh (connection issues)"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
              
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
          
          <div className="space-y-2">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map(player => (
                <PlayerCard 
                  key={player.id} // Stable player ID only
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
