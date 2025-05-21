
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function AddPlayerForm() {
  const { addPlayer } = useVolleyball();
  const [playerName, setPlayerName] = useState("");
  
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
    toast.success(`${playerName} added to the team!`);
  };
  
  return (
    <Card>
      <CardHeader className="pb-1 pt-4">
        <CardTitle className="text-lg">Add Player</CardTitle>
      </CardHeader>
      <CardContent className="pt-1 pb-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player name"
            className="flex-1"
          />
          <Button type="submit" className="px-4 text-sm">Add</Button>
        </form>
      </CardContent>
    </Card>
  );
}
