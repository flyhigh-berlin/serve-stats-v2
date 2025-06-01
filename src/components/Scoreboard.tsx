
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
    let iconStyle = { strokeWidth: 3, fill: 'none' };
    let iconSize = "h-2 w-2";
    
    if (quality === "good") {
      Icon = Plus;
      iconStyle = { strokeWidth: 3, fill: 'none' };
      iconSize = "h-2 w-2";
    } else if (quality === "bad") {
      Icon = Minus;
      iconStyle = { strokeWidth: 3, fill: 'none' };
      iconSize = "h-2 w-2";
    } else {
      // neutral - smaller hollow circle, but bolder
      iconSize = "h-1 w-1";
      iconStyle = { strokeWidth: 3, fill: 'none' };
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scoreboard</CardTitle>
      </CardHeader>
      <CardContent>
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
                
                return (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isFirstPlace && (
                          <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                        <span>{player.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{stats.aces}</TableCell>
                    <TableCell>{stats.fails}</TableCell>
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
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No player data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
