
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SortField, SortDirection, ServeQuality } from "../types";
import { Crown, Circle, Plus, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function Scoreboard() {
  const { sortedPlayers, getPlayerStats, currentGameDay, gameTypeFilter } = useVolleyball();
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle sort direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get the sorted players - use game type filter if no specific game day is selected
  const players = sortedPlayers(
    sortField, 
    sortDirection, 
    currentGameDay?.id, 
    !currentGameDay && gameTypeFilter ? gameTypeFilter : undefined
  );

  // Calculate quality stats for a player
  const calculateQualityStats = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { good: { aces: 0, errors: 0 }, neutral: { aces: 0, errors: 0 }, bad: { aces: 0, errors: 0 } };
    
    // Filter serves based on current context
    let relevantServes = player.serves;
    
    if (currentGameDay) {
      // Specific game day selected
      relevantServes = player.serves.filter(s => s.gameId === currentGameDay.id);
    } else if (gameTypeFilter) {
      // Game type filter applied
      const { getFilteredGameDays } = useVolleyball();
      const gameIds = getFilteredGameDays().map(g => g.id);
      relevantServes = player.serves.filter(s => gameIds.includes(s.gameId));
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

  // Calculate A/E Ratio
  const calculateAERatio = (aces: number, errors: number) => {
    if (errors === 0) return aces;
    return aces / errors;
  };

  // Calculate Quality Score
  const calculateQualityScore = (playerId: string) => {
    const qualityStats = calculateQualityStats(playerId);
    const totalServes = Object.values(qualityStats).reduce((sum, quality) => 
      sum + quality.aces + quality.errors, 0
    );
    
    if (totalServes === 0) return 0;
    
    const score = (qualityStats.good.aces + qualityStats.good.errors) * 1 +
                  (qualityStats.neutral.aces + qualityStats.neutral.errors) * 0 +
                  (qualityStats.bad.aces + qualityStats.bad.errors) * (-1);
    
    return score / totalServes;
  };

  // Get color for A/E ratio
  const getAERatioColor = (ratio: number) => {
    if (ratio > 1) return "text-sky-600"; // Same as ace button color
    if (ratio < 1) return "text-destructive"; // Same as error button color
    return "text-muted-foreground"; // Grey for ratio = 1
  };

  // Get color for Quality Score
  const getQualityScoreColor = (score: number) => {
    if (score > 0) return "text-sky-600"; // Same as ace button color
    if (score < 0) return "text-destructive"; // Same as error button color
    return "text-muted-foreground"; // Grey for score = 0
  };

  // Calculate average stats for all players
  const calculateAverageStats = () => {
    if (players.length === 0) return { totalPlayers: 0, avgQualityScore: 0, topAERatio: 0 };
    
    let totalQualityScore = 0;
    let topAERatio = 0;
    
    players.forEach(player => {
      const stats = getPlayerStats(
        player.id, 
        currentGameDay?.id, 
        !currentGameDay && gameTypeFilter ? gameTypeFilter : undefined
      );
      
      const qualityScore = calculateQualityScore(player.id);
      totalQualityScore += qualityScore;
      
      const aeRatio = calculateAERatio(stats.aces, stats.fails);
      if (aeRatio > topAERatio) {
        topAERatio = aeRatio;
      }
    });
    
    return {
      totalPlayers: players.length,
      avgQualityScore: totalQualityScore / players.length,
      topAERatio: topAERatio
    };
  };
  
  // Helper to get badge color for serve quality
  const getQualityColor = (type: "error" | "ace") => {
    return type === "ace" ? "bg-primary" : "bg-destructive";
  };

  // Quality icon component - aces are circles, errors are diamonds
  const QualityIcon = ({ quality, type, count }: { quality: ServeQuality, type: "error" | "ace", count: number }) => {
    if (count === 0) return null;
    
    const isCircle = type === "ace"; // aces are circles
    
    // Define the icon based on quality
    let Icon = Circle;
    let iconStyle = { strokeWidth: 4, fill: quality === "neutral" ? 'white' : 'none' };
    let iconSize = "h-2 w-2";
    
    if (quality === "good") {
      Icon = Plus;
      iconStyle = { strokeWidth: 4, fill: 'none' };
      iconSize = "h-2 w-2";
    } else if (quality === "bad") {
      Icon = Minus;
      iconStyle = { strokeWidth: 4, fill: 'none' };
      iconSize = "h-2 w-2";
    } else {
      // neutral - filled circle/dot
      iconSize = "h-1 w-1";
      iconStyle = { strokeWidth: 0, fill: 'white' };
    }

    return (
      <div className="flex items-center gap-1">
        <div 
          className={`flex items-center justify-center w-4 h-4 ${getQualityColor(type)}`}
          style={{ 
            borderRadius: isCircle ? '50%' : '0',
            transform: isCircle ? 'none' : 'rotate(45deg)'
          }}
        >
          <Icon 
            className={`${iconSize} text-white ${!isCircle ? "transform -rotate-45" : ""}`}
            style={iconStyle}
          />
        </div>
        <span className="text-xs">{count}</span>
      </div>
    );
  };

  const averageStats = calculateAverageStats();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scoreboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px] cursor-pointer" onClick={() => handleSort("name")}>
                  <Button variant="ghost" size="sm" className="p-0">
                    Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </Button>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("aces")}>
                  <Button variant="ghost" size="sm" className="p-0">
                    A {sortField === "aces" && (sortDirection === "asc" ? "↑" : "↓")}
                  </Button>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("fails")}>
                  <Button variant="ghost" size="sm" className="p-0">
                    E {sortField === "fails" && (sortDirection === "asc" ? "↑" : "↓")}
                  </Button>
                </TableHead>
                <TableHead>A/E</TableHead>
                <TableHead>QS</TableHead>
                <TableHead>Quality</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length > 0 ? (
                players.map((player, index) => {
                  const stats = getPlayerStats(
                    player.id, 
                    currentGameDay?.id, 
                    !currentGameDay && gameTypeFilter ? gameTypeFilter : undefined
                  );
                  const qualityStats = calculateQualityStats(player.id);
                  const isFirstPlace = index === 0 && (stats.fails + stats.aces) > 0;
                  const aeRatio = calculateAERatio(stats.aces, stats.fails);
                  const qualityScore = calculateQualityScore(player.id);
                  
                  return (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium relative">
                        {/* Crown positioned absolutely to the left of the player name */}
                        {isFirstPlace && (
                          <Crown className="absolute left-[-24px] top-1/2 transform -translate-y-1/2 h-4 w-4 text-yellow-500" />
                        )}
                        <span>{player.name}</span>
                      </TableCell>
                      <TableCell>{stats.aces}</TableCell>
                      <TableCell>{stats.fails}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${getAERatioColor(aeRatio)}`}>
                          {aeRatio.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getQualityScoreColor(qualityScore)}`}>
                          {qualityScore >= 0 ? '+' : ''}{qualityScore.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 items-center">
                          <QualityIcon quality="good" type="ace" count={qualityStats.good.aces} />
                          <QualityIcon quality="neutral" type="ace" count={qualityStats.neutral.aces} />
                          <QualityIcon quality="bad" type="ace" count={qualityStats.bad.aces} />
                          <QualityIcon quality="good" type="error" count={qualityStats.good.errors} />
                          <QualityIcon quality="neutral" type="error" count={qualityStats.neutral.errors} />
                          <QualityIcon quality="bad" type="error" count={qualityStats.bad.errors} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No player data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Average Stats Summary */}
          {players.length > 0 && (
            <div className="mt-6 flex justify-center gap-8 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Total Players:</div>
                <div className="text-2xl font-bold">{averageStats.totalPlayers}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Quality Score:</div>
                <div className={`text-2xl font-bold ${getQualityScoreColor(averageStats.avgQualityScore)}`}>
                  {averageStats.avgQualityScore >= 0 ? '+' : ''}{averageStats.avgQualityScore.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Top A/E Ratio:</div>
                <div className={`text-2xl font-bold ${getAERatioColor(averageStats.topAERatio)}`}>
                  {averageStats.topAERatio.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
