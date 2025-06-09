import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SortField, SortDirection, ServeQuality } from "../types";
import { Crown, Circle, Plus, Minus, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [sortField, setSortField] = useState<SortField>("aeRatio");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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
    if (ratio === 0) return "text-muted-foreground";
    if (ratio > 1) return "text-sky-600";
    if (ratio < 1) return "text-destructive";
    return "text-muted-foreground";
  };

  // Get color for Quality Score
  const getQualityScoreColor = (score: number) => {
    if (score === 0) return "text-muted-foreground";
    if (score > 0) return "text-sky-600";
    if (score < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  // Get color for aces
  const getAceColor = (aces: number) => {
    return aces > 0 ? "text-sky-600" : "text-muted-foreground";
  };

  // Get color for errors
  const getErrorColor = (errors: number) => {
    return errors > 0 ? "text-destructive" : "text-muted-foreground";
  };

  // Format value with proper sign display
  const formatValue = (value: number, showSign: boolean = false) => {
    if (value === 0) return "0";
    if (showSign && value > 0) return `+${value.toFixed(1)}`;
    return value.toFixed(showSign ? 1 : 2);
  };

  // Calculate total stats for all players
  const calculateTotalStats = () => {
    if (players.length === 0) return { 
      totalAces: 0, 
      totalErrors: 0, 
      avgAERatio: 0, 
      avgQualityScore: 0 
    };
    
    let totalAces = 0;
    let totalErrors = 0;
    let totalQualityValue = 0;
    let totalServes = 0;
    
    players.forEach(player => {
      const stats = getPlayerStats(
        player.id, 
        currentGameDay?.id, 
        !currentGameDay && gameTypeFilter ? gameTypeFilter : undefined
      );
      
      totalAces += stats.aces;
      totalErrors += stats.errors;
      
      // Calculate quality values for this player
      const qualityStats = calculateQualityStats(player.id);
      const playerQualityValue = (qualityStats.good.aces + qualityStats.good.errors) * 1 +
                                (qualityStats.neutral.aces + qualityStats.neutral.errors) * 0 +
                                (qualityStats.bad.aces + qualityStats.bad.errors) * (-1);
      const playerTotalServes = Object.values(qualityStats).reduce((sum, quality) => 
        sum + quality.aces + quality.errors, 0
      );
      
      totalQualityValue += playerQualityValue;
      totalServes += playerTotalServes;
    });
    
    const avgAERatio = totalErrors === 0 ? totalAces : totalAces / totalErrors;
    const avgQualityScore = totalServes === 0 ? 0 : totalQualityValue / totalServes;
    
    return {
      totalAces,
      totalErrors,
      avgAERatio,
      avgQualityScore
    };
  };

  const totalStats = calculateTotalStats();

  // Get bold class for sorted column
  const getSortedColumnClass = (field: SortField) => {
    return sortField === field ? "font-bold" : "";
  };
  
  return (
    <Card>
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg sm:text-xl">Scoreboard</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Scoreboard Explanation</h4>
                <div className="text-xs space-y-1">
                  <p><strong>A</strong> - Number of Aces</p>
                  <p><strong>E</strong> - Number of Errors</p>
                  <p><strong>A/E</strong> - Ace to Error ratio (&gt;1 means more Aces than Errors, &lt;1 means more Errors than Aces)</p>
                  <p><strong>QS</strong> - Quality Score (good serve: +1, neutral serve: 0, bad serve: -1)</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer w-[35%] min-w-[100px] px-1 sm:px-4" onClick={() => handleSort("name")}>
                  <Button variant="ghost" size="sm" className={`p-0 text-xs sm:text-sm h-auto ${getSortedColumnClass("name")}`}>
                    Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </Button>
                </TableHead>
                <TableHead className="cursor-pointer text-center w-[15%] px-1 sm:px-4" onClick={() => handleSort("aces")}>
                  <Button variant="ghost" size="sm" className={`p-0 text-xs sm:text-sm h-auto ${getSortedColumnClass("aces")}`}>
                    A {sortField === "aces" && (sortDirection === "asc" ? "↑" : "↓")}
                  </Button>
                </TableHead>
                <TableHead className="cursor-pointer text-center w-[15%] px-1 sm:px-4" onClick={() => handleSort("errors")}>
                  <Button variant="ghost" size="sm" className={`p-0 text-xs sm:text-sm h-auto ${getSortedColumnClass("errors")}`}>
                    E {sortField === "errors" && (sortDirection === "asc" ? "↑" : "↓")}
                  </Button>
                </TableHead>
                <TableHead className="cursor-pointer text-center w-[17.5%] px-1 sm:px-4" onClick={() => handleSort("aeRatio")}>
                  <Button variant="ghost" size="sm" className={`p-0 text-xs sm:text-sm h-auto ${getSortedColumnClass("aeRatio")}`}>
                    A/E {sortField === "aeRatio" && (sortDirection === "asc" ? "↑" : "↓")}
                  </Button>
                </TableHead>
                <TableHead className="cursor-pointer text-center w-[17.5%] px-1 sm:px-4" onClick={() => handleSort("qualityScore")}>
                  <Button variant="ghost" size="sm" className={`p-0 text-xs sm:text-sm h-auto ${getSortedColumnClass("qualityScore")}`}>
                    QS {sortField === "qualityScore" && (sortDirection === "asc" ? "↑" : "↓")}
                  </Button>
                </TableHead>
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
                  const isFirstPlace = index === 0 && (stats.errors + stats.aces) > 0;
                  const aeRatio = calculateAERatio(stats.aces, stats.errors);
                  const qualityScore = calculateQualityScore(player.id);
                  
                  return (
                    <TableRow key={player.id}>
                      <TableCell className={`font-medium px-1 sm:px-4 text-xs sm:text-sm ${getSortedColumnClass("name")}`}>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-xs">{index + 1}.</span>
                          <span className="truncate">{player.name}</span>
                          {isFirstPlace && (
                            <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`text-center px-1 sm:px-4 text-xs sm:text-sm ${getAceColor(stats.aces)} ${getSortedColumnClass("aces")}`}>
                        {stats.aces}
                      </TableCell>
                      <TableCell className={`text-center px-1 sm:px-4 text-xs sm:text-sm ${getErrorColor(stats.errors)} ${getSortedColumnClass("errors")}`}>
                        {stats.errors}
                      </TableCell>
                      <TableCell className={`text-center px-1 sm:px-4 text-xs sm:text-sm ${getSortedColumnClass("aeRatio")}`}>
                        <span className={getAERatioColor(aeRatio)}>
                          {formatValue(aeRatio)}
                        </span>
                      </TableCell>
                      <TableCell className={`text-center px-1 sm:px-4 text-xs sm:text-sm ${getSortedColumnClass("qualityScore")}`}>
                        <span className={getQualityScoreColor(qualityScore)}>
                          {formatValue(qualityScore, true)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-xs sm:text-sm">
                    No player data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Total Stats Summary */}
        {players.length > 0 && (
          <div className="mt-4 sm:mt-6 grid grid-cols-4 gap-2 sm:gap-8 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Total A</div>
              <div className={`text-lg sm:text-2xl font-bold ${getAceColor(totalStats.totalAces)}`}>
                {totalStats.totalAces}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total E</div>
              <div className={`text-lg sm:text-2xl font-bold ${getErrorColor(totalStats.totalErrors)}`}>
                {totalStats.totalErrors}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Ø A/E</div>
              <div className={`text-lg sm:text-2xl font-bold ${getAERatioColor(totalStats.avgAERatio)}`}>
                {formatValue(totalStats.avgAERatio)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Ø QS</div>
              <div className={`text-lg sm:text-2xl font-bold ${getQualityScoreColor(totalStats.avgQualityScore)}`}>
                {formatValue(totalStats.avgQualityScore, true)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
