
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Serve, ServeQuality, GameType } from "../types";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash, Pencil, Square, Plus, Circle, Minus, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface PlayerDetailDialogProps {
  playerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerDetailDialog({ playerId, isOpen, onClose }: PlayerDetailDialogProps) {
  const { 
    players, 
    removeServe, 
    currentGameDay, 
    updatePlayerName, 
    removePlayer,
    getAllGameTypes,
    updatePlayerTags,
    canRemoveTagFromPlayer,
    getPlayerStats,
    gameTypeFilter
  } = useVolleyball();
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
  
  const allGameTypes = getAllGameTypes();
  
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
  
  // Get player stats for A/E ratio and quality score
  const stats = getPlayerStats(
    player.id, 
    currentGameDay?.id, 
    !currentGameDay && gameTypeFilter ? gameTypeFilter : undefined
  );
  
  // Calculate A/E Ratio
  const calculateAERatio = (aces: number, errors: number) => {
    if (errors === 0) return aces;
    return aces / errors;
  };
  
  // Calculate Quality Score
  const calculateQualityScore = () => {
    const totalServes = Object.values(serveCounts).reduce((sum, type) => 
      sum + type.good + type.neutral + type.bad, 0
    );
    
    if (totalServes === 0) return 0;
    
    const score = (serveCounts.ace.good + serveCounts.fail.good) * 1 +
                  (serveCounts.ace.neutral + serveCounts.fail.neutral) * 0 +
                  (serveCounts.ace.bad + serveCounts.fail.bad) * (-1);
    
    return score / totalServes;
  };
  
  const aeRatio = calculateAERatio(stats.aces, stats.errors);
  const qualityScore = calculateQualityScore();
  
  // Helper to get quality color - use global ace/error colors
  const getQualityColor = (quality: ServeQuality, type: "fail" | "ace") => {
    return type === "ace" ? "ace-bg" : "error-bg";
  };
  
  // Get quality icon based on quality and type
  const QualityIcon = ({ quality, type }: { quality: ServeQuality, type: "fail" | "ace" }) => {
    const isCircle = type === "ace"; // aces are circles, errors are diamonds
    
    // Define the icon based on quality
    let Icon = Circle;
    let iconStyle = { strokeWidth: 5, fill: quality === "neutral" ? 'white' : 'none' };
    let iconSize = "h-3 w-3";
    
    if (quality === "good") {
      Icon = Plus;
      iconStyle = { strokeWidth: 5, fill: 'none' };
      iconSize = "h-3 w-3";
    } else if (quality === "bad") {
      Icon = Minus;
      iconStyle = { strokeWidth: 5, fill: 'none' };
      iconSize = "h-3 w-3";
    } else {
      // neutral - filled circle/dot with bolder appearance
      iconSize = "h-1.5 w-1.5";
      iconStyle = { strokeWidth: 0, fill: 'white' };
    }

    return (
      <div className="flex items-center justify-center w-8 h-8">
        <div 
          className={`relative flex items-center justify-center ${isCircle ? 'rounded-full h-8 w-8' : 'rounded-none transform rotate-45 h-7 w-7'} ${getQualityColor(quality, type)}`}
        >
          <Icon 
            className={`${iconSize} absolute text-white ${!isCircle ? "transform -rotate-45" : ""}`} 
            style={iconStyle}
          />
        </div>
      </div>
    );
  };
  
  // Small version of icon for the summary
  const SummaryIcon = ({ quality, type }: { quality: ServeQuality, type: "fail" | "ace" }) => {
    const isCircle = type === "ace"; // aces are circles, errors are diamonds
    
    // Define the icon based on quality
    let Icon = Circle;
    let iconStyle = { strokeWidth: 4, fill: quality === "neutral" ? 'white' : 'none' };
    let iconSize = "h-2 w-2";
    
    if (quality === "good") {
      Icon = Plus;
      iconStyle = { strokeWidth: 4, fill: 'none' };
      iconSize = "h-2 w-2";
    } else if (quality === "bad") {
      Icon = Minus;
      iconStyle = { strokeWidth: 4, fill: 'none' };
      iconSize = "h-2 w-2";
    } else {
      // neutral - filled circle/dot with consistent size
      iconSize = "h-1 w-1";
      iconStyle = { strokeWidth: 0, fill: 'white' };
    }

    return (
      <div className="flex items-center justify-center w-5 h-5">
        <div 
          className={`relative flex items-center justify-center ${isCircle ? 'rounded-full h-5 w-5' : 'rounded-none transform rotate-45 h-4 w-4'} ${getQualityColor(quality, type)}`}
        >
          <Icon 
            className={`${iconSize} absolute text-white ${!isCircle ? "transform -rotate-45" : ""}`}
            style={iconStyle}
          />
        </div>
      </div>
    );
  };
  
  // Color helpers for stats
  const getAERatioColor = (ratio: number) => {
    if (ratio === 0) return "text-muted-foreground";
    if (ratio > 1) return "ace-text";
    if (ratio < 1) return "error-text";
    return "text-muted-foreground";
  };
  
  const getQualityScoreColor = (score: number) => {
    if (score === 0) return "text-muted-foreground";
    if (score > 0) return "ace-text";
    if (score < 0) return "error-text";
    return "text-muted-foreground";
  };
  
  const formatValue = (value: number, showSign: boolean = false) => {
    if (value === 0) return "0";
    if (showSign && value > 0) return `+${value.toFixed(1)}`;
    return value.toFixed(showSign ? 1 : 2);
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
  
  const handleTagChange = (tag: GameType | string, checked: boolean) => {
    if (checked) {
      // Add tag
      const newTags = [...player.tags, tag];
      updatePlayerTags(player.id, newTags);
      toast({
        title: "Tag added",
        description: `Added [${tag}] tag to ${player.name}`,
      });
    } else {
      // Remove tag - check if allowed
      if (!canRemoveTagFromPlayer(player.id, tag)) {
        toast({
          title: "Cannot remove tag",
          description: `Cannot remove [${tag}] tag - player has recorded stats for this game type`,
          variant: "destructive",
        });
        return;
      }
      const newTags = player.tags.filter(t => t !== tag);
      updatePlayerTags(player.id, newTags);
      toast({
        title: "Tag removed",
        description: `Removed [${tag}] tag from ${player.name}`,
      });
    }
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
            <DialogTitle className="flex items-center gap-2">
              <span>{player.name}</span>
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </DialogTitle>
            
            {/* Show player tags only when editing */}
            {isEditing && (
              <div className="flex gap-1 flex-wrap">
                {player.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    [{tag}]
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Updated serve summary - all in one line */}
            <div className="mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1 text-left">Aces ({serveCounts.ace.total})</h4>
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
                  <h4 className="text-sm font-medium mb-1 text-left">Errors ({serveCounts.fail.total})</h4>
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
              
              {/* A/E Ratio and Quality Score */}
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <h4 className="text-sm font-medium mb-1 text-left">A/E Ratio</h4>
                  <div className={`text-lg font-bold ${getAERatioColor(aeRatio)}`}>
                    {formatValue(aeRatio)}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1 text-left">Quality Score</h4>
                  <div className={`text-lg font-bold ${getQualityScoreColor(qualityScore)}`}>
                    {formatValue(qualityScore, true)}
                  </div>
                </div>
              </div>
              
              <Separator className="my-2" />
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Edit player name and tags (only shown when isEditing is true) */}
            {isEditing && (
              <div className="space-y-4">
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
                
                {/* Tag management */}
                <div className="space-y-2">
                  <Label>Game Type Tags</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(allGameTypes).map(([abbreviation, name]) => {
                      const isChecked = player.tags.includes(abbreviation);
                      const canRemove = canRemoveTagFromPlayer(player.id, abbreviation);
                      
                      return (
                        <div key={abbreviation} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-${abbreviation}`}
                            checked={isChecked}
                            disabled={isChecked && !canRemove}
                            onCheckedChange={(checked) => handleTagChange(abbreviation, checked as boolean)}
                          />
                          <Label 
                            htmlFor={`edit-${abbreviation}`} 
                            className={`text-sm ${isChecked && !canRemove ? 'text-muted-foreground' : ''}`}
                          >
                            [{abbreviation}] {name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Delete player option in edit menu */}
                <div className="pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeletePlayerDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    Delete Player
                  </Button>
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
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedServes.map((serve) => (
                        <TableRow key={serve.id}>
                          <TableCell>
                            <div 
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-white ${serve.type === "ace" ? "ace-bg" : "error-bg"}`}
                            >
                              {serve.type === "fail" ? "Error" : "Ace"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <QualityIcon quality={serve.quality} type={serve.type} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(serve.timestamp), "dd.MM")}
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
