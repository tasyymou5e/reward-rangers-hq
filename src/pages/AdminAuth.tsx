import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff, AlertTriangle, ArrowLeft } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";


export default function AdminAuth() {
  const { user, loading, signIn } = useAdminAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated as admin
  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        toast({
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome Admin",
          description: "Successfully authenticated",
        });
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-admin-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-spin">⚙️</div>
          <p className="text-xl font-bold text-admin-primary">Initializing admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-admin flex items-center justify-center p-4 relative">
      {/* Back to home button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
      
      <Card className="w-full max-w-md shadow-2xl border-2 border-white/20 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-gradient-admin rounded-full flex items-center justify-center shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-admin-primary">
              Admin Login
            </CardTitle>
            <p className="text-admin-primary/70 mt-2 text-sm">
              Secure access for system administrators only
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 p-4 bg-admin-accent/10 border border-admin-accent/30 rounded-lg">
            <div className="flex items-center gap-2 text-admin-accent">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Restricted Access</span>
            </div>
            <p className="text-xs text-admin-primary/70 mt-1">
              This portal is reserved for authorized administrators only. Unauthorized access is prohibited and monitored.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-admin-primary font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 focus:border-admin-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-admin-primary font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-2 focus:border-admin-primary pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>


            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-admin hover:opacity-90 text-white shadow-lg transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Access Admin Portal
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-admin-primary/20 text-center">
            <p className="text-xs text-admin-primary/60">
              🔒 Protected by enterprise-grade security
            </p>
            <p className="text-xs text-admin-primary/50 mt-1">
              All access attempts are logged and monitored
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}