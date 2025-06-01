
import React, { useState } from "react";
import { Player, ServeQuality } from "../types";
import { useVolleyball } from "../context/VolleyballContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlayerDetailDialog } from "./PlayerDetailDialog";
import { Plus, Minus, X, Circle, Info } from "lucide-react";

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
  const [acePopoverOpen, setAcePopoverOpen] = useState(false);
  const [errorPopoverOpen, setErrorPopoverOpen] = useState(false);
  
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
    
    // Close the specific popover
    if (type === "ace") {
      setAcePopoverOpen(false);
    } else {
      setErrorPopoverOpen(false);
    }
    setActiveType(null);
  };

  // Handle button click to open popover
  const handleButtonClick = (type: "error" | "ace") => {
    setActiveType(type);
    if (type === "ace") {
      setAcePopoverOpen(true);
      setErrorPopoverOpen(false);
    } else {
      setErrorPopoverOpen(true);
      setAcePopoverOpen(false);
    }
  };

  // Close popover
  const closePopover = (type: "error" | "ace") => {
    if (type === "ace") {
      setAcePopoverOpen(false);
    } else {
      setErrorPopoverOpen(false);
    }
    setActiveType(null);
  };

  // Get quality explanations
  const getQualityExplanation = (quality: ServeQuality, type: "ace" | "error") => {
    if (type === "ace") {
      switch (quality) {
        case "good": return "Well placed serve, clean execution.";
        case "neutral": return "The serve wasn't great, but the opponent made a mistake.";
        case "bad": return "Ace due to opponent error, not your serve quality";
      }
    } else {
      switch (quality) {
        case "good": return "Very good serve attempt, but just out or net";
        case "neutral": return "Mediocre execution, average fail";
        case "bad": return "Poorly executed serve, not close";
      }
    }
  };

  // Quality selection content
  const QualitySelectionContent = ({ type }: { type: "ace" | "error" }) => (
    <div className="space-y-3 p-3 relative w-full max-w-[280px] sm:max-w-[320px]">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 z-10"
        onClick={() => closePopover(type)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="text-sm font-medium mb-4 pr-8">
        Select {type === "ace" ? "Ace" : "Error"} Quality
      </div>
      
      {/* Good quality */}
      <Button
        variant="outline"
        className="w-full justify-start gap-3 h-auto py-3 bg-background hover:bg-accent"
        onClick={() => handleServeClick(type, "good")}
      >
        <div className="flex items-center gap-3 flex-1">
          <div 
            className={`flex items-center justify-center ${
              type === "ace" ? "bg-primary w-10 h-10 rounded-full" : "bg-destructive w-10 h-10 transform rotate-45"
            }`}
          >
            <Plus className={`h-4 w-4 text-white font-bold ${type === "ace" ? "" : "transform -rotate-45"}`} style={{ strokeWidth: 4 }} />
          </div>
          <span className={type === "error" ? "ml-2" : ""}>Good</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 ml-auto hover:bg-muted/50 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{getQualityExplanation("good", type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Button>

      {/* Neutral quality */}
      <Button
        variant="outline"
        className="w-full justify-start gap-3 h-auto py-3 bg-background hover:bg-accent"
        onClick={() => handleServeClick(type, "neutral")}
      >
        <div className="flex items-center gap-3 flex-1">
          <div 
            className={`flex items-center justify-center ${
              type === "ace" ? "bg-primary w-10 h-10 rounded-full" : "bg-destructive w-10 h-10 transform rotate-45"
            }`}
          >
            <Circle className={`h-2 w-2 text-white ${type === "ace" ? "" : "transform -rotate-45"}`} style={{ strokeWidth: 4, fill: 'none' }} />
          </div>
          <span className={type === "error" ? "ml-2" : ""}>Neutral</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 ml-auto hover:bg-muted/50 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{getQualityExplanation("neutral", type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Button>

      {/* Bad quality */}
      <Button
        variant="outline"
        className="w-full justify-start gap-3 h-auto py-3 bg-background hover:bg-accent"
        onClick={() => handleServeClick(type, "bad")}
      >
        <div className="flex items-center gap-3 flex-1">
          <div 
            className={`flex items-center justify-center ${
              type === "ace" ? "bg-primary w-10 h-10 rounded-full" : "bg-destructive w-10 h-10 transform rotate-45"
            }`}
          >
            <Minus className={`h-4 w-4 text-white font-bold ${type === "ace" ? "" : "transform -rotate-45"}`} style={{ strokeWidth: 4 }} />
          </div>
          <span className={type === "error" ? "ml-2" : ""}>Bad</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 ml-auto hover:bg-muted/50 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{getQualityExplanation("bad", type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
            <div className="flex items-center gap-3 flex-shrink-0 bg-muted/50 rounded-md px-2 py-1">
              <span className="text-sm flex items-center gap-1">
                <span className="text-muted-foreground">A:</span>
                <span className={`font-medium ${animatingAce ? "stat-change" : ""}`}>{stats.aces}</span>
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm flex items-center gap-1">
                <span className="text-muted-foreground">E:</span>
                <span className={`font-medium ${animatingError ? "stat-change" : ""}`}>{stats.fails}</span>
              </span>
            </div>
          </div>
          
          {/* Line 2: Action buttons */}
          <div className="flex gap-2">
            <Popover open={acePopoverOpen} onOpenChange={setAcePopoverOpen}>
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
              <PopoverContent className="w-auto" align="start">
                <QualitySelectionContent type="ace" />
              </PopoverContent>
            </Popover>

            <Popover open={errorPopoverOpen} onOpenChange={setErrorPopoverOpen}>
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
              <PopoverContent className="w-auto" align="start">
                <QualitySelectionContent type="error" />
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
