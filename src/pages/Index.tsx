import { PortalCard } from "@/components/PortalCard";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-kids-background/30">
      <Header />
      
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-rainbow bg-clip-text text-transparent animate-bounce-in">
            🎯 ChoreQuest
          </h1>
          <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
            Turn chores into an adventure! Gamified task management for families.
          </p>
          <div className="text-lg text-muted-foreground">
            Choose your portal to get started:
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PortalCard
            title="Kids Portal"
            description="Complete chores, earn points, and unlock amazing rewards!"
            icon="🎮"
            variant="kids"
            onClick={() => navigate("/kids")}
          />
          
          <PortalCard
            title="Parents Portal"
            description="Manage chores, track progress, and set up rewards for your children."
            icon="👨‍👩‍👧‍👦"
            variant="parents"
            onClick={() => navigate("/parents")}
          />
          
          <PortalCard
            title="Admin Panel"
            description="System administration, user management, and analytics dashboard."
            icon="⚙️"
            variant="admin"
            onClick={() => navigate("/admin")}
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
