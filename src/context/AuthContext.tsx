
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle invitation acceptance after successful signup
        if (event === 'SIGNED_IN' && session?.user) {
          const pendingInviteCode = localStorage.getItem('pendingInviteCode');
          if (pendingInviteCode) {
            localStorage.removeItem('pendingInviteCode');
            // Use setTimeout to avoid potential deadlock
            setTimeout(() => {
              handleInvitationAcceptance(pendingInviteCode, session.user);
            }, 100);
          }
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleInvitationAcceptance = async (inviteCode: string, user: User) => {
    try {
      // Validate the invitation code first
      const { data: validationData, error: validationError } = await supabase
        .rpc('validate_invite_code', { code: inviteCode });

      if (validationError) {
        console.error('Error validating invite code:', validationError);
        toast.error('Failed to validate invitation code');
        return;
      }

      if (!validationData || !validationData[0]?.is_valid) {
        toast.error(validationData[0]?.error_message || 'Invalid invitation code');
        return;
      }

      const invitation = validationData[0];
      
      // Validate email matches invitation if specified
      if (invitation.invited_email && invitation.invited_email.toLowerCase() !== user.email?.toLowerCase()) {
        toast.error('Email must match the invitation email address');
        return;
      }

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
        toast.error('You are already a member of this team');
        return;
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
          toast.error('You are already a member of this team');
        } else {
          console.error('Error adding user to team:', memberError);
          toast.error('Failed to join team');
        }
        return;
      }

      // Mark invitation as accepted
      const { error: acceptError } = await supabase.rpc('mark_invitation_accepted', {
        invitation_code: inviteCode,
        user_id_param: user.id
      });

      if (acceptError) {
        console.error('Failed to mark invitation as accepted:', acceptError);
        // Don't fail the join process if this fails, just log it
      }

      const roleMessage = memberRole === 'admin' ? 'as an administrator' : 'as a member';
      toast.success(`Successfully joined ${invitation.team_name} ${roleMessage}!`);
      
      // Refresh the page to load the team data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept team invitation');
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Successfully signed in!');
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email to confirm your account!');
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Successfully signed out!');
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent!');
    }
    
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
