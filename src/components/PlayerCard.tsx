
import React, { useState } from "react";
import { Player, ServeQuality } from "../types";
import { useVolleyball } from "../context/VolleyballContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayerDetailDialog } from "./PlayerDetailDialog";
import { Triangle, Plus, Minus, X, Circle, Square } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  gameId?: string;
}

export function PlayerCard({ player, gameId }: PlayerCardProps) {
  const { addServe, getPlayerStats } = useVolleyball();
  const [activeType, setActiveType] = useState<"fail" | "ace" | null>(null);
  const [animatingFail, setAnimatingFail] = useState(false);
  const [animatingAce, setAnimatingAce] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
  
  // Get color based on quality
  const getQualityColor = (quality: ServeQuality) => {
    switch (quality) {
      case "good": return "bg-serve-good hover:bg-serve-good/80";
      case "neutral": return "bg-serve-neutral hover:bg-serve-neutral/80 text-black";
      case "bad": return "bg-serve-bad hover:bg-serve-bad/80";
      default: return "";
    }
  };
  
  return (
    <>
      <Card className="w-full">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            {/* Player name section - clickable to open dialog */}
            <div 
              className="flex-grow mr-2 overflow-hidden cursor-pointer hover:text-primary"
              onClick={() => setIsDialogOpen(true)}
            >
              <span className="font-semibold truncate block max-w-full">
                {player.name}
              </span>
            </div>
            
            {/* Stats section - always positioned to the right */}
            <div className="flex items-center mr-2 flex-shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-xs">
                  <span className="text-muted-foreground">F:</span>
                  <span className={`font-medium ${animatingFail ? "stat-change" : ""}`}>{stats.fails}</span>
                </span>
                <span className="text-xs">
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
                {/* Quality buttons - square for fail, triangle for ace, with symbols inside */}
                <Button 
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 ${activeType === "fail" ? "rounded-md" : "rounded-none transform rotate-45"} p-0 ${getQualityColor("good")}`}
                  onClick={() => handleServeClick(activeType, "good")}
                >
                  <Plus className={`h-4 w-4 ${activeType === "ace" ? "transform -rotate-45" : ""}`} />
                </Button>
                <Button 
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 ${activeType === "fail" ? "rounded-md" : "rounded-none transform rotate-45"} p-0 ${getQualityColor("neutral")}`}
                  onClick={() => handleServeClick(activeType, "neutral")}
                >
                  <Circle className={`h-4 w-4 ${activeType === "ace" ? "transform -rotate-45" : ""}`} />
                </Button>
                <Button 
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 ${activeType === "fail" ? "rounded-md" : "rounded-none transform rotate-45"} p-0 ${getQualityColor("bad")}`}
                  onClick={() => handleServeClick(activeType, "bad")}
                >
                  <Minus className={`h-4 w-4 ${activeType === "ace" ? "transform -rotate-45" : ""}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={() => setActiveType(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Player detail dialog */}
      <PlayerDetailDialog
        playerId={player.id}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
