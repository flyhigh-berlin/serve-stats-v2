
import React from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
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
  } = useSupabaseVolleyball();

  const allGameTypes = getAllGameTypes();

  const handleGameDaySelect = (gameId: string) => {
    console.log('GameDaySelection: handleGameDaySelect called with:', gameId, 'at', new Date().toISOString());
    
    if (gameId === "all") {
      console.log('GameDaySelection: Clearing game day and game type filter');
      setCurrentGameDay(null);
      setGameTypeFilter(null);
    } else {
      const selectedGameDay = gameDays.find(gd => gd.id === gameId);
      if (selectedGameDay) {
        console.log('GameDaySelection: Setting game day to:', selectedGameDay.title || selectedGameDay.date, 'ID:', gameId);
        console.log('GameDaySelection: Full selected game day object:', selectedGameDay);
        setCurrentGameDay(selectedGameDay); // Pass the full GameDay object
        setGameTypeFilter(null); // Clear game type filter when specific game is selected
      } else {
        console.error('GameDaySelection: Game day not found for ID:', gameId);
      }
    }
  };

  const handleGameTypeFilterSelect = (gameType: string) => {
    console.log('GameDaySelection: handleGameTypeFilterSelect called with:', gameType, 'at', new Date().toISOString());
    
    if (gameType === "all") {
      console.log('GameDaySelection: Clearing game type filter and game day');
      setGameTypeFilter(null);
      setCurrentGameDay(null);
    } else {
      console.log('GameDaySelection: Setting game type filter to:', gameType, 'and clearing game day');
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

  console.log('GameDaySelection render:', { 
    currentGameDayId: currentGameDay?.id, 
    currentGameDayTitle: currentGameDay?.title || currentGameDay?.date,
    gameTypeFilter,
    gameDaysCount: gameDays.length,
    timestamp: new Date().toISOString()
  });

  // Memoize the current values to ensure proper re-rendering and prevent stale closures
  const currentGameDayValue = React.useMemo(() => {
    const value = currentGameDay?.id || "all";
    console.log('GameDaySelection: currentGameDayValue computed as:', value);
    return value;
  }, [currentGameDay?.id]);

  const gameTypeFilterValue = React.useMemo(() => {
    const value = gameTypeFilter || "all";
    console.log('GameDaySelection: gameTypeFilterValue computed as:', value);
    return value;
  }, [gameTypeFilter]);

  return (
    <div className="space-y-4">
      {/* Game Day Selection */}
      <div className="space-y-2">
        <Label>Select Game Day</Label>
        <Select 
          key={`gameday-${currentGameDayValue}`} // Force re-render when value changes
          value={currentGameDayValue} 
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
          key={`gametype-${gameTypeFilterValue}`} // Force re-render when value changes
          value={gameTypeFilterValue} 
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
