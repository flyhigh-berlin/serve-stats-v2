
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { GameType } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  const { addPlayer, getAllGameTypes } = useVolleyball();
  const [playerName, setPlayerName] = useState("");
  const [selectedTags, setSelectedTags] = useState<(GameType | string)[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const allGameTypes = getAllGameTypes();
  
  // Initialize with all tags selected when dialog opens
  React.useEffect(() => {
    if (isDialogOpen) {
      setSelectedTags(Object.keys(allGameTypes) as (GameType | string)[]);
    }
  }, [isDialogOpen, allGameTypes]);
  
  const handleTagChange = (tag: GameType | string, checked: boolean) => {
    if (checked) {
      setSelectedTags(prev => [...prev, tag]);
    } else {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate player name
    if (!playerName.trim()) {
      toast.error("Player name cannot be empty");
      return;
    }
    
    // Add player with selected tags
    addPlayer(playerName.trim(), selectedTags);
    setPlayerName("");
    setSelectedTags([]);
    setIsDialogOpen(false);
    toast.success(`${playerName} added to the team!`);
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
          <DialogTitle>Add New Player</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="playerName">Player Name</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Player name"
              autoFocus
            />
          </div>
          
          <div>
            <Label>Game Type Tags</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Object.entries(allGameTypes).map(([abbreviation, name]) => (
                <div key={abbreviation} className="flex items-center space-x-2">
                  <Checkbox
                    id={abbreviation}
                    checked={selectedTags.includes(abbreviation)}
                    onCheckedChange={(checked) => handleTagChange(abbreviation, checked === true)}
                  />
                  <Label htmlFor={abbreviation} className="text-sm">
                    [{abbreviation}]
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
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
