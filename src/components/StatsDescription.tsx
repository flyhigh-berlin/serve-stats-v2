
import React from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
import { format } from "date-fns";

export function StatsDescription() {
  const { currentGameDay, gameTypeFilter, getAllGameTypes } = useSupabaseVolleyball();
  
  const allGameTypes = getAllGameTypes();
  
  console.log('StatsDescription render:', { 
    currentGameDay: currentGameDay?.id, 
    gameTypeFilter,
    currentGameDayTitle: currentGameDay?.title || currentGameDay?.date,
    timestamp: new Date().toISOString()
  });
  
  // Format game display text
  const formatGameDisplay = (gameDay: any) => {
    const typeLabel = `[${gameDay.gameType}]`;
    const titlePart = gameDay.title || format(new Date(gameDay.date), "EEEE");
    const datePart = format(new Date(gameDay.date), "dd.MM.yy");
    
    return `${typeLabel} ${titlePart} (${datePart})`;
  };

  // Get description based on current context
  const getDescription = () => {
    if (currentGameDay) {
      const description = `Showing stats for ${formatGameDisplay(currentGameDay)}`;
      console.log('Generated description for current game day:', description);
      return description;
    } else if (gameTypeFilter) {
      const description = `Showing stats for game type [${gameTypeFilter}] ${allGameTypes[gameTypeFilter]}`;
      console.log('Generated description for game type filter:', description);
      return description;
    } else {
      const description = "Showing stats for all games";
      console.log('Generated description for all games:', description);
      return description;
    }
  };
  
  // Force re-render when dependencies change
  const description = React.useMemo(() => getDescription(), [currentGameDay, gameTypeFilter, allGameTypes]);
  
  return (
    <div className="mb-4 p-2 bg-muted/50 rounded-md">
      <p className="text-xs text-muted-foreground text-center truncate">
        {description}
      </p>
    </div>
  );
}
