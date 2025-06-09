
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
  const { players, gameDays, getAllGameTypes, getPlayerStats } = useVolleyball();
  
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
    return type === "ace" ? "bg-sky-600" : "bg-destructive";
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
  
  // Calculate game stats
  const totalServes = sortedServes.length;
  const totalErrors = sortedServes.filter(s => s.type === "fail").length;
  const totalAces = sortedServes.filter(s => s.type === "ace").length;
  
  // Get players who participated in this game
  const gamePlayerIds = [...new Set(gameServes.map(serve => serve.playerId))];
  const gamePlayers = players.filter(p => gamePlayerIds.includes(p.id));
  
  // Calculate stats for each player in this game and rank them
  const playerStatsWithRanking = gamePlayers.map(player => {
    const stats = getPlayerStats(player.id, gameId);
    
    // Calculate A/E Ratio
    const aeRatio = stats.errors === 0 ? stats.aces : stats.aces / stats.errors;
    
    // Calculate Quality Score
    const playerServes = players.find(p => p.id === player.id)?.serves.filter(s => s.gameId === gameId) || [];
    const totalPlayerServes = playerServes.length;
    
    let qualityScore = 0;
    if (totalPlayerServes > 0) {
      const score = playerServes.reduce((sum, serve) => {
        const qualityValue = serve.quality === "good" ? 1 : serve.quality === "neutral" ? 0 : -1;
        return sum + qualityValue;
      }, 0);
      qualityScore = score / totalPlayerServes;
    }
    
    return {
      ...player,
      stats,
      aeRatio,
      qualityScore
    };
  });
  
  // Sort players by A/E ratio (descending), then by Quality Score (descending)
  const sortedPlayers = [...playerStatsWithRanking].sort((a, b) => {
    if (b.aeRatio !== a.aeRatio) return b.aeRatio - a.aeRatio;
    return b.qualityScore - a.qualityScore;
  });
  
  // Calculate averages
  const avgAERatio = playerStatsWithRanking.length > 0 
    ? playerStatsWithRanking.reduce((sum, p) => sum + p.aeRatio, 0) / playerStatsWithRanking.length
    : 0;
  
  const avgQualityScore = playerStatsWithRanking.length > 0
    ? playerStatsWithRanking.reduce((sum, p) => sum + p.qualityScore, 0) / playerStatsWithRanking.length
    : 0;
  
  // Color helpers for stats
  const getAERatioColor = (ratio: number) => {
    if (ratio === 0) return "text-muted-foreground";
    if (ratio > 1) return "text-sky-600";
    if (ratio < 1) return "text-destructive";
    return "text-muted-foreground";
  };
  
  const getQualityScoreColor = (score: number) => {
    if (score === 0) return "text-muted-foreground";
    if (score > 0) return "text-sky-600";
    if (score < 0) return "text-destructive";
    return "text-muted-foreground";
  };
  
  const formatValue = (value: number, showSign: boolean = false) => {
    if (value === 0) return "0";
    if (showSign && value > 0) return `+${value.toFixed(1)}`;
    return value.toFixed(showSign ? 1 : 2);
  };
  
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
          
          {/* Game Stats Overview */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Total Serves</div>
                <div className="text-lg font-bold">{totalServes}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Total Aces</div>
                <div className="text-lg font-bold text-sky-600">{totalAces}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Total Errors</div>
                <div className="text-lg font-bold text-destructive">{totalErrors}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Avg A/E Ratio</div>
                <div className={`text-lg font-bold ${getAERatioColor(avgAERatio)}`}>
                  {formatValue(avgAERatio)}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Avg QS</div>
                <div className={`text-lg font-bold ${getQualityScoreColor(avgQualityScore)}`}>
                  {formatValue(avgQualityScore, true)}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {game.notes && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">{game.notes}</p>
            </div>
          )}
          
          {/* Player Rankings */}
          {sortedPlayers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Player Rankings</h4>
              <div className="space-y-1">
                {sortedPlayers.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded border bg-muted/20">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="font-medium">{player.name}</span>
                      <span className="text-sm text-muted-foreground">
                        A:{player.stats.aces} E:{player.stats.errors}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={getAERatioColor(player.aeRatio)}>
                        {formatValue(player.aeRatio)}
                      </span>
                      <span className={getQualityScoreColor(player.qualityScore)}>
                        {formatValue(player.qualityScore, true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Serve History */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Serve History</h4>
            {sortedServes.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto border rounded-md">
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
