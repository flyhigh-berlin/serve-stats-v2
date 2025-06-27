
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTeam } from "../context/TeamContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UsersRound, User, Settings, Shield, BarChart3 } from "lucide-react";
import { SuperAdminTeamManagement } from "@/components/SuperAdminTeamManagement";
import { SuperAdminUserManagement } from "@/components/SuperAdminUserManagement";
import { SuperAdminAnalytics } from "@/components/SuperAdminAnalytics";

const Admin = () => {
  const { user, signOut } = useAuth();
  const { isSuperAdmin, loading } = useTeam();

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect non-super-admins
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container py-4 px-2 sm:px-4 max-w-7xl">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-team-primary flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Platform-wide management and analytics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="destructive" className="px-3 py-1">
              <Shield className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Logged in as: <strong>{user?.email}</strong>
        </div>
      </header>

      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="mb-6 w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="teams" className="text-xs sm:text-sm py-2">
            <UsersRound className="h-4 w-4 mr-2" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm py-2">
            <User className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm py-2">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="teams" className="mt-0">
          <SuperAdminTeamManagement />
        </TabsContent>
        
        <TabsContent value="users" className="mt-0">
          <SuperAdminUserManagement />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-0">
          <SuperAdminAnalytics />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-muted-foreground mb-4">
                  Configure platform-wide settings and preferences.
                </div>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Date Format</h4>
                      <p className="text-sm text-muted-foreground">Currently set to DD.MM.YYYY format</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">System Maintenance</h4>
                      <p className="text-sm text-muted-foreground">Platform maintenance tools</p>
                    </div>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
