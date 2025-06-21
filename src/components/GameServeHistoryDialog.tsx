
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
      iconSize = "h-1 w-1";
      iconStyle = { strokeWidth: 0, fill: 'white' };
    }

    return (
      <div className="flex items-center justify-center w-8">
        <div 
          className={`relative flex items-center justify-center ${isCircle ? 'rounded-full h-8 w-8' : 'rounded-none transform rotate-45 h-7 w-7 scale-90 -translate-y-px'} ${getQualityColor(type)}`}
        >
          <Icon 
            className={`${iconSize} absolute text-white ${!isCircle ? "transform -rotate-45" : ""}`} 
            style={iconStyle}
          />
        </div>
      </div>
    );
  };

  // Compact quality overview icon with bottom-aligned numbers for consistent positioning
  const CompactQualityIcon = ({ quality, type, count }: { quality: ServeQuality, type: "fail" | "ace", count: number }) => {
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
      iconSize = "h-1 w-1";
      iconStyle = { strokeWidth: 0, fill: 'white' };
    }

    return (
      <div className="flex flex-col items-center justify-end w-8 h-12">
        <div className={`flex items-center justify-center ${isCircle ? 'w-4 h-4 rounded-full' : 'w-3.5 h-3.5 transform rotate-45 -translate-y-px'} ${getQualityColor(type)} mb-1`}>
          <Icon className={`${iconSize} text-white ${!isCircle ? "transform -rotate-45" : ""}`} style={iconStyle} />
        </div>
        <span className="text-xs font-medium text-center leading-none">{count}</span>
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
    if (value === 0) return "0.00";
    if (showSign && value > 0) return `+${value.toFixed(2)}`;
    return value.toFixed(2);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{game.title || format(new Date(game.date), "EEEE")}</span>
            <span className="text-sm text-muted-foreground">
              ({format(new Date(game.date), "dd.MM.yy")})
            </span>
            <Badge variant="outline">
              [{game.gameType}] {allGameTypes[game.gameType]}
            </Badge>
          </DialogTitle>
          
          {/* Game Stats Overview - Fixed Layout with Consistent Heights */}
          <div className="space-y-4 pt-2">
            {/* Row 1: Aces/Errors with standardized layout and consistent heights */}
            <div className="flex justify-center px-4">
              <div className="w-full max-w-md">
                <div className="grid grid-cols-2 gap-6 sm:gap-4">
                  {/* Aces Column - Standardized container with fixed height */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-end gap-2 sm:gap-3 h-12">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xs font-medium text-muted-foreground">Aces</div>
                        <div className="bg-slate-200 dark:bg-slate-800 rounded-full px-3 py-2 w-16 sm:w-20 flex items-center justify-center flex-shrink-0 h-10">
                          <span className="text-base sm:text-lg font-bold ace-text">{totalAces}</span>
                        </div>
                      </div>
                      <div className="flex items-end gap-1 overflow-hidden h-12">
                        <CompactQualityIcon quality="good" type="ace" count={qualityBreakdown.good.aces} />
                        <CompactQualityIcon quality="neutral" type="ace" count={qualityBreakdown.neutral.aces} />
                        <CompactQualityIcon quality="bad" type="ace" count={qualityBreakdown.bad.aces} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Errors Column - Standardized container with identical height */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-end gap-2 sm:gap-3 h-12">
                      <div className="flex items-end gap-1 overflow-hidden h-12">
                        <CompactQualityIcon quality="good" type="fail" count={qualityBreakdown.good.errors} />
                        <CompactQualityIcon quality="neutral" type="fail" count={qualityBreakdown.neutral.errors} />
                        <CompactQualityIcon quality="bad" type="fail" count={qualityBreakdown.bad.errors} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xs font-medium text-muted-foreground">Errors</div>
                        <div className="bg-slate-200 dark:bg-slate-800 rounded-full px-3 py-2 w-16 sm:w-20 flex items-center justify-center flex-shrink-0 h-10">
                          <span className="text-base sm:text-lg font-bold error-text">{totalErrors}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Row 2: A/E and QS stats with matching pill sizes */}
            <div className="grid grid-cols-2 gap-4 px-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="font-medium text-muted-foreground mb-2 text-xs">A/E Ratio</div>
                <div className="bg-slate-200 dark:bg-slate-800 rounded-full px-4 py-2 w-20 mx-auto flex items-center justify-center">
                  <span className={`text-lg font-bold ${getAERatioColor(avgAERatio)}`}>
                    {formatValue(avgAERatio)}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground mb-2 text-xs">Quality Score</div>
                <div className="bg-slate-200 dark:bg-slate-800 rounded-full px-4 py-2 w-20 mx-auto flex items-center justify-center">
                  <span className={`text-lg font-bold ${getQualityScoreColor(avgQualityScore)}`}>
                    {formatValue(avgQualityScore, true)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-6 py-4 px-4">
            {game.notes && (
              <div className="p-3 bg-muted rounded-md max-w-md mx-auto">
                <p className="text-sm">{game.notes}</p>
              </div>
            )}
            
            {/* Player Rankings - Top player for each stat */}
            {gamePlayers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <h4 className="text-sm font-medium">Top Performers</h4>
                  <Crown className="h-3 w-3 text-yellow-500" />
                </div>
                <div className="flex justify-center">
                  <div className="w-full max-w-md border rounded-md overflow-hidden">
                    {/* Headers */}
                    <div className="grid grid-cols-4 bg-muted/50 px-4 py-3">
                      <div className="text-xs font-medium text-muted-foreground text-left">Aces</div>
                      <div className="text-xs font-medium text-muted-foreground text-left">Errors</div>
                      <div className="text-xs font-medium text-muted-foreground text-left">A/E</div>
                      <div className="text-xs font-medium text-muted-foreground text-left">QS</div>
                    </div>
                    {/* Content */}
                    <div className="grid grid-cols-4 px-4 py-3">
                      <div className="text-left">
                        <div className="font-medium text-sm truncate pr-2">{topPlayerAces?.name || "-"}</div>
                        <div className="ace-text font-bold text-sm">{topPlayerAces?.stats.aces || 0}</div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm truncate pr-2">{topPlayerErrors?.name || "-"}</div>
                        <div className="error-text font-bold text-sm">{topPlayerErrors?.stats.errors || 0}</div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm truncate pr-2">{topPlayerAERatio?.name || "-"}</div>
                        <div className={`font-bold text-sm ${getAERatioColor(topPlayerAERatio?.aeRatio || 0)}`}>
                          {formatValue(topPlayerAERatio?.aeRatio || 0)}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm truncate pr-2">{topPlayerQS?.name || "-"}</div>
                        <div className={`font-bold text-sm ${getQualityScoreColor(topPlayerQS?.qualityScore || 0)}`}>
                          {formatValue(topPlayerQS?.qualityScore || 0, true)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Serve History */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-center">Serve History</h4>
              {sortedServes.length > 0 ? (
                <div className="flex justify-center">
                  <div className="border rounded-md max-h-[300px] overflow-y-auto w-full max-w-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs text-left px-4 py-3">Player</TableHead>
                          <TableHead className="text-xs text-left px-4 py-3">Type</TableHead>
                          <TableHead className="text-xs text-left px-4 py-3">Quality</TableHead>
                          <TableHead className="text-xs text-left px-4 py-3">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedServes.map((serve, index) => (
                          <TableRow key={serve.id} className={`${index % 2 === 0 ? "bg-background" : "bg-muted/30"} border-b border-muted/30`}>
                            <TableCell className="font-medium text-xs px-4 py-3">
                              <div className="truncate pr-2">{serve.playerName}</div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div 
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-white ${serve.type === "ace" ? "ace-bg" : "error-bg"}`}
                              >
                                {serve.type === "fail" ? "Error" : "Ace"}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <QualityIcon quality={serve.quality} type={serve.type} />
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground px-4 py-3">
                              {format(new Date(serve.timestamp), "HH:mm")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="text-center py-8 text-muted-foreground border rounded-md w-full max-w-md">
                    No serve records found for this game.
                  </div>
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
