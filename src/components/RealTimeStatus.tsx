
import React from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Clock, CheckCircle } from "lucide-react";

export function RealTimeStatus() {
  const { 
    realtimeConnectionStatus, 
    lastRealTimeEvent
  } = useSupabaseVolleyball();

  const getStatusColor = () => {
    switch (realtimeConnectionStatus) {
      case 'connected': return 'default';
      case 'disconnected': return 'destructive';
      case 'connecting': return 'secondary';
    }
  };

  const getStatusIcon = () => {
    switch (realtimeConnectionStatus) {
      case 'connected': return <Wifi className="h-3 w-3" />;
      case 'disconnected': return <WifiOff className="h-3 w-3" />;
      case 'connecting': return <Clock className="h-3 w-3 animate-spin" />;
    }
  };

  // Show recent event indicator
  const showRecentEventIndicator = lastRealTimeEvent && 
    (Date.now() - new Date(lastRealTimeEvent.timestamp).getTime()) < 5000; // Show for 5 seconds

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {getStatusIcon()}
        Real-time {realtimeConnectionStatus}
      </Badge>
      
      {/* Recent activity indicator */}
      {showRecentEventIndicator && realtimeConnectionStatus === 'connected' && (
        <Badge variant="secondary" className="flex items-center gap-1 animate-pulse">
          <CheckCircle className="h-3 w-3" />
          <span>Data updated</span>
        </Badge>
      )}
      
      {/* Connection status message */}
      {realtimeConnectionStatus === 'connected' && (
        <span className="text-green-600 text-xs">
          Auto-sync active
        </span>
      )}
      
      {realtimeConnectionStatus === 'disconnected' && (
        <span className="text-red-600 text-xs">
          Manual refresh required
        </span>
      )}
      
      {realtimeConnectionStatus === 'connecting' && (
        <span className="text-yellow-600 text-xs">
          Establishing connection...
        </span>
      )}
    </div>
  );
}
