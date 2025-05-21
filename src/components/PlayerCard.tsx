
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
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">{player.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-3">
            <div>
              <span className="text-sm text-muted-foreground block">Fails</span>
              <span className={`text-xl font-semibold ${animatingFail ? "stat-change" : ""}`}>
                {stats.fails}
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block">Aces</span>
              <span className={`text-xl font-semibold ${animatingAce ? "stat-change" : ""}`}>
                {stats.aces}
              </span>
            </div>
          </div>
          
          {!activeType ? (
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setActiveType("fail")}
              >
                + Fail
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setActiveType("ace")}
              >
                + Ace
              </Button>
            </div>
          ) : (
            <div className="flex gap-1">
              <Badge 
                className="cursor-pointer bg-serve-good hover:bg-serve-good/80"
                onClick={() => handleServeClick(activeType, "good")}
              >
                Good
              </Badge>
              <Badge 
                className="cursor-pointer bg-serve-neutral hover:bg-serve-neutral/80 text-black"
                onClick={() => handleServeClick(activeType, "neutral")}
              >
                Neutral
              </Badge>
              <Badge 
                className="cursor-pointer bg-serve-bad hover:bg-serve-bad/80"
                onClick={() => handleServeClick(activeType, "bad")}
              >
                Bad
              </Badge>
              <Badge 
                className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-700"
                onClick={() => setActiveType(null)}
              >
                Cancel
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
