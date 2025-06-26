
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Shield, User, Crown } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  created_at: string;
  team_count: number;
  admin_team_count: number;
}

export function SuperAdminUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          email,
          full_name,
          is_super_admin,
          created_at
        `);

      if (error) throw error;

      // Get team membership counts for each user
      const usersWithTeamCounts = await Promise.all(
        data.map(async (user) => {
          const { data: teamMemberships, error: teamError } = await supabase
            .from('team_members')
            .select('role')
            .eq('user_id', user.user_id);

          if (teamError) {
            console.error('Error loading team memberships:', teamError);
            return {
              ...user,
              team_count: 0,
              admin_team_count: 0
            };
          }

          return {
            ...user,
            team_count: teamMemberships.length,
            admin_team_count: teamMemberships.filter(m => m.role === 'admin').length
          };
        })
      );

      setUsers(usersWithTeamCounts);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleSuperAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_super_admin: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      await loadUsers();
      toast.success(`Super admin status ${!currentStatus ? 'granted' : 'revoked'} successfully`);
    } catch (error) {
      console.error('Error updating super admin status:', error);
      toast.error('Failed to update super admin status');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage all users across the platform
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="secondary">
          {filteredUsers.length} users found
        </Badge>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map(user => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.is_super_admin ? (
                      <Crown className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {user.full_name || user.email}
                      {user.is_super_admin && (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Super Admin
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {user.team_count} teams
                  </Badge>
                  {user.admin_team_count > 0 && (
                    <Badge variant="outline">
                      Admin in {user.admin_team_count}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </div>
                <Button
                  variant={user.is_super_admin ? "destructive" : "default"}
                  size="sm"
                  onClick={() => toggleSuperAdmin(user.user_id, user.is_super_admin)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {user.is_super_admin ? 'Revoke' : 'Grant'} Super Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
