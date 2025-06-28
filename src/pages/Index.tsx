
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTeam } from "@/context/TeamContext";
import { useVolleyball } from "@/context/VolleyballContext";
import { Navbar } from "@/components/Navbar";
import { TeamSelector } from "@/components/TeamSelector";
import { GameDaySelector } from "@/components/GameDaySelector";
import { PlayerList } from "@/components/PlayerList";
import { Scoreboard } from "@/components/Scoreboard";
import { GameHistory } from "@/components/GameHistory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate, Link } from "react-router-dom";
import { Settings, BarChart3 } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();
  const { currentGameDay, setCurrentGameDay } = useVolleyball();

  useEffect(() => {
    if (currentGameDay) {
      setCurrentGameDay(null);
    }
  }, [currentTeam]);

  if (authLoading || teamLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto p-4 space-y-6">
        {/* Team Dashboard Link */}
        {currentTeam && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Team Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Access your team's comprehensive dashboard to manage members, view analytics, and configure settings.
              </p>
              <Link to="/team-dashboard">
                <Button className="w-full sm:w-auto">
                  <Settings className="h-4 w-4 mr-2" />
                  Open Team Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <TeamSelector />
            {currentTeam && <GameDaySelector />}
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            {currentTeam && currentGameDay && (
              <>
                <Scoreboard />
                <PlayerList />
              </>
            )}
            
            {currentTeam && <GameHistory />}
            
            {!currentTeam && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-2">Welcome to Volleyball Tracker</h2>
                <p className="text-muted-foreground">
                  Select or create a team to get started with tracking your volleyball games.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
