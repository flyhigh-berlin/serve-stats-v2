
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
  performed_by: string;
  created_at: string;
  user_profiles?: {
    full_name: string;
    email: string;
  };
}

export function TeamActivity({ teamId }: TeamActivityProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['team-activity', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_activity_audit')
        .select(`
          id,
          action,
          details,
          performed_by,
          created_at,
          user_profiles:performed_by (
            full_name,
            email
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ActivityRecord[];
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
    const performedBy = activity.user_profiles?.full_name || activity.user_profiles?.email || 'System';
    
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
