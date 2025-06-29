import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  role: 'admin' | 'member';
}

interface TeamContextType {
  teams: Team[];
  currentTeam: Team | null;
  loading: boolean;
  isTeamAdmin: boolean;
  isSuperAdmin: boolean;
  switchTeam: (teamId: string) => void;
  createTeam: (name: string) => Promise<{ error: any }>;
  joinTeam: (inviteCode: string) => Promise<{ error: any }>;
  refreshTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const isTeamAdmin = currentTeam?.role === 'admin';

  useEffect(() => {
    if (user) {
      loadUserTeams();
      checkSuperAdmin();
    } else {
      setTeams([]);
      setCurrentTeam(null);
      setIsSuperAdmin(false);
      setLoading(false);
    }
  }, [user]);

  // Listen for team join events
  useEffect(() => {
    const handleTeamJoined = () => {
      console.log('Team joined event received, refreshing teams...');
      loadUserTeams();
    };

    const handleTeamUpdated = () => {
      console.log('Team updated event received, refreshing teams...');
      loadUserTeams();
    };

    window.addEventListener('teamJoined', handleTeamJoined);
    window.addEventListener('teamUpdated', handleTeamUpdated);
    
    return () => {
      window.removeEventListener('teamJoined', handleTeamJoined);
      window.removeEventListener('teamUpdated', handleTeamUpdated);
    };
  }, []);

  const checkSuperAdmin = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_super_admin')
      .eq('user_id', user.id)
      .single();
    
    if (!error && data) {
      setIsSuperAdmin(data.is_super_admin || false);
    }
  };

  const loadUserTeams = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          teams:team_id (
            id,
            name,
            created_at,
            description,
            logo_url
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading teams:', error);
        toast.error('Failed to load teams');
      } else if (data) {
        const userTeams = data.map(item => ({
          id: item.teams.id,
          name: item.teams.name,
          description: item.teams.description,
          logo_url: item.teams.logo_url,
          created_at: item.teams.created_at,
          role: item.role
        }));
        
        console.log('Loaded teams:', userTeams);
        setTeams(userTeams);
        
        // Set current team if none selected or if current team is no longer available
        if (!currentTeam || !userTeams.find(t => t.id === currentTeam.id)) {
          if (userTeams.length > 0) {
            setCurrentTeam(userTeams[0]);
          } else {
            setCurrentTeam(null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const switchTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setCurrentTeam(team);
      toast.success(`Switched to ${team.name}`);
    }
  };

  const createTeam = async (name: string) => {
    if (!user) return { error: 'Not authenticated' };
    
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (teamError) {
      toast.error('Failed to create team');
      return { error: teamError };
    }

    // Add creator as admin
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'admin',
        joined_at: new Date().toISOString()
      });

    if (memberError) {
      toast.error('Failed to add team admin');
      return { error: memberError };
    }

    await refreshTeams();
    toast.success(`Team "${name}" created successfully!`);
    return { error: null };
  };

  const joinTeam = async (inviteCode: string) => {
    if (!user) return { error: 'Not authenticated' };
    
    try {
      // Validate invite code
      const { data: validation, error: validationError } = await supabase
        .rpc('validate_invite_code', { code: inviteCode });

      if (validationError || !validation[0]?.is_valid) {
        const errorMessage = validation[0]?.error_message || 'Invalid invite code';
        return { error: errorMessage };
      }

      const invitation = validation[0];
      
      // Determine role based on invitation type and admin_role flag
      const memberRole = invitation.admin_role ? 'admin' : 'member';
      
      // Check if user is already a team member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', invitation.team_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        return { error: 'You are already a member of this team' };
      }

      // Add user to team with appropriate role
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: user.id,
          role: memberRole,
          joined_at: new Date().toISOString()
        });

      if (memberError) {
        if (memberError.code === '23505') { // Unique violation
          return { error: 'You are already a member of this team' };
        } else {
          return { error: 'Failed to join team' };
        }
      }

      // Mark invitation as accepted using the new function
      const { error: acceptError } = await supabase.rpc('mark_invitation_accepted', {
        invitation_code: inviteCode,
        user_id_param: user.id
      });

      if (acceptError) {
        console.error('Failed to mark invitation as accepted:', acceptError);
        // Don't fail the join process if this fails, just log it
      }

      await refreshTeams();
      return { error: null };
      
    } catch (error) {
      console.error('Error joining team:', error);
      return { error: 'Failed to join team' };
    }
  };

  const refreshTeams = async () => {
    await loadUserTeams();
  };

  const value = {
    teams,
    currentTeam,
    loading,
    isTeamAdmin,
    isSuperAdmin,
    switchTeam,
    createTeam,
    joinTeam,
    refreshTeams,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
