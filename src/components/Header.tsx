import { Button } from "@/components/ui/button";
import { Home, Star, Trophy, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  userType?: "kids" | "parents" | "admin";
  userName?: string;
  points?: number;
}

export function Header({ userType, userName, points }: HeaderProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  const getHeaderStyles = () => {
    switch (userType) {
      case "kids":
        return "bg-gradient-kids text-white";
      case "parents":
        return "bg-gradient-parents text-white";
      case "admin":
        return "bg-gradient-admin text-white";
      default:
        return "bg-background border-b";
    }
  };

  return (
    <header className={`p-4 ${getHeaderStyles()}`}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="text-2xl font-bold">
            🎯 ChoreQuest
          </div>
          {userName && (
            <div className="text-lg">
              Welcome back, {userName}!
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {userType === "kids" && points !== undefined && (
            <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
              <Star className="h-5 w-5 text-kids-accent" />
              <span className="font-bold">{points} XP</span>
            </div>
          )}
          
          <Button 
            variant={userType ? "outline" : "default"} 
            size="sm"
            onClick={handleHomeClick}
            className={userType ? "border-white/20 text-white hover:bg-white/10" : ""}
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>

          {userName && (
            <Button 
              variant={userType ? "outline" : "default"}
              size="sm"
              onClick={handleSignOut}
              className={userType ? "border-white/20 text-white hover:bg-white/10" : ""}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}