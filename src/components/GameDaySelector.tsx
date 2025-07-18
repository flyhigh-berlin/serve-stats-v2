
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameTypeManager } from "./GameTypeManager";
import { AddGameDayDialog } from "./AddGameDayDialog";
import { GameDaySelection } from "./GameDaySelection";
import { Info } from "lucide-react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";

export function GameDaySelector() {
  const { getAllGameTypes } = useSupabaseVolleyball();
  const allGameTypes = getAllGameTypes();

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Game Day
            <div className="group relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="invisible group-hover:visible absolute z-10 w-80 p-3 bg-popover border rounded-lg shadow-lg text-sm -top-2 left-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Game Type Abbreviations:</h4>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(allGameTypes).map(([abbr, name]) => (
                        <div key={abbr}>
                          <span className="font-mono font-bold">[{abbr}]</span> - {name}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">How Filtering Works:</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Add or choose a Game Day to add service Aces or Service Errors to players</li>
                      <li>• Stats will be shown for the selected Game Day</li>
                      <li>• OR select All Games & a specific Game Type to show stats for all games of this type</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            <GameTypeManager />
            <AddGameDayDialog />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <GameDaySelection />
      </CardContent>
    </Card>
  );
}
