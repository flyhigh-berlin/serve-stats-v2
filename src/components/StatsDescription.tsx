
import React from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
import { format } from "date-fns";

export function StatsDescription() {
  const { currentGameDay, gameTypeFilter, getAllGameTypes } = useSupabaseVolleyball();
  
  console.log('📋 STATS DESCRIPTION DEBUG - Component render:', { 
    currentGameDayId: currentGameDay?.id, 
    currentGameDayTitle: currentGameDay?.title || currentGameDay?.date,
    gameTypeFilter,
    timestamp: new Date().toISOString()
  });
  
  // Format game display text
  const formatGameDisplay = (gameDay: any) => {
    const typeLabel = `[${gameDay.gameType}]`;
    const titlePart = gameDay.title || format(new Date(gameDay.date), "EEEE");
    const datePart = format(new Date(gameDay.date), "dd.MM.yy");
    
    return `${typeLabel} ${titlePart} (${datePart})`;
  };

  // Compute description directly to ensure proper re-rendering
  const description = React.useMemo(() => {
    console.log('📋 STATS DESCRIPTION DEBUG - useMemo executing with:', {
      currentGameDayId: currentGameDay?.id,
      currentGameDayTitle: currentGameDay?.title || currentGameDay?.date,
      gameTypeFilter,
      timestamp: new Date().toISOString()
    });
    
    if (currentGameDay) {
      const result = `Showing stats for ${formatGameDisplay(currentGameDay)}`;
      console.log('📋 STATS DESCRIPTION DEBUG - Generated description for current game day:', result);
      return result;
    } else if (gameTypeFilter) {
      const allGameTypes = getAllGameTypes();
      const result = `Showing stats for game type [${gameTypeFilter}] ${allGameTypes[gameTypeFilter]}`;
      console.log('📋 STATS DESCRIPTION DEBUG - Generated description for game type filter:', result);
      return result;
    } else {
      const result = "Showing stats for all games";
      console.log('📋 STATS DESCRIPTION DEBUG - Generated description for all games:', result);
      return result;
    }
  }, [currentGameDay?.id, currentGameDay?.title, currentGameDay?.date, currentGameDay?.gameType, gameTypeFilter, getAllGameTypes]);
  
  console.log('📋 STATS DESCRIPTION DEBUG - Final description:', description);
  
  return (
    <div className="mb-4 p-2 bg-muted/50 rounded-md">
      <p className="text-xs text-muted-foreground text-center truncate">
        {description}
      </p>
    </div>
  );
}
