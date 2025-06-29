
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Activity, Target, Calendar, TrendingUp } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamOverviewTabProps {
  teamId: string;
}

export function TeamOverviewTab({ teamId }: TeamOverviewTabProps) {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['team-analytics', teamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_analytics', {
        team_id_param: teamId
      });
      if (error) throw error;
      return data;
    }
  });

  const { data: teamInfo, isLoading: teamLoading } = useQuery({
    queryKey: ['team-info', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_activity_audit')
        .select(`
          *,
          user_profiles!team_activity_audit_performed_by_fkey(full_name, email)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });

  if (analyticsLoading || teamLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (analytics?.error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load team analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Info Header */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{teamInfo?.name}</h3>
            {teamInfo?.description && (
              <p className="text-muted-foreground mt-1">{teamInfo.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Created {formatDate(teamInfo?.created_at)}</span>
              {teamInfo?.last_activity_at && (
                <span>Last activity {formatDate(teamInfo.last_activity_at)}</span>
              )}
            </div>
          </div>
          {teamInfo?.logo_url && (
            <img 
              src={teamInfo.logo_url} 
              alt="Team logo" 
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.members?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.members?.new_30d || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.members?.admins || 0}</div>
            <p className="text-xs text-muted-foreground">
              Managing the team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.games?.total_games || 0}</div>
            <p className="text-xs text-muted-foreground">
              Games played
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Serves</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.games?.total_serves || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.games?.total_aces || 0} aces, {analytics?.games?.total_fails || 0} fails
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Team Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Activities</span>
                <span className="font-medium">{analytics?.activity?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="font-medium">{analytics?.activity?.recent_7d || 0}</span>
              </div>
              {analytics?.activity?.last_activity && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Activity</span>
                  <span className="font-medium text-sm">
                    {formatDate(analytics.activity.last_activity)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Players</span>
                <span className="font-medium">{analytics?.games?.total_players || 0}</span>
              </div>
              {analytics?.games?.total_serves > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ace Rate</span>
                    <span className="font-medium">
                      {Math.round((analytics?.games?.total_aces / analytics?.games?.total_serves) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="font-medium">
                      {Math.round(((analytics?.games?.total_serves - analytics?.games?.total_fails) / analytics?.games?.total_serves) * 100)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.user_profiles?.full_name || activity.user_profiles?.email || 'Unknown'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {formatDate(activity.created_at)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
