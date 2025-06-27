
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
import { useState } from "react";

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

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isSuperAdmin } = useTeam();
  
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
  const { teams, loading: teamsLoading } = useTeam();
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [hasSkippedJoin, setHasSkippedJoin] = useState(false);
  
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
  
  // Show join team flow if user has no teams and hasn't skipped
  if (teams.length === 0 && !hasSkippedJoin && !showJoinTeam) {
    setShowJoinTeam(true);
  }
  
  if (showJoinTeam && teams.length === 0 && !hasSkippedJoin) {
    return (
      <JoinTeam
        onSuccess={() => {
          setShowJoinTeam(false);
          setHasSkippedJoin(false);
        }}
        onSkip={() => {
          setShowJoinTeam(false);
          setHasSkippedJoin(true);
        }}
      />
    );
  }
  
  return <>{children}</>;
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
