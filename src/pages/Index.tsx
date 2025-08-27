import { PortalCard } from "@/components/PortalCard";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { LogIn, UserPlus, Moon, Sun } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Auto-redirect authenticated users to their appropriate portal
  useEffect(() => {
    if (!loading && user && profile) {
      switch (profile.role) {
        case 'parent':
          navigate('/parents');
          break;
        case 'kid':
          navigate('/kids');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          // Stay on index page for unknown roles
          break;
      }
    }
  }, [user, profile, loading, navigate]);

  // Redirect based on user role if authenticated
  const handlePortalNavigation = (portal: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Check if user has permission for this portal
    if (portal === "kids" && profile?.role !== "kid") {
      navigate("/auth");
      return;
    }
    if (portal === "parents" && profile?.role !== "parent") {
      navigate("/auth");
      return;
    }
    if (portal === "admin") {
      navigate("/admin/auth");
      return;
    }
    
    navigate(`/${portal}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-kids-background/30">
      <Header />
      
      {/* Dark Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm border-2 hover:scale-110 transition-transform duration-200"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-yellow-500" />
          ) : (
            <Moon className="h-4 w-4 text-blue-600" />
          )}
        </Button>
      </div>
      
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-rainbow bg-clip-text text-transparent animate-bounce-in">
            🎯 ChoreQuest
          </h1>
          <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
            Turn chores into an adventure! Gamified task management for families.
          </p>
          <div className="text-lg text-muted-foreground">
            {user ? `Welcome back, ${profile?.display_name || 'Champion'}!` : 'Choose your portal to get started:'}
          </div>
          
          {!user && (
            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={() => navigate("/auth")} variant="default" size="lg">
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")} variant="outline" size="lg">
                <UserPlus className="h-5 w-5 mr-2" />
                Sign Up
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PortalCard
            title="Kids Portal"
            description="Complete chores, earn points, and unlock amazing rewards!"
            icon="🎮"
            variant="kids"
            onClick={() => handlePortalNavigation("kids")}
          />
          
          <PortalCard
            title="Parents Portal"
            description="Manage chores, track progress, and set up rewards for your children."
            icon="👨‍👩‍👧‍👦"
            variant="parents"
            onClick={() => handlePortalNavigation("parents")}
          />
          
          <PortalCard
            title="Admin Panel"
            description="System administration, user management, and analytics dashboard."
            icon="⚙️"
            variant="admin"
            onClick={() => handlePortalNavigation("admin")}
          />
        </div>

        <div className="text-center mt-16 space-y-4">
          <div className="text-sm text-muted-foreground">
            Secure • Kid-Friendly • Parent-Approved
          </div>
          <div className="flex justify-center space-x-8 text-4xl animate-float">
            🏆 ⭐ 🎉 🎁 🔥
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
