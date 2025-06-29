
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Copy, Plus, Trash2, Users, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/dateUtils";

interface TeamInvitationsTabProps {
  teamId: string;
}

interface MemberInvitationResponse {
  success: boolean;
  invitation?: {
    id: string;
    invite_code: string;
    expires_at: string;
    current_uses: number;
    max_uses: number;
    is_active: boolean;
  };
}

interface InvitationResponse {
  success: boolean;
  error?: string;
  invite_code?: string;
  expires_at?: string;
}

interface RecentJoin {
  id: string;
  user_id: string;
  joined_at: string;
  role: string;
  user_profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

export function TeamInvitationsTab({ teamId }: TeamInvitationsTabProps) {
  const queryClient = useQueryClient();

  const { data: memberInvitation } = useQuery({
    queryKey: ['member-invitation', teamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_member_invitation', {
        team_id_param: teamId
      });
      if (error) throw error;
      return data as unknown as MemberInvitationResponse;
    }
  });

  const { data: recentJoins } = useQuery({
    queryKey: ['recent-joins', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          joined_at,
          role,
          user_profiles (
            full_name,
            email
          )
        `)
        .eq('team_id', teamId)
        .order('joined_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as RecentJoin[];
    }
  });

  const createMemberInviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_member_invitation_for_team', {
        team_id_param: teamId
      });
      if (error) throw error;
      return data as unknown as InvitationResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['member-invitation', teamId] });
        toast.success('Member invitation created');
      } else {
        toast.error(data.error || 'Failed to create invitation');
      }
    },
    onError: (error) => {
      console.error('Error creating member invitation:', error);
      toast.error('Failed to create member invitation');
    }
  });

  const deactivateInviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('deactivate_member_invitation', {
        team_id_param: teamId
      });
      if (error) throw error;
      return data as unknown as InvitationResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-invitation', teamId] });
      toast.success('Member invitation deactivated');
    },
    onError: (error) => {
      console.error('Error deactivating invitation:', error);
      toast.error('Failed to deactivate invitation');
    }
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getInviteUrl = (code: string) => {
    return `${window.location.origin}?invite=${code}`;
  };

  const getDisplayName = (join: RecentJoin) => {
    if (join.user_profiles?.full_name) return join.user_profiles.full_name;
    if (join.user_profiles?.email) return join.user_profiles.email;
    return 'Profile incomplete';
  };

  const getDisplayEmail = (join: RecentJoin) => {
    return join.user_profiles?.email || 'No email';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Team Invitations</h3>
        <p className="text-sm text-muted-foreground">
          Manage member invitations and view recent team joins
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Invitation Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          {memberInvitation?.invitation ? (
            <div className="space-y-4">
              <div>
                <Label>Current Member Invitation Code</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={memberInvitation.invitation.invite_code}
                    readOnly
                    className="flex-1 font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(memberInvitation.invitation.invite_code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Expires: {formatDate(memberInvitation.invitation.expires_at)}</span>
                  <span>Uses: {memberInvitation.invitation.current_uses}/{memberInvitation.invitation.max_uses}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Share this code with new members. They can join by going to the homepage and entering this code.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => deactivateInviteMutation.mutate()}
                disabled={deactivateInviteMutation.isPending}
              >
                {deactivateInviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="mr-2 h-4 w-4" />
                Deactivate Code
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => createMemberInviteMutation.mutate()}
              disabled={createMemberInviteMutation.isPending}
              className="w-full"
            >
              {createMemberInviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-2 h-4 w-4" />
              Create Member Invitation Code
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Recent Joins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentJoins?.map(join => (
              <div key={join.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{getDisplayName(join)}</p>
                  <p className="text-sm text-muted-foreground">{getDisplayEmail(join)}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(join.joined_at)}
                  </p>
                </div>
                <Badge variant={join.role === 'admin' ? 'default' : 'secondary'}>
                  {join.role}
                </Badge>
              </div>
            ))}
            {(!recentJoins || recentJoins.length === 0) && (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recent joins</p>
                <p className="text-sm text-muted-foreground mt-1">
                  New team members will appear here when they join
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
