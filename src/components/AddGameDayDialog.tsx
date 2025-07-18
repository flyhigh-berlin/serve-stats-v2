
import React, { useState } from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
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
import { Plus } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

export function AddGameDayDialog() {
  const { addGameDay, getAllGameTypes } = useSupabaseVolleyball();
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 px-3">
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
  );
}
