
import React, { useState } from "react";
import { Player } from "../types";
import { useVolleyball } from "../context/VolleyballContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlayerDetailDialog } from "./PlayerDetailDialog";
import { PlayerCardHeader } from "./PlayerCardHeader";
import { QualitySelectionPopover } from "./QualitySelectionPopover";

interface PlayerCardProps {
  player: Player;
  gameId?: string;
}

export function PlayerCard({ player, gameId }: PlayerCardProps) {
  const { addServe, getPlayerStats } = useVolleyball();
  const [animatingError, setAnimatingError] = useState(false);
  const [animatingAce, setAnimatingAce] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [acePopoverOpen, setAcePopoverOpen] = useState(false);
  const [errorPopoverOpen, setErrorPopoverOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<'ace' | 'error' | null>(null);

  // Get the player's stats for the current game or all games
  const stats = getPlayerStats(player.id, gameId);

  // Handle adding a serve
  const handleServeClick = (type: "error" | "ace", quality: "good" | "neutral" | "bad") => {
    addServe(player.id, type === "error" ? "fail" : "ace", quality);

    // Action feedback animation
    setActionFeedback(type);
    setTimeout(() => setActionFeedback(null), 600);

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
  };

  // Handle button click to open popover
  const handleButtonClick = (type: "error" | "ace") => {
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
  };

  return (
    <>
      <Card className="w-full shadow-sm border-border/50 hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-3">
          <PlayerCardHeader 
            player={player}
            stats={stats}
            animatingAce={animatingAce}
            animatingError={animatingError}
            onPlayerClick={() => setIsDialogOpen(true)}
          />
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Popover open={acePopoverOpen} onOpenChange={setAcePopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="default" 
                  size="lg" 
                  onClick={() => handleButtonClick("ace")} 
                  className={`flex-1 h-12 bg-sky-600 hover:bg-sky-700 transition-all duration-200 ${
                    actionFeedback === 'ace' ? 'animate-pulse bg-sky-500 scale-105' : ''
                  }`}
                >
                  + Ace
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto" align="start">
                <QualitySelectionPopover 
                  type="ace" 
                  onServeClick={handleServeClick}
                  onClose={() => closePopover("ace")}
                />
              </PopoverContent>
            </Popover>

            <Popover open={errorPopoverOpen} onOpenChange={setErrorPopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="lg" 
                  className={`flex-1 h-12 transition-all duration-200 ${
                    actionFeedback === 'error' ? 'animate-pulse bg-red-400 scale-105' : ''
                  }`}
                  onClick={() => handleButtonClick("error")}
                >
                  + Error
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto" align="start">
                <QualitySelectionPopover 
                  type="error" 
                  onServeClick={handleServeClick}
                  onClose={() => closePopover("error")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
      
      <PlayerDetailDialog 
        playerId={player.id} 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </>
  );
}
