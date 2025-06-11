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

export function PlayerCard({
  player,
  gameId
}: PlayerCardProps) {
  const {
    addServe,
    getPlayerStats,
    players
  } = useVolleyball();
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
        case "good":
          return "Well placed serve, clean execution.";
        case "neutral":
          return "The serve wasn't great, but the opponent made a mistake.";
        case "bad":
          return "Ace due to opponent error, not your serve quality";
      }
    } else {
      switch (quality) {
        case "good":
          return "Very good serve attempt, but just out or net";
        case "neutral":
          return "Mediocre execution, average fail";
        case "bad":
          return "Poorly executed serve, not close";
      }
    }
  };

  // Calculate quality stats for the player
  const calculateQualityStats = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return {
      good: {
        aces: 0,
        errors: 0
      },
      neutral: {
        aces: 0,
        errors: 0
      },
      bad: {
        aces: 0,
        errors: 0
      }
    };

    // Filter serves based on current context
    let relevantServes = player.serves;
    if (gameId) {
      // Specific game day selected
      relevantServes = player.serves.filter(s => s.gameId === gameId);
    }
    const qualityStats = {
      good: {
        aces: 0,
        errors: 0
      },
      neutral: {
        aces: 0,
        errors: 0
      },
      bad: {
        aces: 0,
        errors: 0
      }
    };
    relevantServes.forEach(serve => {
      if (serve.type === "ace") {
        qualityStats[serve.quality].aces++;
      } else {
        qualityStats[serve.quality].errors++;
      }
    });
    return qualityStats;
  };

  // Helper to get badge color for serve quality
  const getQualityColor = (type: "error" | "ace") => {
    return type === "ace" ? "ace-bg" : "error-bg";
  };

  // Quality icon component for overview stats - consistent sizing
  const OverviewQualityIcon = ({
    quality,
    type,
    count
  }: {
    quality: ServeQuality;
    type: "error" | "ace";
    count: number;
  }) => {
    if (count === 0) return null;
    const isCircle = type === "ace"; // aces are circles

    // Define the icon based on quality - using consistent sizes
    let Icon = Circle;
    let iconStyle = {
      strokeWidth: 5,
      fill: quality === "neutral" ? 'white' : 'none'
    };
    let iconSize = "h-2 w-2";
    if (quality === "good") {
      Icon = Plus;
      iconStyle = {
        strokeWidth: 5,
        fill: 'none'
      };
      iconSize = "h-2 w-2";
    } else if (quality === "bad") {
      Icon = Minus;
      iconStyle = {
        strokeWidth: 5,
        fill: 'none'
      };
      iconSize = "h-2 w-2";
    } else {
      // neutral - filled dot
      iconSize = "h-1 w-1";
      iconStyle = {
        strokeWidth: 0,
        fill: 'white'
      };
    }
    return <div className="flex items-center gap-1">
        <div className={`flex items-center justify-center ${isCircle ? 'w-5 h-5 rounded-full' : 'w-4 h-4 transform rotate-45'} ${getQualityColor(type)} ${!isCircle ? 'mr-1' : ''}`}>
          <Icon className={`${iconSize} text-white ${!isCircle ? "transform -rotate-45" : ""}`} style={iconStyle} />
        </div>
        <span className="text-xs font-medium">{count}</span>
      </div>;
  };

  // Quality selection content - using much smaller neutral dots for popover
  const QualitySelectionContent = ({
    type
  }: {
    type: "ace" | "error";
  }) => <div className="space-y-3 p-3 relative w-full max-w-[260px] sm:max-w-[280px]">
      {/* Close button */}
      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 z-10" onClick={() => closePopover(type)}>
        <X className="h-4 w-4" />
      </Button>

      <div className="text-sm font-medium mb-4 pr-8">
        Select {type === "ace" ? "Ace" : "Error"} Quality
      </div>
      
      {/* Good quality */}
      <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 bg-background hover:bg-accent" onClick={() => handleServeClick(type, "good")}>
        <div className="flex items-center gap-3 flex-1">
          <div className={`flex items-center justify-center ${type === "ace" ? "ace-bg w-8 h-8 rounded-full" : "error-bg w-6 h-6 transform rotate-45"}`}>
            <Plus className={`h-3 w-3 text-white font-bold ${type === "ace" ? "" : "transform -rotate-45"}`} style={{
            strokeWidth: 5
          }} />
          </div>
          <span className={type === "error" ? "ml-1" : ""}>Good</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-auto flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50" onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} type="button">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{getQualityExplanation("good", type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Button>

      {/* Neutral quality */}
      <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 bg-background hover:bg-accent" onClick={() => handleServeClick(type, "neutral")}>
        <div className="flex items-center gap-3 flex-1">
          <div className={`flex items-center justify-center ${type === "ace" ? "ace-bg w-8 h-8 rounded-full" : "error-bg w-6 h-6 transform rotate-45"}`}>
            <Circle className={`h-0.5 w-0.5 text-white ${type === "ace" ? "" : "transform -rotate-45"}`} style={{
            strokeWidth: 0,
            fill: 'white'
          }} />
          </div>
          <span className={type === "error" ? "ml-1" : ""}>Neutral</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-auto flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50" onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} type="button">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{getQualityExplanation("neutral", type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Button>

      {/* Bad quality */}
      <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 bg-background hover:bg-accent" onClick={() => handleServeClick(type, "bad")}>
        <div className="flex items-center gap-3 flex-1">
          <div className={`flex items-center justify-center ${type === "ace" ? "ace-bg w-8 h-8 rounded-full" : "error-bg w-6 h-6 transform rotate-45"}`}>
            <Minus className={`h-3 w-3 text-white font-bold ${type === "ace" ? "" : "transform -rotate-45"}`} style={{
            strokeWidth: 5
          }} />
          </div>
          <span className={type === "error" ? "ml-1" : ""}>Bad</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-auto flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50" onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} type="button">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{getQualityExplanation("bad", type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Button>
    </div>;

  const qualityStats = calculateQualityStats(player.id);
  
  return <>
      <Card className="w-full">
        <CardContent className="p-3">
          {/* Line 1: Player name, # of aces, # of errors */}
          <div className="flex items-center justify-between mb-3 cursor-pointer hover:text-primary" onClick={() => setIsDialogOpen(true)}>
            <span className="font-semibold truncate flex-grow mr-4">
              {player.name}
            </span>
            <div className="flex items-center gap-3 flex-shrink-0 bg-gradient-to-r from-muted/30 to-muted/60 rounded-lg px-3 py-2 border shadow-sm">
              <span className="text-sm flex items-center gap-1.5">
                <span className="text-muted-foreground font-medium">A:</span>
                <span className={`font-bold ace-text ${animatingAce ? "stat-change" : ""}`}>{stats.aces}</span>
              </span>
              <div className="w-px h-4 bg-border"></div>
              <span className="text-sm flex items-center gap-1.5">
                <span className="font-medium text-xl error-text">E:</span>
                <span className={`font-bold error-text ${animatingError ? "stat-change" : ""}`}>{stats.errors}</span>
              </span>
            </div>
          </div>

          {/* Quality overview stats */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-2 items-center justify-center">
              <OverviewQualityIcon quality="good" type="ace" count={qualityStats.good.aces} />
              <OverviewQualityIcon quality="neutral" type="ace" count={qualityStats.neutral.aces} />
              <OverviewQualityIcon quality="bad" type="ace" count={qualityStats.bad.aces} />
              <OverviewQualityIcon quality="good" type="error" count={qualityStats.good.errors} />
              <OverviewQualityIcon quality="neutral" type="error" count={qualityStats.neutral.errors} />
              <OverviewQualityIcon quality="bad" type="error" count={qualityStats.bad.errors} />
            </div>
          </div>
          
          {/* Line 2: Action buttons */}
          <div className="flex gap-2">
            <Popover open={acePopoverOpen} onOpenChange={setAcePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="default" size="lg" onClick={() => handleButtonClick("ace")} className="flex-1 h-12 bg-sky-600 hover:bg-sky-700">
                  + Ace
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto" align="start">
                <QualitySelectionContent type="ace" />
              </PopoverContent>
            </Popover>

            <Popover open={errorPopoverOpen} onOpenChange={setErrorPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="destructive" size="lg" className="flex-1 h-12" onClick={() => handleButtonClick("error")}>
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
      <PlayerDetailDialog playerId={player.id} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </>;
}
