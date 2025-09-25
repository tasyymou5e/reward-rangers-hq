import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { secureLog } from "@/utils/secureLogging";

import { LogIn, UserPlus, Users, Crown, Shield, Mail, ArrowRight } from "lucide-react";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("parent");
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [showEmailResolution, setShowEmailResolution] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState("");
  
  const { signIn, signUp } = useAuth();
  const { 
    enhancedSignIn, 
    enhancedSignUp, 
    checkEmailResolution,
    loading,
    isBlocked, 
    authAttempts, 
    maxAttempts 
  } = useEnhancedAuth();
  const { toast } = useToast();
  const navigate = useNavigate();


  const handleEmailCheck = async () => {
    if (!email) return;
    
    try {
      const resolution = await checkEmailResolution(email);
      if (resolution.canResolve) {
        setResolvedEmail(resolution.resolvedEmail);
        setShowEmailResolution(true);
        toast({
          title: "Email Resolution Available",
          description: "This email can be resolved to your family's primary email",
        });
      }
    } catch (error) {
      // Silently handle resolution errors
      console.warn('Email resolution check failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security: Check if user is temporarily blocked
    if (isBlocked) {
      toast({
        title: "Account Temporarily Blocked",
        description: `Too many failed attempts. Please wait before trying again.`,
        variant: "destructive",
      });
      secureLog.warn("Blocked authentication attempt", { email, authAttempts });
      return;
    }
    
    // Enhanced password validation for signup
    if (isSignUp && !isPasswordValid) {
      toast({
        title: "Password Requirements",
        description: "Please ensure your password meets all security requirements.",
        variant: "destructive",
      });
      return;
    }

    try {
      let result;
      if (isSignUp) {
        // Use enhanced signup with family creation option
        result = await enhancedSignUp(email, password, {
          display_name: displayName,
          username: username,
          role: role
        }, role === 'parent', displayName ? `${displayName}'s Family` : undefined);
      } else {
        // Use enhanced signin with email resolution
        result = await enhancedSignIn(email, password);
      }

      if (!result.success) {
        toast({
          title: "Authentication Error",
          description: result.error || "Authentication failed",
          variant: "destructive",
        });
        
        if (result.requiresEmailResolution) {
          setShowEmailResolution(true);
        }
        
        secureLog.warn("Enhanced authentication failed", { 
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          error: result.error
        });
      } else {
        toast({
          title: isSignUp ? "Account Created!" : "Welcome Back!",
          description: isSignUp 
            ? "Please check your email to verify your account." 
            : result.resolvedEmail 
              ? "Signed in using your family's primary email"
              : "You've been successfully signed in.",
        });
        
        secureLog.info("Enhanced authentication successful", { 
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          type: isSignUp ? 'signup' : 'signin',
          emailResolved: !!result.resolvedEmail
        });
        
        // Redirect based on role
        if (!isSignUp) {
          navigate("/");
        }
      }
    } catch (error: any) {
      // Enhanced error handling with security logging
      secureLog.error("Enhanced authentication error", { 
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        error: error.message 
      });
      
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (roleValue: string) => {
    switch (roleValue) {
      case "parent": return <Users className="h-4 w-4" />;
      case "kid": return <Crown className="h-4 w-4" />;
      case "admin": return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleDescription = (roleValue: string) => {
    switch (roleValue) {
      case "parent": return "Manage family chores and rewards";
      case "kid": return "Complete chores and earn rewards";
      case "admin": return "System administration access";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="text-6xl animate-bounce-in">
            {isSignUp ? "👨‍👩‍👧‍👦" : "🎯"}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Join ChoreQuest" : "Welcome Back"}
          </CardTitle>
          <p className="text-muted-foreground">
            {isSignUp 
              ? "Create your family account to start managing chores and rewards" 
              : "Sign in to access your family dashboard"
            }
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Account Type</Label>
                  <RadioGroup value={role} onValueChange={setRole}>
                    {['parent', 'kid', 'admin'].map((roleValue) => (
                      <div key={roleValue} className="flex items-center space-x-2">
                        <RadioGroupItem value={roleValue} id={roleValue} />
                        <Label 
                          htmlFor={roleValue} 
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {getRoleIcon(roleValue)}
                          <div>
                            <div className="font-medium capitalize">{roleValue}</div>
                            <div className="text-xs text-muted-foreground">
                              {getRoleDescription(roleValue)}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailCheck}
                  required
                />
                {!isSignUp && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2"
                    onClick={handleEmailCheck}
                  >
                    <Mail className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Email Resolution Alert */}
              {showEmailResolution && resolvedEmail && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    This email resolves to your family's primary email: 
                    <strong className="ml-1">{resolvedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {isSignUp && (
                <PasswordStrengthIndicator 
                  password={password} 
                  onValidationChange={setIsPasswordValid}
                  showDetailedFeedback={true}
                />
              )}
            </div>

            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || isBlocked}
              variant={isSignUp ? "default" : "default"}
            >
              {loading ? (
                "Processing..."
              ) : isBlocked ? (
                `Blocked - Try again later`
              ) : (
                <>
                  {isSignUp ? <UserPlus className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                  {isSignUp ? "Create Account" : "Sign In"}
                </>
              )}
            </Button>
            
            {/* Security: Show attempt counter */}
            {authAttempts > 0 && authAttempts < maxAttempts && (
              <div className="text-center text-sm text-orange-600 mt-2">
                {maxAttempts - authAttempts} attempts remaining
              </div>
            )}
          </form>
          
          <div className="mt-6 space-y-4">
            {/* Primary Email Auth Option */}
            <div className="text-center">
              <Link 
                to="/primary-email-auth"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                Use Primary Email System
                <ArrowRight className="h-3 w-3" />
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                For families using the new email management system
              </p>
            </div>
            
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setShowEmailResolution(false);
                  setResolvedEmail("");
                }}
                className="text-sm"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}