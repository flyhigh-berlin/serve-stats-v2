import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameTypeManager } from "./GameTypeManager";
import { Plus, Settings } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

export function GameDaySelector() {
  const { 
    gameDays, 
    currentGameDay, 
    setCurrentGameDay, 
    gameTypeFilter, 
    setGameTypeFilter, 
    addGameDay, 
    getAllGameTypes 
  } = useVolleyball();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedGameType, setSelectedGameType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const allGameTypes = getAllGameTypes();

  const handleAddGameDay = () => {
    if (!selectedGameType) {
      toast.error("Please select a game type");
      return;
    }

    addGameDay(selectedDate, selectedGameType as any, title || undefined, notes || undefined);
    
    // Reset form
    setSelectedDate(format(addDays(new Date(), 1), "yyyy-MM-dd"));
    setSelectedGameType("");
    setTitle("");
    setNotes("");
    setIsDialogOpen(false);
    
    toast.success("Game day added successfully!");
  };

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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Game Day</CardTitle>
          <div className="flex items-center gap-2">
            <GameTypeManager />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Game Day</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gameType">Game Type</Label>
                    <Select value={selectedGameType} onValueChange={setSelectedGameType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select game type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(allGameTypes).map(([type, name]) => (
                          <SelectItem key={type} value={type}>
                            [{type}] {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Day 1, Match vs Team A"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes about this game"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddGameDay}>Add Game Day</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
