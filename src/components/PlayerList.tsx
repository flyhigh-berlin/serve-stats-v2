
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { PlayerCard } from "./PlayerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddPlayerForm } from "./AddPlayerForm";
import { PlayerManagementDialog } from "./PlayerManagementDialog";
import { Settings, Plus } from "lucide-react";

export function PlayerList() {
  const { getFilteredPlayers, currentGameDay, gameTypeFilter } = useVolleyball();
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  
  // Get filtered players based on current game day or game type filter
  const filteredPlayers = getFilteredPlayers();
  
  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl">Players</CardTitle>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                onClick={() => setIsManagementDialogOpen(true)}
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Manage Tags</span>
              </Button>
              <AddPlayerForm />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 py-2 sm:px-4">
          <div className="space-y-2">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map(player => (
                <PlayerCard 
                  key={player.id} 
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
      
      <PlayerManagementDialog 
        isOpen={isManagementDialogOpen}
        onClose={() => setIsManagementDialogOpen(false)}
      />
    </>
  );
}
