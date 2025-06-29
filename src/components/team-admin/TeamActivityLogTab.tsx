
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, User, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface TeamActivityLogTabProps {
  teamId: string;
}

interface ActivityLogEntry {
  id: string;
  action: string;
  details: any;
  performed_by: string;
  created_at: string;
  user_profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

export function TeamActivityLogTab({ teamId }: TeamActivityLogTabProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['team-activity', teamId],
    queryFn: async () => {
      // Get activity data
      const { data: activityData, error } = await supabase
        .from('team_activity_audit')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Get user profiles for activities
      const userIds = activityData?.map(a => a.performed_by).filter(Boolean) || [];
      if (userIds.length === 0) return activityData || [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Combine activity data with user profiles
      const activitiesWithProfiles: ActivityLogEntry[] = activityData?.map(activity => ({
        ...activity,
        user_profiles: profiles?.find(p => p.user_id === activity.performed_by) || null
      })) || [];
      
      return activitiesWithProfiles;
    }
  });

  const getActionIcon = (action: string) => {
    if (action.includes('member')) return <User className="h-4 w-4" />;
    if (action.includes('settings')) return <Activity className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('remove') || action.includes('delete')) return 'destructive';
    if (action.includes('create') || action.includes('add')) return 'default';
    if (action.includes('update') || action.includes('change')) return 'secondary';
    return 'outline';
  };

  const formatActionText = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDetails = (details: any) => {
    if (!details) return null;
    
    if (typeof details === 'object') {
      if (details.count) {
        return `Affected ${details.count} items`;
      }
      if (details.old_values && details.new_values) {
        const changes = [];
        if (details.old_values.name !== details.new_values.name) {
          changes.push(`Name: "${details.old_values.name}" → "${details.new_values.name}"`);
        }
        if (details.old_values.description !== details.new_values.description) {
          changes.push(`Description updated`);
        }
        return changes.join(', ');
      }
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Activity Log</h3>
        <p className="text-sm text-muted-foreground">
          Track all team-related actions and changes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities?.map(activity => (
              <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getActionColor(activity.action) as any}>
                      {formatActionText(activity.action)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(activity.created_at)}
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    Performed by: {activity.user_profiles?.full_name || activity.user_profiles?.email || 'System'}
                  </p>
                  {formatDetails(activity.details) && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDetails(activity.details)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {(!activities || activities.length === 0) && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No activities recorded yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Team actions will appear here as they happen
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
