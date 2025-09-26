import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [needsAccount, setNeedsAccount] = useState(false);
  const [accountData, setAccountData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  const invitationCode = searchParams.get('code');

  useEffect(() => {
    if (invitationCode) {
      loadInvitation();
    } else {
      setLoading(false);
    }
  }, [invitationCode]);

  const loadInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('family_invitations')
        .select(`
          *,
          families (name, family_code)
        `)
        .eq('invitation_code', invitationCode)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) throw error;

      setInvitation(data);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.invitee_email)
        .single();

      setNeedsAccount(!existingUser);
      if (existingUser) {
        setAccountData(prev => ({ ...prev, email: data.invitee_email }));
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid or expired invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    setAccepting(true);
    try {
      let userId = null;

      if (needsAccount) {
        // Validate passwords match
        if (accountData.password !== accountData.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        if (accountData.password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }

        // Create new account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: invitation.invitee_email,
          password: accountData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: invitation.invitee_name,
              role: invitation.role
            }
          }
        });

        if (signUpError) throw signUpError;
        userId = authData.user?.id;

        // Create profile
        await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: invitation.invitee_email.split('@')[0],
            display_name: invitation.invitee_name,
            email: invitation.invitee_email,
            role: invitation.role,
            email_verified: true
          });

      } else {
        // Sign in existing user
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: invitation.invitee_email,
          password: accountData.password
        });

        if (signInError) throw signInError;
        userId = authData.user?.id;
      }

      if (!userId) throw new Error("Failed to authenticate user");

      // Add to family
      await supabase
        .from('family_members')
        .insert({
          family_id: invitation.family_id,
          user_id: userId
        });

      // Add family role
      await supabase
        .from('family_roles')
        .insert({
          user_id: userId,
          family_id: invitation.family_id,
          role: invitation.role,
          permissions: {},
          invited_by: invitation.invited_by,
          accepted_at: new Date().toISOString()
        });

      // Update invitation status
      await supabase
        .from('family_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      toast({
        title: "Success!",
        description: `Welcome to ${invitation.families.name}!`
      });

      // Redirect based on role
      if (invitation.role === 'parent') {
        navigate('/parent-dashboard');
      } else {
        navigate('/children/tasks');
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Invalid Invitation</h1>
            <p className="text-muted-foreground mb-4">
              This invitation link is invalid or has expired.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Family Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a family on Chatterbox
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{invitation.families.name}</h3>
            <p className="text-sm text-muted-foreground">
              Invited as: <Badge variant="secondary">{invitation.role}</Badge>
            </p>
            <p className="text-sm text-muted-foreground">
              Family Code: <code className="font-mono">{invitation.families.family_code}</code>
            </p>
          </div>

          {/* Account Creation/Login Form */}
          <div className="space-y-4">
            {needsAccount ? (
              <>
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">
                    Create your account to join the family
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={invitation.invitee_email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Create Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={accountData.password}
                    onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                    placeholder="Enter a secure password"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={accountData.confirmPassword}
                    onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">
                    Sign in to accept the invitation
                  </p>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={invitation.invitee_email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={accountData.password}
                    onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* Accept Button */}
          <Button 
            className="w-full" 
            onClick={handleAcceptInvitation}
            disabled={accepting || (!needsAccount && !accountData.password) || (needsAccount && (!accountData.password || !accountData.confirmPassword))}
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {needsAccount ? "Creating Account..." : "Signing In..."}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Invitation
              </>
            )}
          </Button>

          <div className="text-center">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}