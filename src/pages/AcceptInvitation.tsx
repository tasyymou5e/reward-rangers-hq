import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, CheckCircle, XCircle, Loader2, Clock, AlertTriangle, UserCheck, Mail, Shield } from "lucide-react";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<any>(null);
  const [familyData, setFamilyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [acceptProgress, setAcceptProgress] = useState(0);
  const [acceptStep, setAcceptStep] = useState("");
  const [needsAccount, setNeedsAccount] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
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
          families (
            name, 
            family_code, 
            description, 
            avatar_url,
            created_at,
            family_members!inner (
              profiles (display_name, role)
            )
          )
        `)
        .eq('invitation_code', invitationCode)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) throw error;

      setInvitation(data);
      setFamilyData(data.families);

      // Calculate time remaining
      const expiryTime = new Date(data.expires_at).getTime();
      const now = new Date().getTime();
      const hoursRemaining = Math.floor((expiryTime - now) / (1000 * 60 * 60));
      
      if (hoursRemaining < 24) {
        setIsExpiringSoon(true);
        if (hoursRemaining < 1) {
          const minutesRemaining = Math.floor((expiryTime - now) / (1000 * 60));
          setTimeRemaining(`${minutesRemaining} minutes`);
        } else {
          setTimeRemaining(`${hoursRemaining} hours`);
        }
      } else {
        const daysRemaining = Math.floor(hoursRemaining / 24);
        setTimeRemaining(`${daysRemaining} days`);
      }

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
    setAcceptProgress(0);
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

        // Step 1: Create account
        setAcceptStep("Creating your account...");
        setAcceptProgress(20);
        
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

        // Step 2: Create profile
        setAcceptStep("Setting up your profile...");
        setAcceptProgress(40);
        
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
        // Step 1: Sign in existing user
        setAcceptStep("Signing you in...");
        setAcceptProgress(30);
        
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: invitation.invitee_email,
          password: accountData.password
        });

        if (signInError) throw signInError;
        userId = authData.user?.id;
      }

      if (!userId) throw new Error("Failed to authenticate user");

      // Step 3: Add to family
      setAcceptStep("Adding you to the family...");
      setAcceptProgress(60);
      
      await supabase
        .from('family_members')
        .insert({
          family_id: invitation.family_id,
          user_id: userId
        });

      // Step 4: Set family role
      setAcceptStep("Setting up permissions...");
      setAcceptProgress(80);
      
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

      // Step 5: Update invitation status
      setAcceptStep("Finalizing invitation...");
      setAcceptProgress(95);
      
      await supabase
        .from('family_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      setAcceptStep("Complete! Redirecting...");
      setAcceptProgress(100);

      toast({
        title: "Success!",
        description: `Welcome to ${invitation.families.name}!`
      });

      // Redirect based on role
      setTimeout(() => {
        if (invitation.role === 'parent') {
          navigate('/parent-dashboard');
        } else {
          navigate('/children/tasks');
        }
      }, 1000);

    } catch (error: any) {
      setAcceptStep("");
      setAcceptProgress(0);
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setAccepting(false), 1000);
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
      <Card className="w-full max-w-lg">
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
          {/* Expiry Warning */}
          {isExpiringSoon && (
            <Alert className="border-orange-200 bg-orange-50">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Invitation expires in {timeRemaining}</strong>
                {timeRemaining.includes('minutes') && " - Please accept soon!"}
              </AlertDescription>
            </Alert>
          )}

          {/* Family Preview */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-2">
                {familyData?.avatar_url ? (
                  <img 
                    src={familyData.avatar_url} 
                    alt={`${familyData.name} avatar`}
                    className="h-16 w-16 rounded-full object-cover border-2 border-blue-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                )}
              </div>
              <CardTitle className="text-lg text-blue-900">{familyData?.name}</CardTitle>
              <div className="flex items-center justify-center gap-4 text-sm text-blue-700">
                <span className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4" />
                  {(familyData?.family_members?.length || 0) + 1} members
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Code: {familyData?.family_code}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center space-y-2">
                <p className="text-sm text-blue-700">
                  {familyData?.description || "A wonderful family on Chatterbox"}
                </p>
                <div className="flex justify-center">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Invited as: {invitation.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Progress Indicator */}
          {accepting && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-700">{acceptStep}</p>
              </div>
              <Progress value={acceptProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {acceptProgress}% complete
              </p>
            </div>
          )}

          {/* Accept Button */}
          <Button 
            className="w-full" 
            onClick={handleAcceptInvitation}
            disabled={accepting || (!needsAccount && !accountData.password) || (needsAccount && (!accountData.password || !accountData.confirmPassword))}
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {acceptStep || (needsAccount ? "Creating Account..." : "Signing In...")}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Invitation & Join Family
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