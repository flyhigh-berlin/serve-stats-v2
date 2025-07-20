
import React from "react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Clock, AlertCircle } from "lucide-react";

export function RealTimeConnectionMonitor() {
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

  const isHealthy = () => {
    if (realtimeConnectionStatus !== 'connected') return false;
    if (!lastRealTimeEvent) return true; // No events yet is fine
    
    // Check if last event was recent (within 2 minutes for normal usage)
    const eventAge = Date.now() - new Date(lastRealTimeEvent.timestamp).getTime();
    return eventAge < 120000; // 2 minutes
  };

  const getConnectionMessage = () => {
    switch (realtimeConnectionStatus) {
      case 'connected': 
        return 'Real-time updates active';
      case 'disconnected': 
        return 'Real-time updates unavailable';
      case 'connecting': 
        return 'Establishing real-time connection...';
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 text-xs">
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {getStatusIcon()}
        <span className="capitalize">{realtimeConnectionStatus}</span>
      </Badge>
      
      {/* Health warning for disconnected state */}
      {realtimeConnectionStatus === 'disconnected' && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>Auto-sync disabled</span>
        </Badge>
      )}
      
      {/* Last event info - only show if recent */}
      {lastRealTimeEvent && realtimeConnectionStatus === 'connected' && (
        <span className="text-muted-foreground">
          Last update: {new Date(lastRealTimeEvent.timestamp).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
