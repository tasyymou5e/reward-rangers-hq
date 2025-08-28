import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PasswordValidation } from "@/components/PasswordValidation";
import { CaptchaWidget } from "@/components/CaptchaWidget";
import { LogIn, UserPlus, Users, Crown, Shield, RefreshCcw } from "lucide-react";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("parent");
  const [loading, setLoading] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(true);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError(null);
  };

  const handleCaptchaError = (error: string) => {
    setCaptchaError(error);
    setCaptchaToken(null);
    toast({
      title: "Captcha Error",
      description: "Please complete the security verification again.",
      variant: "destructive",
    });
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
    setCaptchaError(null);
  };

  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaError(null);
    setShowCaptcha(false);
    setTimeout(() => setShowCaptcha(true), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced password validation for signup
    if (isSignUp && !isPasswordValid) {
      toast({
        title: "Password Requirements",
        description: "Please ensure your password meets all security requirements.",
        variant: "destructive",
      });
      return;
    }

    // Require captcha verification
    if (!captchaToken) {
      toast({
        title: "Security Verification Required",
        description: "Please complete the captcha verification to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password, {
          display_name: displayName,
          username: username,
          role: role
        }, captchaToken);
      } else {
        result = await signIn(email, password, captchaToken);
      }

      if (result.error) {
        // Handle captcha-specific errors
        if (result.error.message.includes('captcha')) {
          setCaptchaError('Captcha verification failed');
          resetCaptcha();
          toast({
            title: "Security Verification Failed",
            description: "Please complete the captcha verification again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Authentication Error",
            description: result.error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: isSignUp ? "Account Created!" : "Welcome Back!",
          description: isSignUp 
            ? "Please check your email to verify your account." 
            : "You've been successfully signed in.",
        });
        
        // Redirect based on role
        if (!isSignUp) {
          navigate("/");
        }
      }
    } catch (error: any) {
      // Reset captcha on any error
      resetCaptcha();
      toast({
        title: "Error",
        description: error.message,
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
                <PasswordValidation 
                  password={password} 
                  onValidationChange={setIsPasswordValid}
                />
              )}
            </div>

            {/* Captcha Security Verification */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Security Verification</Label>
              <div className="flex flex-col space-y-2">
                <CaptchaWidget
                  onVerify={handleCaptchaVerify}
                  onError={handleCaptchaError}
                  onExpire={handleCaptchaExpire}
                  visible={showCaptcha}
                  className="flex justify-center"
                />
                {captchaError && (
                  <div className="flex items-center justify-between text-sm text-destructive">
                    <span>Verification failed</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetCaptcha}
                      className="h-auto p-1 text-xs"
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}
                {captchaToken && (
                  <div className="text-sm text-success flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    Security verification completed
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !captchaToken}
              variant={isSignUp ? "default" : "default"}
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  {isSignUp ? <UserPlus className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                  {isSignUp ? "Create Account" : "Sign In"}
                </>
              )}
            </Button>
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