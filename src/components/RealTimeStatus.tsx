
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Clock } from "lucide-react";

export function RealTimeStatus() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);

  useEffect(() => {
    // Monitor connection status
    const channel = supabase.channel('connection-status');
    
    channel
      .on('system', {}, (payload) => {
        console.log('Real-time system event:', payload);
        if (payload.status === 'joined') {
          setConnectionStatus('connected');
        }
      })
      .subscribe();

    // Track global real-time events
    const eventChannel = supabase
      .channel('global-events')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Global real-time event detected:', payload);
        setLastEventTime(new Date());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(eventChannel);
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'default';
      case 'disconnected': return 'destructive';
      case 'connecting': return 'secondary';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-3 w-3" />;
      case 'disconnected': return <WifiOff className="h-3 w-3" />;
      case 'connecting': return <Clock className="h-3 w-3 animate-spin" />;
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {getStatusIcon()}
        Real-time {connectionStatus}
      </Badge>
      {lastEventTime && (
        <span className="text-muted-foreground">
          Last sync: {lastEventTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
