
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Clock, AlertCircle } from "lucide-react";
import { useSupabaseVolleyball } from "../hooks/useSupabaseVolleyball";

export function RealTimeStatus() {
  const { 
    realtimeConnectionStatus, 
    lastRealTimeEvent,
    lastUpdateTimestamp 
  } = useSupabaseVolleyball();
  
  const [globalEventCount, setGlobalEventCount] = useState(0);
  const [lastGlobalEventTime, setLastGlobalEventTime] = useState<Date | null>(null);

  useEffect(() => {
    // Track global real-time events for debugging
    const eventChannel = supabase
      .channel('global-events-monitor')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('🌐 Global real-time event detected:', payload);
        setGlobalEventCount(prev => prev + 1);
        setLastGlobalEventTime(new Date());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
    };
  }, []);

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

  const isRealtimeHealthy = () => {
    if (realtimeConnectionStatus !== 'connected') return false;
    if (!lastRealTimeEvent) return true; // No events yet is fine
    
    // Check if last event was recent (within 30 seconds for active operations)
    const eventAge = Date.now() - new Date(lastRealTimeEvent.timestamp).getTime();
    return eventAge < 30000; // 30 seconds
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {getStatusIcon()}
        Real-time {realtimeConnectionStatus}
      </Badge>
      
      {/* Health indicator */}
      {realtimeConnectionStatus === 'connected' && !isRealtimeHealthy() && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Sync Warning
        </Badge>
      )}
      
      {/* Last event info */}
      {lastRealTimeEvent && (
        <span className="text-muted-foreground">
          Last {lastRealTimeEvent.table} event: {new Date(lastRealTimeEvent.timestamp).toLocaleTimeString()}
        </span>
      )}
      
      {/* Global event counter for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <span className="text-muted-foreground">
          Events: {globalEventCount} | Update: {lastUpdateTimestamp}
        </span>
      )}
      
      {/* Connection health indicator */}
      {lastGlobalEventTime && (
        <span className="text-muted-foreground">
          Global sync: {lastGlobalEventTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
