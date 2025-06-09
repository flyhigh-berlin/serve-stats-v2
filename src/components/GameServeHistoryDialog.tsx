
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
import { Plus, Circle, Minus, Crown } from "lucide-react";
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
  
  // Helper to get quality color - use global ace/error colors
  const getQualityColor = (type: "fail" | "ace") => {
    return type === "ace" ? "ace-bg" : "error-bg";
  };
  
  // Get quality icon based on quality and type
  const QualityIcon = ({ quality, type }: { quality: ServeQuality, type: "fail" | "ace" }) => {
    const isCircle = type === "ace"; // aces are circles
    
    // Define the icon based on quality
    let Icon = Circle;
    let iconStyle = { strokeWidth: 4, fill: quality === "neutral" ? 'white' : 'none' };
    let iconSize = "h-3 w-3";
    
    if (quality === "good") {
      Icon = Plus;
      iconStyle = { strokeWidth: 4, fill: 'none' };
      iconSize = "h-3 w-3";
    } else if (quality === "bad") {
      Icon = Minus;
      iconStyle = { strokeWidth: 4, fill: 'none' };
      iconSize = "h-3 w-3";
    } else {
      // neutral - filled circle/dot
      iconSize = "h-1.5 w-1.5";
      iconStyle = { strokeWidth: 0, fill: 'white' };
    }

    return (
      <div className="flex items-center justify-center w-8">
        <div 
          className={`relative flex items-center justify-center ${isCircle ? 'rounded-full h-8 w-8' : 'rounded-none transform rotate-45 h-7 w-7 scale-90'} ${getQualityColor(type)}`}
        >
          <Icon 
            className={`${iconSize} absolute text-white ${!isCircle ? "transform -rotate-45" : ""}`} 
            style={iconStyle}
          />
        </div>
      </div>
    );
  };
  
  // Calculate game stats for all players
  const calculateGameStats = () => {
    const playerStats = players.map(player => {
      const playerServes = player.serves.filter(serve => serve.gameId === gameId);
      const aces = playerServes.filter(serve => serve.type === "ace").length;
      const errors = playerServes.filter(serve => serve.type === "fail").length;
      const totalServes = aces + errors;
      
      // Calculate quality score
      const qualityScore = playerServes.reduce((score, serve) => {
        if (serve.quality === "good") return score + 1;
        if (serve.quality === "bad") return score - 1;
        return score; // neutral = 0
      }, 0);
      
      // Calculate A/E ratio
      const aeRatio = errors === 0 ? (aces > 0 ? aces : 0) : aces / errors;
      
      return {
        playerId: player.id,
        playerName: player.name,
        aces,
        errors,
        totalServes,
        aeRatio,
        qualityScore
      };
    }).filter(stat => stat.totalServes > 0); // Only show players with serves
    
    // Sort by quality score (descending), then by A/E ratio (descending)
    playerStats.sort((a, b) => {
      if (b.qualityScore !== a.qualityScore) {
        return b.qualityScore - a.qualityScore;
      }
      return b.aeRatio - a.aeRatio;
    });
    
    const totalServes = playerStats.reduce((sum, stat) => sum + stat.totalServes, 0);
    const totalErrors = playerStats.reduce((sum, stat) => sum + stat.errors, 0);
    const totalAces = playerStats.reduce((sum, stat) => sum + stat.aces, 0);
    const avgAeRatio = totalErrors === 0 ? (totalAces > 0 ? totalAces : 0) : totalAces / totalErrors;
    const avgQualityScore = totalServes > 0 ? gameServes.reduce((score, serve) => {
      if (serve.quality === "good") return score + 1;
      if (serve.quality === "bad") return score - 1;
      return score;
    }, 0) / totalServes : 0;
    
    return {
      playerStats,
      totalServes,
      totalErrors,
      totalAces,
      avgAeRatio,
      avgQualityScore
    };
  };
  
  const gameStats = calculateGameStats();
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
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
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {game.notes && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">{game.notes}</p>
            </div>
          )}
          
          {/* Game Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">Total Serves</div>
              <div className="text-xl font-bold">{gameStats.totalServes}</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">Total Aces</div>
              <div className="text-xl font-bold text-primary">{gameStats.totalAces}</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">Total Errors</div>
              <div className="text-xl font-bold text-destructive">{gameStats.totalErrors}</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">Avg A/E</div>
              <div className="text-xl font-bold">{gameStats.avgAeRatio.toFixed(2)}</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">Avg QS</div>
              <div className="text-xl font-bold">{gameStats.avgQualityScore.toFixed(2)}</div>
            </div>
          </div>
          
          {/* Player Rankings */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Player Performance</h3>
            {gameStats.playerStats.length > 0 ? (
              <div className="space-y-2">
                {gameStats.playerStats.map((stat, index) => (
                  <div key={stat.playerId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <span className="font-medium flex items-center gap-2">
                        {stat.playerName}
                        {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>A: <strong className="text-primary">{stat.aces}</strong></span>
                      <span>E: <strong className="text-destructive">{stat.errors}</strong></span>
                      <span>A/E: <strong>{stat.aeRatio.toFixed(2)}</strong></span>
                      <span>QS: <strong>{stat.qualityScore > 0 ? '+' : ''}{stat.qualityScore}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No player performance data available.
              </div>
            )}
          </div>
          
          {/* Serve History */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Serve History</h3>
            {sortedServes.length > 0 ? (
              <div className="border rounded-md">
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
