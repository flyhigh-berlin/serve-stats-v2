
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
import { GameDay, GameType } from "../types";

export function GameDaySelection() {
  console.log('🎨 GameDaySelection rendering'); // Debug render

  const { 
    gameDays, 
    currentGameDay, 
    setCurrentGameDay, 
    gameTypeFilter, 
    setGameTypeFilter, 
    getAllGameTypes
  } = useSupabaseVolleyball();

  const allGameTypes = getAllGameTypes();
  const gameTypeEntries = Object.entries(allGameTypes);

  console.log('🎨 GameDaySelection state:', {
    gameDaysCount: gameDays.length,
    currentGameDayId: currentGameDay?.id,
    gameTypeFilter
  });

  // Get filtered game days for display
  const getFilteredGameDays = (): GameDay[] => {
    if (!gameTypeFilter) return gameDays;
    return gameDays.filter(gd => gd.gameType === gameTypeFilter);
  };

  const filteredGameDays = getFilteredGameDays();

  // Format game display text
  const formatGameDisplay = (gameDay: GameDay) => {
    const typeLabel = `[${gameDay.gameType}]`;
    const titlePart = gameDay.title || format(new Date(gameDay.date), "EEEE");
    const datePart = format(new Date(gameDay.date), "dd.MM.yy");
    
    return `${typeLabel} ${titlePart} (${datePart})`;
  };

  const handleGameDaySelect = (value: string) => {
    if (value === "clear") {
      setCurrentGameDay(null);
      setGameTypeFilter(null);
      return;
    }

    const selectedGameDay = gameDays.find(gd => gd.id === value);
    if (selectedGameDay) {
      setCurrentGameDay(selectedGameDay);
    }
  };

  const handleGameTypeSelect = (value: string) => {
    if (value === "clear") {
      setGameTypeFilter(null);
      setCurrentGameDay(null);
      return;
    }

    setGameTypeFilter(value as GameType);
    setCurrentGameDay(null); // Clear specific game selection when filtering by type
  };

  // Determine current selection value for game day select
  const getCurrentGameDayValue = () => {
    if (currentGameDay) return currentGameDay.id;
    return "clear";
  };

  // Determine current selection value for game type select
  const getCurrentGameTypeValue = () => {
    if (gameTypeFilter) return gameTypeFilter;
    return "clear";
  };

  return (
    <div className="space-y-3">
      {/* Game Day Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Select Game Day</span>
          {currentGameDay && (
            <Badge variant="secondary" className="text-xs">
              Selected
            </Badge>
          )}
        </div>
        
        <Select 
          value={getCurrentGameDayValue()} 
          onValueChange={handleGameDaySelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a specific game day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clear">Clear Selection</SelectItem>
            {gameDays.map((gameDay) => (
              <SelectItem key={gameDay.id} value={gameDay.id}>
                {formatGameDisplay(gameDay)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Game Type Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by Game Type</span>
          {gameTypeFilter && (
            <Badge variant="secondary" className="text-xs">
              {allGameTypes[gameTypeFilter]}
            </Badge>
          )}
        </div>
        
        <Select 
          value={getCurrentGameTypeValue()} 
          onValueChange={handleGameTypeSelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by game type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clear">Show All Types</SelectItem>
            {gameTypeEntries.map(([type, name]) => (
              <SelectItem key={type} value={type}>
                [{type}] {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      {gameTypeFilter && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          Showing {filteredGameDays.length} game{filteredGameDays.length !== 1 ? 's' : ''} of type [{gameTypeFilter}] {allGameTypes[gameTypeFilter]}
        </div>
      )}
    </div>
  );
}
