
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { PlayerCard } from "./PlayerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Players</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="h-9 px-3"
                onClick={() => setIsManagementDialogOpen(true)}
              >
                <Settings className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Manage Players</span>
              </Button>
              <AddPlayerForm />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 py-2 sm:px-4">
          <ScrollArea className="h-[calc(100vh-20rem)] pr-2">
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
                <div className="text-center py-8 text-muted-foreground">
                  {currentGameDay || gameTypeFilter ? 
                    "No players with matching tags found for this game type." :
                    "No players added yet. Add a player to get started."
                  }
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <PlayerManagementDialog 
        isOpen={isManagementDialogOpen}
        onClose={() => setIsManagementDialogOpen(false)}
      />
    </>
  );
}
