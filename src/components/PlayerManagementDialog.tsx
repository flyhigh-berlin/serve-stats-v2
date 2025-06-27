
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Player, GameType } from "../types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PlayerManagementDialogProps {
  children: React.ReactNode;
}

export function PlayerManagementDialog({ children }: PlayerManagementDialogProps) {
  const { players, getAllGameTypes, updatePlayerTags, canRemoveTagFromPlayer } = useVolleyball();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  const allGameTypes = getAllGameTypes();
  
  const handleTagChange = (player: Player, tag: GameType | string, checked: boolean | string) => {
    const isChecked = checked === true;
    if (isChecked) {
      // Add tag
      const newTags = [...player.tags, tag];
      updatePlayerTags(player.id, newTags);
      toast.success(`Added [${tag}] tag to ${player.name}`);
    } else {
      // Remove tag - check if allowed
      if (!canRemoveTagFromPlayer(player.id, tag)) {
        toast.error(`Cannot remove [${tag}] tag from ${player.name} - player has recorded stats for this game type`);
        return;
      }
      const newTags = player.tags.filter(t => t !== tag);
      updatePlayerTags(player.id, newTags);
      toast.success(`Removed [${tag}] tag from ${player.name}`);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent size="default" className="flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Manage Player Tags</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 pr-4">
            {players.map(player => (
              <div key={player.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium truncate">{player.name}</h4>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(allGameTypes).map(([abbreviation, name]) => {
                    const isChecked = player.tags.includes(abbreviation);
                    const canRemove = canRemoveTagFromPlayer(player.id, abbreviation);
                    
                    return (
                      <div key={abbreviation} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${player.id}-${abbreviation}`}
                          checked={isChecked}
                          disabled={isChecked && !canRemove}
                          onCheckedChange={(checked) => handleTagChange(player, abbreviation, checked)}
                        />
                        <Label 
                          htmlFor={`${player.id}-${abbreviation}`} 
                          className={`text-sm truncate ${isChecked && !canRemove ? 'text-muted-foreground' : ''}`}
                        >
                          [{abbreviation}]
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex-shrink-0">
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
