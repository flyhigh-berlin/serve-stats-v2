
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Trash, Pencil, Square, Plus, Circle, Minus, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface PlayerDetailDialogProps {
  playerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerDetailDialog({ playerId, isOpen, onClose }: PlayerDetailDialogProps) {
  const { players, removeServe, currentGameDay, updatePlayerName, removePlayer } = useVolleyball();
  const { toast } = useToast();
  
  // Find the player by id
  const player = players.find(p => p.id === playerId);
  if (!player) return null;
  
  const [editedName, setEditedName] = useState(player.name);
  const [isEditing, setIsEditing] = useState(false);
  
  // Alert dialog state
  const [isDeleteServeDialogOpen, setIsDeleteServeDialogOpen] = useState(false);
  const [isDeletePlayerDialogOpen, setIsDeletePlayerDialogOpen] = useState(false);
  const [serveToDelete, setServeToDelete] = useState<string | null>(null);
  
  // Get the serves to display (filtered by current game day if one is selected)
  const serves = currentGameDay 
    ? player.serves.filter(serve => serve.gameId === currentGameDay.id)
    : player.serves;
  
  // Sort serves by timestamp (newest first)
  const sortedServes = [...serves].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Count serves by type and quality
  const serveCounts = {
    ace: {
      good: 0,
      neutral: 0,
      bad: 0,
      total: 0
    },
    fail: {
      good: 0,
      neutral: 0,
      bad: 0,
      total: 0
    }
  };
  
  // Count the serves
  serves.forEach(serve => {
    serveCounts[serve.type][serve.quality]++;
    serveCounts[serve.type].total++;
  });
  
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
  
  // Small version of icon for the summary
  const SummaryIcon = ({ quality, type }: { quality: ServeQuality, type: "fail" | "ace" }) => {
    const isCircle = type === "fail";
    
    // Define the icon based on quality
    let Icon = Circle;
    if (quality === "good") Icon = Plus;
    else if (quality === "bad") Icon = Minus;

    return (
      <div className="flex items-center justify-center w-5">
        <div 
          className={`relative flex items-center justify-center ${isCircle ? 'rounded-full h-5 w-5' : 'rounded-none transform rotate-45 h-4 w-4 scale-90'} ${getQualityColor(quality)}`}
        >
          <Icon className={`h-2 w-2 absolute ${!isCircle ? "transform -rotate-45" : ""}`} />
        </div>
      </div>
    );
  };
  
  const handleSave = () => {
    // Trim the name and ensure it's not empty
    const trimmedName = editedName.trim();
    if (trimmedName) {
      updatePlayerName(player.id, trimmedName);
      toast({
        title: "Player name updated",
        description: `Player name changed to "${trimmedName}"`,
      });
    }
    setIsEditing(false);
  };
  
  const handleDeleteServeClick = (serveId: string) => {
    setServeToDelete(serveId);
    setIsDeleteServeDialogOpen(true);
  };
  
  const handleDeleteServe = () => {
    if (serveToDelete) {
      removeServe(player.id, serveToDelete);
      toast({
        title: "Serve deleted",
        description: "The serve record has been removed",
      });
    }
    setIsDeleteServeDialogOpen(false);
    setServeToDelete(null);
  };
  
  const handleDeletePlayer = () => {
    removePlayer(player.id);
    setIsDeletePlayerDialogOpen(false);
    toast({
      title: "Player deleted",
      description: `Player "${player.name}" has been removed`,
    });
    onClose();
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{player.name}</span>
              {!isEditing && (
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setIsDeletePlayerDialogOpen(true)}
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
            
            {/* Updated serve summary - all in one line */}
            <div className="mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Aces ({serveCounts.ace.total})</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <SummaryIcon quality="good" type="ace" />
                      <span className="text-sm">{serveCounts.ace.good}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SummaryIcon quality="neutral" type="ace" />
                      <span className="text-sm">{serveCounts.ace.neutral}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SummaryIcon quality="bad" type="ace" />
                      <span className="text-sm">{serveCounts.ace.bad}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Fails ({serveCounts.fail.total})</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <SummaryIcon quality="good" type="fail" />
                      <span className="text-sm">{serveCounts.fail.good}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SummaryIcon quality="neutral" type="fail" />
                      <span className="text-sm">{serveCounts.fail.neutral}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SummaryIcon quality="bad" type="fail" />
                      <span className="text-sm">{serveCounts.fail.bad}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-2" />
            </div>
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
                            {format(new Date(serve.timestamp), "MM.dd.yy")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDeleteServeClick(serve.id)}
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
      
      {/* Delete Serve Confirmation Dialog */}
      <AlertDialog open={isDeleteServeDialogOpen} onOpenChange={setIsDeleteServeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Serve Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this serve record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteServe} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Player Confirmation Dialog */}
      <AlertDialog open={isDeletePlayerDialogOpen} onOpenChange={setIsDeletePlayerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete player "{player.name}"? All their serve history will be permanently deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlayer} className="bg-destructive text-destructive-foreground">
              Delete Player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
