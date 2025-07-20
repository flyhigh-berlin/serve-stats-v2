
import React from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
import { PlayerCard } from "./PlayerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddPlayerForm } from "./AddPlayerForm";
import { PlayerManagementDialog } from "./PlayerManagementDialog";
import { Settings, Plus, Loader2 } from "lucide-react";

export function PlayerList() {
  const { getFilteredPlayers, currentGameDay, gameTypeFilter, players, loadingStates } = useSupabaseVolleyball();
  
  // Get filtered players based on current game day or game type filter
  const filteredPlayers = getFilteredPlayers();
  
  console.log('👥 PLAYER LIST DEBUG - Component render:', {
    filteredPlayersCount: filteredPlayers.length,
    totalPlayersCount: players.length,
    currentGameDay: currentGameDay?.id,
    gameTypeFilter,
    loadingStates,
    timestamp: new Date().toISOString()
  });
  
  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl">Players</CardTitle>
            <div className="flex items-center gap-1 sm:gap-2">
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
                  key={player.id} // Use stable ID only, no Date.now()
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
