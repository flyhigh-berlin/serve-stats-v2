
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/utils/dateUtils";
import { Activity, Users, Crown, UserMinus, Mail } from "lucide-react";

interface TeamActivityProps {
  teamId: string;
}

interface ActivityRecord {
  id: string;
  action: string;
  details: any;
  performed_by: string | null;
  created_at: string;
  performer_email?: string;
  performer_name?: string;
}

export function TeamActivity({ teamId }: TeamActivityProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['team-activity', teamId],
    queryFn: async () => {
      // First get the activity records
      const { data: activityData, error: activityError } = await supabase
        .from('team_activity_audit')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (activityError) throw activityError;
      
      if (!activityData || activityData.length === 0) {
        return [];
      }

      // Get unique performer IDs
      const performerIds = [...new Set(activityData
        .map(activity => activity.performed_by)
        .filter(Boolean))] as string[];

      // Get performer details if any exist
      let performerDetails: Record<string, { email: string; full_name: string | null }> = {};
      
      if (performerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, email, full_name')
          .in('user_id', performerIds);
        
        if (!profilesError && profiles) {
          performerDetails = profiles.reduce((acc, profile) => {
            acc[profile.user_id] = {
              email: profile.email,
              full_name: profile.full_name
            };
            return acc;
          }, {} as Record<string, { email: string; full_name: string | null }>);
        }
      }

      // Combine activity data with performer details
      return activityData.map(activity => ({
        ...activity,
        performer_email: activity.performed_by ? performerDetails[activity.performed_by]?.email : null,
        performer_name: activity.performed_by ? performerDetails[activity.performed_by]?.full_name : null,
      })) as ActivityRecord[];
    },
    enabled: !!teamId,
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'role_changed':
        return <Crown className="h-4 w-4" />;
      case 'member_removed':
        return <UserMinus className="h-4 w-4" />;
      case 'invitation_sent':
        return <Mail className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityDescription = (activity: ActivityRecord) => {
    const performedBy = activity.performer_name || activity.performer_email || 'System';
    
    switch (activity.action) {
      case 'role_changed':
        return `${performedBy} changed ${activity.details?.member_email}'s role from ${activity.details?.old_role} to ${activity.details?.new_role}`;
      case 'member_removed':
        return `${performedBy} removed ${activity.details?.member_email} (${activity.details?.member_role}) from the team`;
      case 'invitation_sent':
        return `${performedBy} sent an invitation to ${activity.details?.invited_email}`;
      default:
        return `${performedBy} performed ${activity.action}`;
    }
  };

  const getActivityBadge = (action: string) => {
    switch (action) {
      case 'role_changed':
        return <Badge variant="default">Role Change</Badge>;
      case 'member_removed':
        return <Badge variant="destructive">Member Removed</Badge>;
      case 'invitation_sent':
        return <Badge variant="secondary">Invitation</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityBadge(activity.action)}
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(activity.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">
                    {getActivityDescription(activity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
