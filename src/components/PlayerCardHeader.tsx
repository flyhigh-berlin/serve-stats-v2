
import React from "react";
import { Player } from "../types";

interface PlayerCardHeaderProps {
  player: Player;
  stats: { aces: number; errors: number };
  animatingAce: boolean;
  animatingError: boolean;
  onPlayerClick: () => void;
}

export function PlayerCardHeader({ 
  player, 
  stats, 
  animatingAce, 
  animatingError, 
  onPlayerClick 
}: PlayerCardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3 cursor-pointer hover:text-primary" onClick={onPlayerClick}>
      <span className="font-semibold truncate flex-grow mr-4">
        {player.name}
      </span>
      <div className="flex items-center gap-3 flex-shrink-0 bg-gradient-to-r from-muted/30 to-muted/60 rounded-lg px-3 py-2 border shadow-sm">
        <span className="text-sm flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium">A:</span>
          <span className={`font-bold text-base ace-text ${animatingAce ? "stat-change" : ""}`}>
            {stats.aces}
          </span>
        </span>
        <div className="w-px h-4 bg-border"></div>
        <span className="text-sm flex items-center gap-1.5">
          <span className="font-medium text-xl error-text">E:</span>
          <span className={`font-bold text-base error-text ${animatingError ? "stat-change" : ""}`}>
            {stats.errors}
          </span>
        </span>
      </div>
    </div>
  );
}
