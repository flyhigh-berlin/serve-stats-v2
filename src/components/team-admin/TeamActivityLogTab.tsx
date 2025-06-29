
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Search, Download, Filter } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";
import { toast } from "sonner";

interface TeamActivityLogTabProps {
  teamId: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
  team_id: string;
  performed_by: string | null;
  user_profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const actionLabels: Record<string, string> = {
  'team_settings_updated': 'Settings Updated',
  'bulk_member_removal': 'Bulk Member Removal',
  'bulk_role_change': 'Bulk Role Change',
  'member_added': 'Member Added',
  'member_removed': 'Member Removed',
  'role_changed': 'Role Changed',
  'invitation_created': 'Invitation Created',
  'invitation_accepted': 'Invitation Accepted',
  'game_created': 'Game Created',
  'player_added': 'Player Added',
  'data_reset': 'Data Reset'
};

const actionColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  'team_settings_updated': 'default',
  'bulk_member_removal': 'destructive',
  'bulk_role_change': 'secondary',
  'member_added': 'default',
  'member_removed': 'destructive',
  'role_changed': 'secondary',
  'invitation_created': 'outline',
  'invitation_accepted': 'default',
  'game_created': 'default',
  'player_added': 'default',
  'data_reset': 'destructive'
};

export function TeamActivityLogTab({ teamId }: TeamActivityLogTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  const { data: activities, isLoading } = useQuery({
    queryKey: ['team-activity', teamId, dateRange],
    queryFn: async () => {
      // First get activity logs
      let query = supabase
        .from('team_activity_audit')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });
      
      // Apply date filter
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data: activityData, error } = await query.limit(100);
      if (error) throw error;
      
      // Get user profiles for performed_by users
      const userIds = activityData?.map(a => a.performed_by).filter(Boolean) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Combine data
      const activitiesWithProfiles: ActivityLog[] = activityData?.map(activity => ({
        ...activity,
        user_profiles: profiles?.find(p => p.user_id === activity.performed_by) || null
      })) || [];
      
      return activitiesWithProfiles;
    }
  });

  const filteredActivities = activities?.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || activity.action === actionFilter;
    
    return matchesSearch && matchesAction;
  }) || [];

  const exportActivities = () => {
    if (!filteredActivities.length) {
      toast.error('No activities to export');
      return;
    }

    const csvContent = [
      'Date,Action,Performed By,Details',
      ...filteredActivities.map(activity => [
        formatDate(activity.created_at),
        actionLabels[activity.action] || activity.action,
        activity.user_profiles?.full_name || activity.user_profiles?.email || 'System',
        JSON.stringify(activity.details || {})
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Activity log exported successfully');
  };

  const uniqueActions = Array.from(new Set(activities?.map(a => a.action) || []));

  if (isLoading) {
    return <div className="text-center py-8">Loading activity log...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Activity Log</h3>
          <p className="text-sm text-muted-foreground">
            Complete audit trail of team activities
          </p>
        </div>
        <Button onClick={exportActivities} size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map(action => (
              <SelectItem key={action} value={action}>
                {actionLabels[action] || action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activities ({filteredActivities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={actionColors[activity.action] || 'default'}>
                      {actionLabels[activity.action] || activity.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(activity.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm">
                    Performed by {activity.user_profiles?.full_name || activity.user_profiles?.email || 'System'}
                  </p>
                  
                  {activity.details && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(activity.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredActivities.length === 0 && (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No activities found</p>
                {(searchTerm || actionFilter !== 'all') && (
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
