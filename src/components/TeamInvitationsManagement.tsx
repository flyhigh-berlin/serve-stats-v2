
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Clock, Mail, Trash2, RefreshCw, Users, Send, Calendar, User } from "lucide-react";
import { toast } from "sonner";

interface TeamInvitation {
  id: string;
  invite_code: string;
  invited_email: string | null;
  admin_role: boolean;
  expires_at: string;
  is_active: boolean;
  current_uses: number;
  max_uses: number;
  created_at: string;
  last_used_at?: string;
  accepted_at?: string;
  accepted_by?: string;
}

interface TeamInvitationsManagementProps {
  teamId: string;
  teamName: string;
}

type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'inactive';
type StatusFilter = 'all' | 'pending' | 'accepted' | 'expired' | 'inactive';

export function TeamInvitationsManagement({ teamId, teamName }: TeamInvitationsManagementProps) {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [filteredInvitations, setFilteredInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    loadInvitations();
  }, [teamId]);

  useEffect(() => {
    filterInvitations();
  }, [invitations, statusFilter]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('admin_role', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error('Failed to load team invitations');
    } finally {
      setLoading(false);
    }
  };

  const filterInvitations = () => {
    if (statusFilter === 'all') {
      setFilteredInvitations(invitations);
      return;
    }

    const filtered = invitations.filter(invitation => {
      const status = getInvitationStatus(invitation);
      return status === statusFilter;
    });
    setFilteredInvitations(filtered);
  };

  const getInvitationStatus = (invitation: TeamInvitation): InvitationStatus => {
    if (!invitation.is_active) return 'inactive';
    if (invitation.accepted_at) return 'accepted';
    if (new Date(invitation.expires_at) < new Date()) return 'expired';
    return 'pending';
  };

  const getStatusBadge = (status: InvitationStatus) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'Accepted', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      expired: { label: 'Expired', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      inactive: { label: 'Inactive', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const copyInviteCode = (code: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(code);
    toast.success("Invitation code copied to clipboard");
  };

  const resendInvitation = async (invitation: TeamInvitation) => {
    try {
      // For now, just copy the code and show a message
      // In the future, this could integrate with an email service
      await copyInviteCode(invitation.invite_code);
      toast.success(`Invitation code copied. Send this to ${invitation.invited_email || 'the admin'}`);
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  const deactivateInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ is_active: false })
        .eq('id', invitationId);

      if (error) throw error;
      
      toast.success("Invitation deactivated");
      loadInvitations();
    } catch (error) {
      console.error('Error deactivating invitation:', error);
      toast.error('Failed to deactivate invitation');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusCounts = () => {
    const counts = {
      all: invitations.length,
      pending: 0,
      accepted: 0,
      expired: 0,
      inactive: 0
    };

    invitations.forEach(invitation => {
      const status = getInvitationStatus(invitation);
      counts[status]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Admin Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading invitations...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Admin Invitations for {teamName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                <SelectItem value="accepted">Accepted ({statusCounts.accepted})</SelectItem>
                <SelectItem value="expired">Expired ({statusCounts.expired})</SelectItem>
                <SelectItem value="inactive">Inactive ({statusCounts.inactive})</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadInvitations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No admin invitations found</p>
            <p className="text-sm">Create invitations when setting up the team</p>
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No invitations match the current filter</p>
            <p className="text-sm">Try selecting a different status filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Invitation Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Accepted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invitation) => {
                  const status = getInvitationStatus(invitation);
                  const isPending = status === 'pending';
                  const isAccepted = status === 'accepted';
                  
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {invitation.invited_email || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {invitation.invite_code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => copyInviteCode(invitation.invite_code, e)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(invitation.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(invitation.expires_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAccepted && invitation.accepted_at ? (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <User className="h-3 w-3" />
                            {formatDate(invitation.accepted_at)}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isPending && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resendInvitation(invitation)}
                              className="h-8 px-2"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Resend
                            </Button>
                          )}
                          
                          {invitation.is_active && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 px-2 text-red-600 hover:text-red-700">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deactivate Invitation?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will prevent the invitation code from being used. This action cannot be undone.
                                    {invitation.invited_email && (
                                      <div className="mt-2 font-medium">
                                        Email: {invitation.invited_email}
                                      </div>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deactivateInvitation(invitation.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Deactivate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
