
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TeamProvider, useTeam } from "./context/TeamContext";
import { JoinTeam } from "./components/JoinTeam";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function SuperAdminRedirect() {
  const { user, loading } = useAuth();
  const { isSuperAdmin, loading: teamsLoading } = useTeam();
  
  useEffect(() => {
    // Auto-redirect super admins to admin panel after login
    if (!loading && !teamsLoading && user && isSuperAdmin) {
      const hasRedirected = sessionStorage.getItem('super-admin-redirected');
      if (!hasRedirected) {
        sessionStorage.setItem('super-admin-redirected', 'true');
        window.location.href = '/admin';
      }
    }
  }, [user, isSuperAdmin, loading, teamsLoading]);

  return null;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isSuperAdmin } = useTeam();
  
  useEffect(() => {
    // Clear redirect flag when accessing admin panel directly
    sessionStorage.removeItem('super-admin-redirected');
  }, []);
  
  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!user || !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function TeamFlow({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { teams, loading: teamsLoading, isSuperAdmin } = useTeam();
  
  if (loading || teamsLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Super admins get redirected automatically, but if they're here, show the app
  if (isSuperAdmin && teams.length > 0) {
    return <>{children}</>;
  }
  
  // If user has teams, show the main app
  if (teams.length > 0) {
    return <>{children}</>;
  }
  
  // If user has no teams, show join team flow (mandatory)
  return (
    <JoinTeam
      onSuccess={() => {
        // Team context will automatically refresh and redirect
        window.location.reload();
      }}
    />
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={
        <SuperAdminRoute>
          <Admin />
        </SuperAdminRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <SuperAdminRedirect />
          <TeamFlow>
            <Index />
          </TeamFlow>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TeamProvider>
            <AppRoutes />
          </TeamProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
