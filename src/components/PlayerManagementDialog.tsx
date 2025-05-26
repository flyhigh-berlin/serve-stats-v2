
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PlayerManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerManagementDialog({ isOpen, onClose }: PlayerManagementDialogProps) {
  const { players, getAllGameTypes, updatePlayerTags, canRemoveTagFromPlayer } = useVolleyball();
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Player Tags</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {players.map(player => (
            <div key={player.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{player.name}</h4>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {player.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      [{tag}]
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
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
                        className={`text-sm ${isChecked && !canRemove ? 'text-muted-foreground' : ''}`}
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
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
