
import React, { useState } from "react";
import { Player, ServeQuality } from "../types";
import { useVolleyball } from "../context/VolleyballContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <CardContent className="p-3 sm:p-6">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-semibold text-base truncate max-w-[100px] sm:max-w-[150px]">
              {player.name}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">F</span>
                <span className={`text-sm font-semibold ${animatingFail ? "stat-change" : ""}`}>
                  {stats.fails}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">A</span>
                <span className={`text-sm font-semibold ${animatingAce ? "stat-change" : ""}`}>
                  {stats.aces}
                </span>
              </div>
            </div>
          </div>
          
          {!activeType ? (
            <div className="flex gap-1">
              <Button 
                variant="destructive" 
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setActiveType("fail")}
              >
                +F
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setActiveType("ace")}
              >
                +A
              </Button>
            </div>
          ) : (
            <div className="flex gap-1 flex-wrap justify-end">
              <Badge 
                className="cursor-pointer bg-serve-good hover:bg-serve-good/80 text-xs py-0 h-6"
                onClick={() => handleServeClick(activeType, "good")}
              >
                G
              </Badge>
              <Badge 
                className="cursor-pointer bg-serve-neutral hover:bg-serve-neutral/80 text-black text-xs py-0 h-6"
                onClick={() => handleServeClick(activeType, "neutral")}
              >
                N
              </Badge>
              <Badge 
                className="cursor-pointer bg-serve-bad hover:bg-serve-bad/80 text-xs py-0 h-6"
                onClick={() => handleServeClick(activeType, "bad")}
              >
                B
              </Badge>
              <Badge 
                className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs py-0 h-6"
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
