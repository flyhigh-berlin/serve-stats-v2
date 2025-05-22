
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Serve, ServeQuality } from "../types";
import { format } from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Trash, Pencil, Square, Plus, Circle, Minus } from "lucide-react";

interface PlayerDetailDialogProps {
  playerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerDetailDialog({ playerId, isOpen, onClose }: PlayerDetailDialogProps) {
  const { players, removeServe, currentGameDay, updatePlayerName } = useVolleyball();
  
  // Find the player by id
  const player = players.find(p => p.id === playerId);
  if (!player) return null;
  
  const [editedName, setEditedName] = useState(player.name);
  const [isEditing, setIsEditing] = useState(false);
  
  // Get the serves to display (filtered by current game day if one is selected)
  const serves = currentGameDay 
    ? player.serves.filter(serve => serve.gameId === currentGameDay.id)
    : player.serves;
  
  // Sort serves by timestamp (newest first)
  const sortedServes = [...serves].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Helper to get quality color
  const getQualityColor = (quality: ServeQuality) => {
    switch (quality) {
      case "good":
        return "bg-serve-good";
      case "neutral":
        return "bg-serve-neutral text-black";
      case "bad":
        return "bg-serve-bad";
      default:
        return "";
    }
  };
  
  // Get quality icon based on quality and type
  const QualityIcon = ({ quality, type }: { quality: ServeQuality, type: "fail" | "ace" }) => {
    const isCircle = type === "fail";
    
    // Define the icon based on quality
    let Icon = Circle;
    if (quality === "good") Icon = Plus;
    else if (quality === "bad") Icon = Minus;

    return (
      <div className="flex items-center justify-center w-8">
        <div 
          className={`relative flex items-center justify-center ${isCircle ? 'rounded-full h-8 w-8' : 'rounded-none transform rotate-45 h-7 w-7 scale-90'} ${getQualityColor(quality)}`}
        >
          <Icon className={`h-3 w-3 absolute ${!isCircle ? "transform -rotate-45" : ""}`} />
        </div>
      </div>
    );
  };
  
  const handleSave = () => {
    // Trim the name and ensure it's not empty
    const trimmedName = editedName.trim();
    if (trimmedName) {
      updatePlayerName(player.id, trimmedName);
    }
    setIsEditing(false);
  };
  
  const handleDeleteServe = (serveId: string) => {
    removeServe(player.id, serveId);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{player.name}</span>
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Edit player name (only shown when isEditing is true) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="name">Player Name</Label>
              <div className="flex space-x-2">
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter player name"
                  className="flex-grow"
                />
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )}
          
          {/* Serve history */}
          <div className="space-y-2">
            <Label>Serve History</Label>
            {sortedServes.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedServes.map((serve) => (
                      <TableRow key={serve.id}>
                        <TableCell>
                          <Badge variant={serve.type === "fail" ? "destructive" : "default"}>
                            {serve.type === "fail" ? "Fail" : "Ace"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <QualityIcon quality={serve.quality} type={serve.type} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(serve.timestamp), "MMM d, yyyy - p")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDeleteServe(serve.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground border rounded-md">
                No serve records found.
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
