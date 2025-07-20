import React from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Clock, Activity, RefreshCw } from "lucide-react";

export function RealTimeDebugger() {
  const {
    realtimeConnectionStatus,
    lastRealTimeEvent,
    refreshData,
    currentGameDay,
    players,
    gameDays,
    serves
  } = useSupabaseVolleyball();

  const getStatusIcon = () => {
    switch (realtimeConnectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'connecting': return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (realtimeConnectionStatus) {
      case 'connected': return 'default';
      case 'disconnected': return 'destructive';
      case 'connecting': return 'secondary';
    }
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-Time Connection Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Connection Status</span>
          </div>
          <Badge variant={getStatusColor()}>
            {realtimeConnectionStatus.toUpperCase()}
          </Badge>
        </div>

        {/* Connection Health */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Last Event</div>
            <div className="font-mono">
              {lastRealTimeEvent ? new Date(lastRealTimeEvent.timestamp).toLocaleTimeString() : 'None'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Connection</div>
            <div className="font-mono">{realtimeConnectionStatus}</div>
          </div>
        </div>

        {/* Last Real-Time Event */}
        {lastRealTimeEvent && (
          <div className="rounded-lg bg-muted p-3">
            <div className="text-sm font-medium mb-2">Latest Real-Time Event</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Type:</span> {lastRealTimeEvent.type}
              </div>
              <div>
                <span className="text-muted-foreground">Table:</span> {lastRealTimeEvent.table}
              </div>
              <div>
                <span className="text-muted-foreground">Entity:</span> {lastRealTimeEvent.entityName}
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span> {new Date(lastRealTimeEvent.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Data Counts */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold">{players.length}</div>
            <div className="text-muted-foreground">Players</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{gameDays.length}</div>
            <div className="text-muted-foreground">Game Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{serves.length}</div>
            <div className="text-muted-foreground">Serves</div>
          </div>
        </div>

        {/* Current Filter */}
        {currentGameDay && (
          <div className="text-sm">
            <span className="text-muted-foreground">Active Game:</span>{" "}
            <span className="font-medium">
              {currentGameDay.title || currentGameDay.date}
            </span>
          </div>
        )}

        {/* Emergency Refresh */}
        {realtimeConnectionStatus === 'disconnected' && (
          <Button 
            onClick={refreshData} 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Emergency Refresh
          </Button>
        )}

        {/* WebSocket Test Instructions */}
        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
          <strong>Test Instructions:</strong>
          <br />
          1. Open another browser tab to this same page
          <br />
          2. Add/remove a player in one tab
          <br />
          3. Verify it appears instantly in both tabs
          <br />
          4. Check console logs for WebSocket events
        </div>
      </CardContent>
    </Card>
  );
}