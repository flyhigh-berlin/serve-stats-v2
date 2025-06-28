
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeam } from "@/context/TeamContext";
import { formatDate } from "@/utils/dateUtils";
import { Users, Crown, Calendar, Activity } from "lucide-react";

interface TeamOverviewProps {
  teamId: string;
}

interface TeamStats {
  total_members: number;
  admin_count: number;
  member_count: number;
  recent_activity_count: number;
}

export function TeamOverview({ teamId }: TeamOverviewProps) {
  const { currentTeam } = useTeam();

  const { data: teamStats } = useQuery({
    queryKey: ['team-stats', teamId],
    queryFn: async () => {
      // Get team member counts
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId);
      
      if (membersError) throw membersError;
      
      const total_members = members?.length || 0;
      const admin_count = members?.filter(m => m.role === 'admin').length || 0;
      const member_count = members?.filter(m => m.role === 'member').length || 0;
      
      // Get recent activity count
      const { data: activity, error: activityError } = await supabase
        .from('team_activity_audit')
        .select('id')
        .eq('team_id', teamId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (activityError) console.error('Activity query error:', activityError);
      
      return {
        total_members,
        admin_count,
        member_count,
        recent_activity_count: activity?.length || 0
      } as TeamStats;
    },
    enabled: !!teamId,
  });

  const { data: teamDetails } = useQuery({
    queryKey: ['team-details', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  if (!currentTeam || !teamDetails) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg">{teamDetails.name}</h3>
              {(teamDetails as any).description && (
                <p className="text-muted-foreground mt-1">{(teamDetails as any).description}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Created: {formatDate(teamDetails.created_at)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.total_members || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Administrators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.admin_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.member_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.recent_activity_count || 0}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
