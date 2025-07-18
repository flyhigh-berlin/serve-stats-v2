
import React from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
import { format } from "date-fns";

export function StatsDescription() {
  const { currentGameDay, gameTypeFilter, getAllGameTypes } = useSupabaseVolleyball();
  
  const allGameTypes = getAllGameTypes();
  
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
      return `Showing stats for ${formatGameDisplay(currentGameDay)}`;
    } else if (gameTypeFilter) {
      return `Showing stats for game type [${gameTypeFilter}] ${allGameTypes[gameTypeFilter]}`;
    } else {
      return "Showing stats for all games";
    }
  };
  
  return (
    <div className="mb-4 p-2 bg-muted/50 rounded-md">
      <p className="text-xs text-muted-foreground text-center truncate">
        {getDescription()}
      </p>
    </div>
  );
}
