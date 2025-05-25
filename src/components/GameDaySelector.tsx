
import React, { useState } from "react";
import { format } from "date-fns";
import { useVolleyball } from "../context/VolleyballContext";
import { GameType } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameTypeManager } from "./GameTypeManager";
import { toast } from "sonner";

export function GameDaySelector() {
  const { 
    gameDays, 
    addGameDay, 
    setCurrentGameDay, 
    currentGameDay, 
    setGameTypeFilter, 
    gameTypeFilter,
    getAllGameTypes 
  } = useVolleyball();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGameDate, setNewGameDate] = useState<Date>(new Date());
  const [gameType, setGameType] = useState<GameType>("KL");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  
  const allGameTypes = getAllGameTypes();
  
  // Handle adding a new game day
  const handleAddGameDay = () => {
    if (!newGameDate) {
      toast.error("Please select a date for the game day");
      return;
    }
    
    // Use weekday as title if no title provided
    const finalTitle = title.trim() || format(newGameDate, "EEEE");
    
    addGameDay(
      newGameDate.toISOString(),
      gameType,
      finalTitle,
      notes.trim() || undefined
    );
    
    // Reset form
    setGameType("KL");
    setTitle("");
    setNotes("");
    setIsAddDialogOpen(false);
    
    toast.success("Game day added successfully!");
  };
  
  // Handle selecting a game day
  const handleSelectGameDay = (gameId: string) => {
    if (gameId === "all") {
      setCurrentGameDay(null);
    } else {
      setCurrentGameDay(gameId);
      // Clear game type filter when specific game is selected
      setGameTypeFilter(null);
    }
  };

  // Handle game type filter change
  const handleGameTypeFilterChange = (value: string) => {
    if (value === "all") {
      setGameTypeFilter(null);
    } else {
      setGameTypeFilter(value);
      // Clear specific game selection when game type filter is applied
      setCurrentGameDay(null);
    }
  };

  // Format game display text
  const formatGameDisplay = (gameDay: any) => {
    const typeLabel = `[${gameDay.gameType}]`;
    const titlePart = gameDay.title || format(new Date(gameDay.date), "EEEE");
    const datePart = format(new Date(gameDay.date), "dd.MM.yy");
    
    return (
      <span>
        {typeLabel} {titlePart} <span className="text-sm text-muted-foreground">({datePart})</span>
      </span>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center">
          <span>Game Day</span>
          <div className="flex gap-2">
            <GameTypeManager />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Add Game</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Game Day</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col items-center gap-4">
                    <Calendar
                      mode="single"
                      selected={newGameDate}
                      onSelect={(date) => date && setNewGameDate(date)}
                      className="rounded-md border pointer-events-auto"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gameType">Game Type</Label>
                    <Select value={gameType} onValueChange={(value) => setGameType(value as GameType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(allGameTypes).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            [{key}] {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Leave blank to use weekday"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleAddGameDay}>
                    Add Game Day
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Game selection */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Select Game</Label>
          <Select 
            onValueChange={handleSelectGameDay}
            value={currentGameDay?.id || "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a game day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Games (Total Stats)
              </SelectItem>
              {gameDays.map((gameDay) => (
                <SelectItem key={gameDay.id} value={gameDay.id}>
                  {formatGameDisplay(gameDay)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Game type filter - only show when no specific game is selected */}
        {!currentGameDay && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Filter by Game Type</Label>
            <Select 
              onValueChange={handleGameTypeFilterChange}
              value={gameTypeFilter || "all"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Game Types</SelectItem>
                {Object.entries(allGameTypes).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    [{key}] {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
