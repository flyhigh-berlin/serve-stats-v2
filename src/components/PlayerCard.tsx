
import React, { useState } from "react";
import { Player, ServeQuality } from "../types";
import { useVolleyball } from "../context/VolleyballContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
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
    
    // Reset the active type and close popover
    setActiveType(null);
    setIsPopoverOpen(false);
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

  // Handle button click to open popover
  const handleButtonClick = (type: "error" | "ace") => {
    setActiveType(type);
    setIsPopoverOpen(true);
  };

  // Quality selection content
  const QualitySelectionContent = () => (
    <div className="space-y-2 p-2">
      <div className="text-sm font-medium mb-3">
        Select {activeType === "ace" ? "Ace" : "Error"} Quality
      </div>
      
      {/* Good quality */}
      <Button
        variant="outline"
        className={`w-full justify-start gap-3 h-auto py-3 ${getQualityColor("good")}`}
        onClick={() => handleServeClick(activeType!, "good")}
      >
        <div className="flex items-center gap-2">
          {activeType === "ace" ? (
            <Circle className="h-4 w-4 fill-current" />
          ) : (
            <Square className="h-4 w-4 fill-current" />
          )}
          <Plus className="h-4 w-4" />
        </div>
        <span>Good {activeType}</span>
      </Button>

      {/* Neutral quality */}
      <Button
        variant="outline"
        className={`w-full justify-start gap-3 h-auto py-3 ${getQualityColor("neutral")}`}
        onClick={() => handleServeClick(activeType!, "neutral")}
      >
        <div className="flex items-center gap-2">
          {activeType === "ace" ? (
            <Circle className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          <Circle className="h-4 w-4" />
        </div>
        <span>Neutral {activeType}</span>
      </Button>

      {/* Bad quality */}
      <Button
        variant="outline"
        className={`w-full justify-start gap-3 h-auto py-3 ${getQualityColor("bad")}`}
        onClick={() => handleServeClick(activeType!, "bad")}
      >
        <div className="flex items-center gap-2">
          {activeType === "ace" ? (
            <Circle className="h-4 w-4 fill-current" />
          ) : (
            <Square className="h-4 w-4 fill-current" />
          )}
          <Minus className="h-4 w-4" />
        </div>
        <span>Bad {activeType}</span>
      </Button>
    </div>
  );
  
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
          <div className="flex gap-2">
            <Popover open={isPopoverOpen && activeType === "ace"} onOpenChange={(open) => {
              if (!open) {
                setIsPopoverOpen(false);
                setActiveType(null);
              }
            }}>
              <PopoverTrigger asChild>
                <Button 
                  variant="default" 
                  size="lg"
                  className="flex-1 h-12"
                  onClick={() => handleButtonClick("ace")}
                >
                  + Ace
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60" align="start">
                <QualitySelectionContent />
              </PopoverContent>
            </Popover>

            <Popover open={isPopoverOpen && activeType === "error"} onOpenChange={(open) => {
              if (!open) {
                setIsPopoverOpen(false);
                setActiveType(null);
              }
            }}>
              <PopoverTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="lg"
                  className="flex-1 h-12"
                  onClick={() => handleButtonClick("error")}
                >
                  + Error
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60" align="start">
                <QualitySelectionContent />
              </PopoverContent>
            </Popover>
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
