
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameTypeManager } from "./GameTypeManager";
import { AddGameDayDialog } from "./AddGameDayDialog";
import { GameDaySelection } from "./GameDaySelection";

export function GameDaySelector() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Game Day</CardTitle>
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
