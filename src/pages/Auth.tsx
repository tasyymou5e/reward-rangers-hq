import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { secureLog } from "@/utils/secureLogging";

import { LogIn, UserPlus, Users, Crown, Shield } from "lucide-react";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("parent");
  const [loading, setLoading] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { secureSignIn, secureSignUp, isBlocked, authAttempts, maxAttempts, getRemainingBlockTime } = useSecureAuth();
  const { toast } = useToast();
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security: Check if user is temporarily blocked
    if (isBlocked) {
      const remainingTime = getRemainingBlockTime();
      toast({
        title: "Account Temporarily Blocked",
        description: `Too many failed attempts. Please wait ${Math.ceil(remainingTime / 60000)} minutes before trying again.`,
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
    
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        // Use secure signup with enhanced validation
        result = await secureSignUp(email, password, {
          display_name: displayName,
          username: username,
          role: role
        });
      } else {
        // Use secure signin with rate limiting and monitoring
        result = await secureSignIn(email, password);
      }

      if (result.error) {
        // Enhanced error handling with security consideration
        const sanitizedError = result.error.message.includes('rate limit') 
          ? "Authentication rate limit exceeded. Please wait before trying again."
          : result.error.message;
          
        toast({
          title: "Authentication Error",
          description: sanitizedError,
          variant: "destructive",
        });
        
        secureLog.warn("Authentication failed", { 
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          error: result.error.code 
        });
      } else {
        toast({
          title: isSignUp ? "Account Created!" : "Welcome Back!",
          description: isSignUp 
            ? "Please check your email to verify your account." 
            : "You've been successfully signed in.",
        });
        
        secureLog.info("Authentication successful", { 
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          type: isSignUp ? 'signup' : 'signin' 
        });
        
        // Redirect based on role
        if (!isSignUp) {
          navigate("/");
        }
      }
    } catch (error: any) {
      // Enhanced error handling with security logging
      secureLog.error("Authentication error", { 
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        error: error.message 
      });
      
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
                `Blocked (${Math.ceil(getRemainingBlockTime() / 60000)}m)`
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
          
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}