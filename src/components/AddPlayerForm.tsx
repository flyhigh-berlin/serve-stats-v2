
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function AddPlayerForm() {
  const { addPlayer } = useVolleyball();
  const [playerName, setPlayerName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate player name
    if (!playerName.trim()) {
      toast.error("Player name cannot be empty");
      return;
    }
    
    // Add player
    addPlayer(playerName.trim());
    setPlayerName("");
    setIsDialogOpen(false);
    toast.success(`${playerName} added to the team!`);
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Player</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
