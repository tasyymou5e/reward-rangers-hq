import { Header } from "@/components/Header";
import { ChoreCard } from "@/components/ChoreCard";
import { RewardBadge } from "@/components/RewardBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Zap } from "lucide-react";

export default function KidsPortal() {
  const mockChores = [
    {
      title: "Make Your Bed",
      description: "Tidy up your bedroom and make your bed neat",
      points: 10,
      timeEstimate: "5 min",
      difficulty: "easy" as const,
    },
    {
      title: "Take Out Trash",
      description: "Empty all trash bins and take them outside",
      points: 15,
      timeEstimate: "10 min",
      difficulty: "medium" as const,
    },
    {
      title: "Clean Your Room",
      description: "Organize toys, books, and clean up your space",
      points: 25,
      timeEstimate: "20 min",
      difficulty: "hard" as const,
    },
  ];

  const mockRewards = [
    {
      title: "Extra Screen Time",
      description: "30 minutes of extra tablet time",
      cost: 50,
      category: "Entertainment",
      available: true,
    },
    {
      title: "Special Treat",
      description: "Choose your favorite snack",
      cost: 30,
      category: "Food",
      available: true,
    },
    {
      title: "Stay Up Late",
      description: "Stay up 30 minutes past bedtime",
      cost: 75,
      category: "Privilege",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-kids-background">
      <Header userType="kids" userName="Alex" points={125} />
      
      <div className="container mx-auto p-6 space-y-8">
        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-kids-primary/10 to-kids-secondary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
              <Target className="h-4 w-4 text-kids-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2 of 5</div>
              <Progress value={40} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">Chores completed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-kids-accent/10 to-kids-success/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Streak</CardTitle>
              <Zap className="h-4 w-4 text-kids-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7 days 🔥</div>
              <p className="text-xs text-muted-foreground mt-2">Keep it up!</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-kids-success/10 to-kids-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level Progress</CardTitle>
              <Trophy className="h-4 w-4 text-kids-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Level 3</div>
              <Progress value={75} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">25 XP to Level 4</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Chores */}
        <section>
          <h2 className="text-3xl font-bold mb-6 text-kids-primary">🎯 Today's Chores</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockChores.map((chore, index) => (
              <ChoreCard
                key={index}
                {...chore}
                onComplete={() => console.log(`Completed: ${chore.title}`)}
              />
            ))}
          </div>
        </section>

        {/* Rewards Store */}
        <section>
          <h2 className="text-3xl font-bold mb-6 text-kids-primary">🎁 Rewards Store</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRewards.map((reward, index) => (
              <RewardBadge
                key={index}
                {...reward}
                onRedeem={() => console.log(`Redeemed: ${reward.title}`)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}