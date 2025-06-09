
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
import { ScrollArea } from "@/components/ui/scroll-area";
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

  // Quality overview icon for stats
  const QualityOverviewIcon = ({ quality, type, count }: { quality: ServeQuality, type: "fail" | "ace", count: number }) => {
    if (count === 0) return null;
    const isCircle = type === "ace";

    let Icon = Circle;
    let iconStyle = { strokeWidth: 4, fill: quality === "neutral" ? 'white' : 'none' };
    let iconSize = "h-2.5 w-2.5";
    
    if (quality === "good") {
      Icon = Plus;
      iconStyle = { strokeWidth: 4, fill: 'none' };
      iconSize = "h-2.5 w-2.5";
    } else if (quality === "bad") {
      Icon = Minus;
      iconStyle = { strokeWidth: 4, fill: 'none' };
      iconSize = "h-2.5 w-2.5";
    } else {
      iconSize = "h-1.5 w-1.5";
      iconStyle = { strokeWidth: 0, fill: 'white' };
    }

    return (
      <div className="flex items-center gap-1">
        <div className={`flex items-center justify-center ${isCircle ? 'w-6 h-6 rounded-full' : 'w-5 h-5 transform rotate-45'} ${getQualityColor(type)}`}>
          <Icon className={`${iconSize} text-white ${!isCircle ? "transform -rotate-45" : ""}`} style={iconStyle} />
        </div>
        <span className="text-sm font-medium">{count}</span>
      </div>
    );
  };
  
  // Calculate game stats
  const totalErrors = sortedServes.filter(s => s.type === "fail").length;
  const totalAces = sortedServes.filter(s => s.type === "ace").length;
  
  // Get players who participated in this game
  const gamePlayerIds = [...new Set(gameServes.map(serve => serve.playerId))];
  const gamePlayers = players.filter(p => gamePlayerIds.includes(p.id));
  
  // Calculate stats for each player in this game
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
  
  // Find top players for each stat
  const topPlayerAces = [...playerStatsWithRanking].sort((a, b) => b.stats.aces - a.stats.aces)[0];
  const topPlayerErrors = [...playerStatsWithRanking].sort((a, b) => b.stats.errors - a.stats.errors)[0];
  const topPlayerAERatio = [...playerStatsWithRanking].sort((a, b) => b.aeRatio - a.aeRatio)[0];
  const topPlayerQS = [...playerStatsWithRanking].sort((a, b) => b.qualityScore - a.qualityScore)[0];
  
  // Calculate averages
  const avgAERatio = playerStatsWithRanking.length > 0 
    ? playerStatsWithRanking.reduce((sum, p) => sum + p.aeRatio, 0) / playerStatsWithRanking.length
    : 0;
  
  const avgQualityScore = playerStatsWithRanking.length > 0
    ? playerStatsWithRanking.reduce((sum, p) => sum + p.qualityScore, 0) / playerStatsWithRanking.length
    : 0;

  // Calculate quality breakdown for all serves
  const qualityBreakdown = {
    good: { aces: 0, errors: 0 },
    neutral: { aces: 0, errors: 0 },
    bad: { aces: 0, errors: 0 }
  };

  sortedServes.forEach(serve => {
    if (serve.type === "ace") {
      qualityBreakdown[serve.quality].aces++;
    } else {
      qualityBreakdown[serve.quality].errors++;
    }
  });
  
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
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">
              [{game.gameType}] {allGameTypes[game.gameType]}
            </Badge>
            <span>{game.title || format(new Date(game.date), "EEEE")}</span>
            <span className="text-sm text-muted-foreground">
              ({format(new Date(game.date), "dd.MM.yy")})
            </span>
          </DialogTitle>
          
          {/* Game Stats Overview - Single Line */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Aces</div>
                <div className="text-lg font-bold ace-text">{totalAces}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Errors</div>
                <div className="text-lg font-bold error-text">{totalErrors}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">A/E</div>
                <div className={`text-lg font-bold ${getAERatioColor(avgAERatio)}`}>
                  {formatValue(avgAERatio)}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">QS</div>
                <div className={`text-lg font-bold ${getQualityScoreColor(avgQualityScore)}`}>
                  {formatValue(avgQualityScore, true)}
                </div>
              </div>
            </div>
            
            {/* Quality Breakdown */}
            <div className="flex flex-wrap gap-3 items-center justify-center p-3 bg-muted/30 rounded-md">
              <QualityOverviewIcon quality="good" type="ace" count={qualityBreakdown.good.aces} />
              <QualityOverviewIcon quality="neutral" type="ace" count={qualityBreakdown.neutral.aces} />
              <QualityOverviewIcon quality="bad" type="ace" count={qualityBreakdown.bad.aces} />
              <QualityOverviewIcon quality="good" type="fail" count={qualityBreakdown.good.errors} />
              <QualityOverviewIcon quality="neutral" type="fail" count={qualityBreakdown.neutral.errors} />
              <QualityOverviewIcon quality="bad" type="fail" count={qualityBreakdown.bad.errors} />
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 py-4 pr-4">
            {game.notes && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{game.notes}</p>
              </div>
            )}
            
            {/* Player Rankings - Top player for each stat */}
            {gamePlayers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Top Performers</h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="font-medium text-muted-foreground">
                    <Crown className="h-3 w-3 mx-auto mb-1 text-yellow-500" />
                    Aces
                  </div>
                  <div className="font-medium text-muted-foreground">
                    <Crown className="h-3 w-3 mx-auto mb-1 text-yellow-500" />
                    Errors
                  </div>
                  <div className="font-medium text-muted-foreground">
                    <Crown className="h-3 w-3 mx-auto mb-1 text-yellow-500" />
                    A/E
                  </div>
                  <div className="font-medium text-muted-foreground">
                    <Crown className="h-3 w-3 mx-auto mb-1 text-yellow-500" />
                    QS
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs p-2 rounded border bg-muted/20">
                  <div className="truncate">
                    <div className="font-medium truncate">{topPlayerAces?.name || "-"}</div>
                    <div className="ace-text font-bold">{topPlayerAces?.stats.aces || 0}</div>
                  </div>
                  <div className="truncate">
                    <div className="font-medium truncate">{topPlayerErrors?.name || "-"}</div>
                    <div className="error-text font-bold">{topPlayerErrors?.stats.errors || 0}</div>
                  </div>
                  <div className="truncate">
                    <div className="font-medium truncate">{topPlayerAERatio?.name || "-"}</div>
                    <div className={`font-bold ${getAERatioColor(topPlayerAERatio?.aeRatio || 0)}`}>
                      {formatValue(topPlayerAERatio?.aeRatio || 0)}
                    </div>
                  </div>
                  <div className="truncate">
                    <div className="font-medium truncate">{topPlayerQS?.name || "-"}</div>
                    <div className={`font-bold ${getQualityScoreColor(topPlayerQS?.qualityScore || 0)}`}>
                      {formatValue(topPlayerQS?.qualityScore || 0, true)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Serve History */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Serve History</h4>
              {sortedServes.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Player</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Quality</TableHead>
                        <TableHead className="text-xs">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedServes.map((serve) => (
                        <TableRow key={serve.id}>
                          <TableCell className="font-medium text-xs">
                            {serve.playerName}
                          </TableCell>
                          <TableCell>
                            <Badge variant={serve.type === "fail" ? "destructive" : "default"} className="text-xs">
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
        </ScrollArea>
        
        <div className="flex justify-end flex-shrink-0 pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
