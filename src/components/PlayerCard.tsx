
import React, { useState } from "react";
import { Player, ServeQuality } from "../types";
import { useVolleyball } from "../context/VolleyballContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PlayerCardProps {
  player: Player;
  gameId?: string;
}

export function PlayerCard({ player, gameId }: PlayerCardProps) {
  const { addServe, getPlayerStats } = useVolleyball();
  const [activeType, setActiveType] = useState<"fail" | "ace" | null>(null);
  const [animatingFail, setAnimatingFail] = useState(false);
  const [animatingAce, setAnimatingAce] = useState(false);
  
  // Get the player's stats for the current game or all games
  const stats = getPlayerStats(player.id, gameId);
  
  // Handle adding a serve
  const handleServeClick = (type: "fail" | "ace", quality: ServeQuality) => {
    addServe(player.id, type, quality);
    
    // Animate the stat change
    if (type === "fail") {
      setAnimatingFail(true);
      setTimeout(() => setAnimatingFail(false), 500);
    } else {
      setAnimatingAce(true);
      setTimeout(() => setAnimatingAce(false), 500);
    }
    
    // Reset the active type
    setActiveType(null);
  };
  
  return (
    <Card className="w-full">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* Player name and stats section */}
          <div className="flex items-center space-x-2 overflow-hidden">
            <span className="font-semibold truncate max-w-[100px] sm:max-w-[150px]">
              {player.name}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-sm">
                <span className="text-muted-foreground">F:</span>
                <span className={`font-medium ${animatingFail ? "stat-change" : ""}`}>{stats.fails}</span>
              </span>
              <span className="text-sm">
                <span className="text-muted-foreground">A:</span>
                <span className={`font-medium ${animatingAce ? "stat-change" : ""}`}>{stats.aces}</span>
              </span>
            </div>
          </div>
          
          {/* Action buttons section */}
          {!activeType ? (
            <div className="flex space-x-1 flex-shrink-0">
              <Button 
                variant="destructive" 
                size="sm"
                className="h-7 w-10 px-1 text-xs"
                onClick={() => setActiveType("fail")}
              >
                +F
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="h-7 w-10 px-1 text-xs"
                onClick={() => setActiveType("ace")}
              >
                +A
              </Button>
            </div>
          ) : (
            <div className="flex space-x-1 flex-shrink-0">
              <Badge 
                className="cursor-pointer bg-serve-good hover:bg-serve-good/80 text-xs py-0 h-6 w-6 flex items-center justify-center"
                onClick={() => handleServeClick(activeType, "good")}
              >
                G
              </Badge>
              <Badge 
                className="cursor-pointer bg-serve-neutral hover:bg-serve-neutral/80 text-black text-xs py-0 h-6 w-6 flex items-center justify-center"
                onClick={() => handleServeClick(activeType, "neutral")}
              >
                N
              </Badge>
              <Badge 
                className="cursor-pointer bg-serve-bad hover:bg-serve-bad/80 text-xs py-0 h-6 w-6 flex items-center justify-center"
                onClick={() => handleServeClick(activeType, "bad")}
              >
                B
              </Badge>
              <Badge 
                className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs py-0 h-6 w-6 flex items-center justify-center"
                onClick={() => setActiveType(null)}
              >
                X
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
