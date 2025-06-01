
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
  const [activeType, setActiveType] = useState<"error" | "ace" | null>(null);
  const [animatingError, setAnimatingError] = useState(false);
  const [animatingAce, setAnimatingAce] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Get the player's stats for the current game or all games
  const stats = getPlayerStats(player.id, gameId);
  
  // Handle adding a serve
  const handleServeClick = (type: "error" | "ace", quality: ServeQuality) => {
    addServe(player.id, type === "error" ? "fail" : "ace", quality);
    
    // Animate the stat change
    if (type === "error") {
      setAnimatingError(true);
      setTimeout(() => setAnimatingError(false), 500);
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
          {/* Line 1: Player name, # of aces, # of errors */}
          <div 
            className="flex items-center justify-between mb-3 cursor-pointer hover:text-primary"
            onClick={() => setIsDialogOpen(true)}
          >
            <span className="font-semibold truncate flex-grow mr-4">
              {player.name}
            </span>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-sm">
                <span className="text-muted-foreground">A:</span>
                <span className={`font-medium ml-1 ${animatingAce ? "stat-change" : ""}`}>{stats.aces}</span>
              </span>
              <span className="text-sm">
                <span className="text-muted-foreground">E:</span>
                <span className={`font-medium ml-1 ${animatingError ? "stat-change" : ""}`}>{stats.fails}</span>
              </span>
            </div>
          </div>
          
          {/* Line 2: Action buttons */}
          {!activeType ? (
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="lg"
                className="flex-1 h-12"
                onClick={() => setActiveType("ace")}
              >
                +A
              </Button>
              <Button 
                variant="destructive" 
                size="lg"
                className="flex-1 h-12"
                onClick={() => setActiveType("error")}
              >
                +E
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {/* Quality buttons - circles for aces, diamonds for errors */}
              <Button 
                variant="outline"
                size="lg"
                className={`flex-1 h-12 ${activeType === "ace" ? 'rounded-full' : 'rounded-none transform rotate-45'} ${getQualityColor("good")}`}
                onClick={() => handleServeClick(activeType, "good")}
              >
                <Plus className={`h-5 w-5 ${activeType === "error" ? "transform -rotate-45" : ""}`} />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className={`flex-1 h-12 ${activeType === "ace" ? 'rounded-full' : 'rounded-none transform rotate-45'} ${getQualityColor("neutral")}`}
                onClick={() => handleServeClick(activeType, "neutral")}
              >
                <Circle className={`h-5 w-5 ${activeType === "error" ? "transform -rotate-45" : ""}`} />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className={`flex-1 h-12 ${activeType === "ace" ? 'rounded-full' : 'rounded-none transform rotate-45'} ${getQualityColor("bad")}`}
                onClick={() => handleServeClick(activeType, "bad")}
              >
                <Minus className={`h-5 w-5 ${activeType === "error" ? "transform -rotate-45" : ""}`} />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="flex-1 h-12"
                onClick={() => setActiveType(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
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
