
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SortField, SortDirection, ServeQuality } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function Scoreboard() {
  const { sortedPlayers, getPlayerStats, currentGameDay } = useVolleyball();
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

  // Get the sorted players
  const players = sortedPlayers(sortField, sortDirection, currentGameDay?.id);

  // Calculate quality stats for a player
  const calculateQualityStats = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { good: 0, neutral: 0, bad: 0 };
    
    // Filter serves by game if needed
    const relevantServes = currentGameDay
      ? player.serves.filter(s => s.gameId === currentGameDay.id)
      : player.serves;
      
    const goodServes = relevantServes.filter(s => s.quality === "good").length;
    const neutralServes = relevantServes.filter(s => s.quality === "neutral").length;
    const badServes = relevantServes.filter(s => s.quality === "bad").length;
    
    return { good: goodServes, neutral: neutralServes, bad: badServes };
  };
  
  // Helper to get badge color for serve quality
  const getQualityColor = (quality: ServeQuality) => {
    switch (quality) {
      case "good":
        return "bg-serve-good";
      case "neutral":
        return "bg-serve-neutral text-black";
      case "bad":
        return "bg-serve-bad";
      default:
        return "";
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {currentGameDay
            ? `Scoreboard for ${new Date(currentGameDay.date).toLocaleDateString()}`
            : "Season Scoreboard"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("name")}>
                <Button variant="ghost" size="sm" className="p-0">
                  Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                </Button>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("serves")}>
                <Button variant="ghost" size="sm" className="p-0">
                  Serves {sortField === "serves" && (sortDirection === "asc" ? "↑" : "↓")}
                </Button>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("fails")}>
                <Button variant="ghost" size="sm" className="p-0">
                  Fails {sortField === "fails" && (sortDirection === "asc" ? "↑" : "↓")}
                </Button>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("aces")}>
                <Button variant="ghost" size="sm" className="p-0">
                  Aces {sortField === "aces" && (sortDirection === "asc" ? "↑" : "↓")}
                </Button>
              </TableHead>
              <TableHead>Quality</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.length > 0 ? (
              players.map(player => {
                const stats = getPlayerStats(player.id, currentGameDay?.id);
                const qualityStats = calculateQualityStats(player.id);
                const totalServes = stats.fails + stats.aces;
                
                return (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>{totalServes}</TableCell>
                    <TableCell>{stats.fails}</TableCell>
                    <TableCell>{stats.aces}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {qualityStats.good > 0 && (
                          <Badge className={getQualityColor("good")}>
                            {qualityStats.good}
                          </Badge>
                        )}
                        {qualityStats.neutral > 0 && (
                          <Badge className={getQualityColor("neutral")}>
                            {qualityStats.neutral}
                          </Badge>
                        )}
                        {qualityStats.bad > 0 && (
                          <Badge className={getQualityColor("bad")}>
                            {qualityStats.bad}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
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
