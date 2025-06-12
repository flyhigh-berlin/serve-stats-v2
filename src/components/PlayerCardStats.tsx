
import React from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { ServeQuality } from "../types";
import { Plus, Minus, Circle } from "lucide-react";

interface PlayerCardStatsProps {
  playerId: string;
  gameId?: string;
}

export function PlayerCardStats({ playerId, gameId }: PlayerCardStatsProps) {
  const { players } = useVolleyball();

  // Calculate quality stats for the player
  const calculateQualityStats = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return {
      good: { aces: 0, errors: 0 },
      neutral: { aces: 0, errors: 0 },
      bad: { aces: 0, errors: 0 }
    };

    // Filter serves based on current context
    let relevantServes = player.serves;
    if (gameId) {
      relevantServes = player.serves.filter(s => s.gameId === gameId);
    }

    const qualityStats = {
      good: { aces: 0, errors: 0 },
      neutral: { aces: 0, errors: 0 },
      bad: { aces: 0, errors: 0 }
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

  // Quality icon component for overview stats
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
    const isCircle = type === "ace";

    // Define the icon based on quality
    let Icon = Circle;
    let iconStyle = {
      strokeWidth: 5,
      fill: quality === "neutral" ? 'white' : 'none'
    };
    let iconSize = "h-2 w-2";
    
    if (quality === "good") {
      Icon = Plus;
      iconStyle = { strokeWidth: 5, fill: 'none' };
      iconSize = "h-2 w-2";
    } else if (quality === "bad") {
      Icon = Minus;
      iconStyle = { strokeWidth: 5, fill: 'none' };
      iconSize = "h-2 w-2";
    } else {
      // neutral - filled dot
      iconSize = "h-1 w-1";
      iconStyle = { strokeWidth: 0, fill: 'white' };
    }

    return (
      <div className="flex items-center gap-1">
        <div className={`flex items-center justify-center ${isCircle ? 'w-5 h-5 rounded-full' : 'w-4 h-4 transform rotate-45'} ${getQualityColor(type)} ${!isCircle ? 'mr-1' : ''}`}>
          <Icon 
            className={`${iconSize} text-white ${!isCircle ? "transform -rotate-45" : ""}`} 
            style={iconStyle} 
          />
        </div>
        <span className="text-xs font-medium">{count}</span>
      </div>
    );
  };

  const qualityStats = calculateQualityStats(playerId);

  return (
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
  );
}
