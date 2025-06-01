import React from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { format } from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Circle, Minus } from "lucide-react";
import { ServeQuality } from "../types";

interface GameServeHistoryDialogProps {
  gameId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GameServeHistoryDialog({ gameId, isOpen, onClose }: GameServeHistoryDialogProps) {
  const { players, gameDays, getAllGameTypes } = useVolleyball();
  
  if (!gameId) return null;
  
  const game = gameDays.find(g => g.id === gameId);
  if (!game) return null;
  
  const allGameTypes = getAllGameTypes();
  
  // Get all serves for this game from all players
  const gameServes = players.flatMap(player => 
    player.serves
      .filter(serve => serve.gameId === gameId)
      .map(serve => ({
        ...serve,
        playerName: player.name,
        playerId: player.id
      }))
  );
  
  // Sort serves by timestamp (newest first)
  const sortedServes = [...gameServes].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Helper to get quality color - updated to use button colors
  const getQualityColor = (type: "fail" | "ace") => {
    return type === "ace" ? "bg-primary" : "bg-destructive";
  };
  
  // Get quality icon based on quality and type
  const QualityIcon = ({ quality, type }: { quality: ServeQuality, type: "fail" | "ace" }) => {
    const isCircle = type === "ace"; // aces are circles
    
    let Icon = Circle;
    if (quality === "good") Icon = Plus;
    else if (quality === "bad") Icon = Minus;

    return (
      <div className="flex items-center justify-center w-8">
        <div 
          className={`relative flex items-center justify-center ${isCircle ? 'rounded-full h-8 w-8' : 'rounded-none transform rotate-45 h-7 w-7 scale-90'} ${getQualityColor(type)}`}
        >
          <Icon className={`h-3 w-3 absolute text-white ${!isCircle ? "transform -rotate-45" : ""}`} />
        </div>
      </div>
    );
  };
  
  // Calculate game stats
  const totalServes = sortedServes.length;
  const totalErrors = sortedServes.filter(s => s.type === "fail").length;
  const totalAces = sortedServes.filter(s => s.type === "ace").length;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">
              [{game.gameType}] {allGameTypes[game.gameType]}
            </Badge>
            <span>{game.title || format(new Date(game.date), "EEEE")}</span>
            <span className="text-sm text-muted-foreground">
              ({format(new Date(game.date), "dd.MM.yy")})
            </span>
          </DialogTitle>
          
          <div className="flex gap-4 text-sm pt-2">
            <span>Total Serves: <strong>{totalServes}</strong></span>
            <span>Errors: <strong>{totalErrors}</strong></span>
            <span>Aces: <strong>{totalAces}</strong></span>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {game.notes && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">{game.notes}</p>
            </div>
          )}
          
          <div className="space-y-2">
            {sortedServes.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedServes.map((serve) => (
                      <TableRow key={serve.id}>
                        <TableCell className="font-medium">
                          {serve.playerName}
                        </TableCell>
                        <TableCell>
                          <Badge variant={serve.type === "fail" ? "destructive" : "default"}>
                            {serve.type === "fail" ? "Error" : "Ace"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <QualityIcon quality={serve.quality} type={serve.type} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(serve.timestamp), "HH:mm:ss")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                No serve records found for this game.
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
