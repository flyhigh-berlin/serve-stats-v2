
import React, { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState("");
  const [inviteInfo, setInviteInfo] = useState<{
    teamName: string;
    role: string;
    email: string;
  } | null>(null);

  // Check for invitation code in URL
  useEffect(() => {
    const code = searchParams.get('invite');
    if (code) {
      setInviteCode(code);
      setActiveTab("signup");
      validateInviteCode(code);
    }
  }, [searchParams]);

  const validateInviteCode = async (code: string) => {
    if (!code) return;
    
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.rpc('validate_invite_code', {
        code: code
      });

      if (error) throw error;
      
      if (data && data[0]?.is_valid) {
        const invitation = data[0];
        setInviteInfo({
          teamName: invitation.team_name,
          role: invitation.admin_role ? 'Administrator' : 'Member',
          email: invitation.invited_email || ''
        });
        toast.success(`Valid invitation for ${invitation.team_name}!`);
      } else {
        toast.error(data[0]?.error_message || 'Invalid invitation code');
        setInviteCode("");
        setInviteInfo(null);
      }
    } catch (error) {
      console.error('Error validating invite code:', error);
      toast.error('Failed to validate invitation code');
      setInviteCode("");
      setInviteInfo(null);
    }
  };

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    await signIn(email, password);
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const inviteCodeValue = formData.get('inviteCode') as string || inviteCode;
    
    // Validate email matches invitation if there's an invite code
    if (inviteCodeValue && inviteInfo?.email && inviteInfo.email.toLowerCase() !== email.toLowerCase()) {
      toast.error('Email must match the invitation email address');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const { error } = await signUp(email, password, fullName);
      
      if (!error && inviteCodeValue) {
        // If there's an invitation code, we'll handle team joining after successful signup
        // The signup process will trigger the user creation, and we'll handle the invitation in the auth context
        localStorage.setItem('pendingInviteCode', inviteCodeValue);
      }
    } catch (error) {
      console.error('Signup error:', error);
    }
    
    setIsSubmitting(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    await resetPassword(email);
    setIsSubmitting(false);
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/lovable-uploads/9d00919c-607d-49af-87e1-11c7dc280cba.png" alt="Serve Stats Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-team-primary">Serve Stats</h1>
          <p className="text-muted-foreground mt-2">Track your volleyball serving performance</p>
        </div>

        {inviteInfo && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Team Invitation</p>
                  <p className="text-sm text-green-700">
                    You're invited to join <strong>{inviteInfo.teamName}</strong> as a <strong>{inviteInfo.role}</strong>
                  </p>
                  {inviteInfo.email && (
                    <p className="text-xs text-green-600 mt-1">
                      Use email: {inviteInfo.email}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="reset">Reset</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                      defaultValue={inviteInfo?.email || ''}
                      disabled={!!inviteInfo?.email}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-invite">Invitation Code (Optional)</Label>
                    <Input
                      id="signup-invite"
                      name="inviteCode"
                      type="text"
                      placeholder="Enter invitation code"
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value);
                        if (e.target.value) {
                          validateInviteCode(e.target.value);
                        } else {
                          setInviteInfo(null);
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="reset">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Email
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
