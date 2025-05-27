
import React from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export function GameDaySelection() {
  const { 
    gameDays, 
    currentGameDay, 
    setCurrentGameDay, 
    gameTypeFilter, 
    setGameTypeFilter, 
    getAllGameTypes 
  } = useVolleyball();

  const allGameTypes = getAllGameTypes();

  const handleGameDaySelect = (gameId: string) => {
    if (gameId === "all") {
      setCurrentGameDay(null);
      setGameTypeFilter(null);
    } else {
      const gameDay = gameDays.find(g => g.id === gameId);
      if (gameDay) {
        setCurrentGameDay(gameDay.id);
        setGameTypeFilter(null); // Clear game type filter when specific game is selected
      }
    }
  };

  const handleGameTypeFilterSelect = (gameType: string) => {
    if (gameType === "all") {
      setGameTypeFilter(null);
      setCurrentGameDay(null);
    } else {
      setGameTypeFilter(gameType);
      setCurrentGameDay(null); // Clear specific game selection when game type filter is applied
    }
  };

  // Format game display text
  const formatGameDisplay = (gameDay: any) => {
    const typeLabel = `[${gameDay.gameType}]`;
    const titlePart = gameDay.title || format(new Date(gameDay.date), "EEEE");
    const datePart = format(new Date(gameDay.date), "dd.MM.yy");
    
    return `${typeLabel} ${titlePart} (${datePart})`;
  };

  return (
    <div className="space-y-4">
      {/* Game Day Selection */}
      <div className="space-y-2">
        <Label>Select Game Day</Label>
        <Select 
          value={currentGameDay?.id || "all"} 
          onValueChange={handleGameDaySelect}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a game day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            {gameDays.map(gameDay => (
              <SelectItem key={gameDay.id} value={gameDay.id}>
                {formatGameDisplay(gameDay)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Game Type Filter */}
      <div className="space-y-2">
        <Label>Filter by Game Type</Label>
        <Select 
          value={gameTypeFilter || "all"} 
          onValueChange={handleGameTypeFilterSelect}
          disabled={!!currentGameDay} // Disable when specific game is selected
        >
          <SelectTrigger>
            <SelectValue placeholder="Select game type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Game Types</SelectItem>
            {Object.entries(allGameTypes).map(([type, name]) => (
              <SelectItem key={type} value={type}>
                [{type}] {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
