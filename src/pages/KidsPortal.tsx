import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Trophy, Clock, CheckCircle, Gift, Calendar as CalendarIcon, Timer, Sparkles, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChores } from "@/hooks/useChores";
import { useFamily } from "@/hooks/useFamily";
import { useWishlist } from "@/hooks/useWishlist";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WishlistCard } from "@/components/WishlistCard";
import { EnhancedWishlistForm } from "@/components/EnhancedWishlistForm";
import { ChoreTimer } from "@/components/ChoreTimer";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import { MiniGames } from "@/components/MiniGames";
import { MotivationJournal } from "@/components/MotivationJournal";
import { AffiliateDisplay } from "@/components/AffiliateDisplay";

export default function KidsPortal() {
  const { user, profile } = useAuth();
  const { chores, completeChore, loading: choresLoading } = useChores();
  const { family, familyMembers } = useFamily();
  const { wishlistItems, loading: wishlistLoading, addWishlistItem, achieveWishlistItem } = useWishlist();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [badges, setBadges] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [showMiniGames, setShowMiniGames] = useState(false);
  const [completedChoreInfo, setCompletedChoreInfo] = useState<{id: string, title: string} | null>(null);

  // Filter chores assigned to current user
  const myChores = chores.filter(chore => chore.assigned_to === user?.id);
  const todayChores = myChores.filter(chore => {
    if (!chore.due_date) return false;
    const choreDate = new Date(chore.due_date);
    const today = new Date();
    return choreDate.toDateString() === today.toDateString();
  });
  const completedChores = myChores.filter(chore => chore.status === 'completed');
  const pendingChores = myChores.filter(chore => chore.status === 'pending');

  // Calculate level based on points
  const getLevel = (points: number) => Math.floor(points / 100) + 1;
  const getPointsToNextLevel = (points: number) => 100 - (points % 100);

  useEffect(() => {
    fetchBadges();
    fetchUserBadges();
    fetchRewards();
  }, [user]);

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('points_required');
      
      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const fetchUserBadges = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      setUserBadges(data || []);
    } catch (error) {
      console.error('Error fetching user badges:', error);
    }
  };

  const fetchRewards = async () => {
    if (!family?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('family_id', family.id)
        .eq('status', 'available')
        .order('points_cost');
      
      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  };

  const handleCompleteChore = async (choreId: string) => {
    try {
      const chore = myChores.find(c => c.id === choreId);
      await completeChore(choreId);
      
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Show mini games after completion
      setCompletedChoreInfo({ id: choreId, title: chore?.title || 'Chore' });
      setShowMiniGames(true);
      
      toast({
        title: "🎉 Chore Completed!",
        description: `You earned ${chore?.points_value || 0} points! Play a game to earn bonus points!`,
      });
      
      // Check for new badges
      await checkForNewBadges();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not complete chore. Try again!",
        variant: "destructive",
      });
    }
  };

  const handleGameComplete = (bonusPoints: number) => {
    toast({
      title: "🎮 Bonus Points!",
      description: `You earned ${bonusPoints} bonus XP from the game!`,
    });
  };

  const checkForNewBadges = async () => {
    if (!user || !profile) return;
    
    // Check for first chore badge
    if (completedChores.length === 1) {
      await awardBadge('First Chore');
    }
    
    // Check for chore master badge (10 completed)
    if (completedChores.length >= 10) {
      await awardBadge('Chore Master');
    }
  };

  const awardBadge = async (badgeName: string) => {
    try {
      const badge = badges.find(b => b.name === badgeName);
      if (!badge) return;
      
      // Check if user already has this badge
      const hasBadge = userBadges.some(ub => ub.badges.name === badgeName);
      if (hasBadge) return;
      
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user?.id,
          badge_id: badge.id,
        });
      
      if (error) throw error;
      
      await fetchUserBadges();
      toast({
        title: "🏆 New Badge Earned!",
        description: `You earned the ${badgeName} badge!`,
      });
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || !profile) return;
    
    if (profile.points < reward.points_cost) {
      toast({
        title: "Not Enough Points",
        description: `You need ${reward.points_cost - profile.points} more points!`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update reward status to pending approval
      await supabase
        .from('rewards')
        .update({
          status: 'pending_approval',
          redeemed_by: user?.id,
          redeemed_at: new Date().toISOString(),
        })
        .eq('id', rewardId);
      
      // Deduct points from user
      await supabase
        .from('profiles')
        .update({
          points: profile.points - reward.points_cost,
        })
        .eq('id', user?.id);
      
      toast({
        title: "🎁 Reward Requested!",
        description: "Your parent will approve your reward soon!",
      });
      
      await fetchRewards();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not redeem reward. Try again!",
        variant: "destructive",
      });
    }
  };

  const getChoreEmoji = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "😊";
      case "medium": return "🤔";
      case "hard": return "💪";
      default: return "⭐";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "hard": return "bg-red-500";
      default: return "bg-blue-500";
    }
  };

  if (choresLoading) {
    return (
      <div className="min-h-screen bg-kids-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-spin">🌟</div>
          <p className="text-xl font-bold text-kids-primary">Loading your adventures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kids-background relative overflow-hidden">
      {showConfetti && <ConfettiEffect />}
      
      <Header userType="kids" userName={profile?.display_name || "Champion"} />
      
      <div className="container mx-auto p-4 space-y-6">
        {/* Hero Stats */}
        <Card className="bg-gradient-kids border-0 text-white shadow-kids">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-kids-accent text-white text-xl font-bold">
                  {profile?.display_name?.charAt(0) || "🌟"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  Hey {profile?.display_name}! 👋
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{profile?.points || 0}</div>
                    <div className="text-sm opacity-90">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">Level {getLevel(profile?.points || 0)}</div>
                    <div className="text-sm opacity-90">
                      {getPointsToNextLevel(profile?.points || 0)} to next
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{userBadges.length}</div>
                    <div className="text-sm opacity-90">Badges</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Level Progress</span>
                <span>{profile?.points || 0} / {Math.ceil((profile?.points || 0) / 100) * 100}</span>
              </div>
              <Progress 
                value={((profile?.points || 0) % 100)} 
                className="h-3 bg-white/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mini Games and Journal Action Bar */}
        <div className="flex gap-4 justify-center">
          <MotivationJournal />
          <Button 
            variant="outline" 
            className="border-kids-secondary text-kids-secondary hover:bg-kids-secondary hover:text-white"
            onClick={() => setShowMiniGames(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Play Games
          </Button>
        </div>

        <Tabs defaultValue="chores" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-md">
            <TabsTrigger value="chores" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Chores
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chores" className="space-y-6">
            {/* Today's Chores */}
            <section>
              <h3 className="text-2xl font-bold text-kids-primary mb-4 flex items-center gap-2">
                🌅 Today's Adventures
              </h3>
              
              {todayChores.length === 0 ? (
                <Card className="bg-white text-center p-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h4 className="text-xl font-bold text-kids-primary mb-2">
                    No chores for today!
                  </h4>
                  <p className="text-muted-foreground">Enjoy your free time!</p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {todayChores.map((chore) => (
                    <Card 
                      key={chore.id} 
                      className="bg-white hover:shadow-kids hover:scale-105 transform transition-bounce"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {getChoreEmoji(chore.difficulty)} {chore.title}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge className={`${getDifficultyColor(chore.difficulty)} text-white`}>
                              {chore.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-kids-accent">
                              <Star className="h-3 w-3 mr-1" />
                              {chore.points_value} XP
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {chore.description && (
                          <p className="text-muted-foreground">{chore.description}</p>
                        )}
                        
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          {chore.estimated_time_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {chore.estimated_time_minutes} min
                            </div>
                          )}
                          {chore.due_date && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              Due today
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {activeTimer === chore.id ? (
                            <ChoreTimer 
                              choreId={chore.id}
                              duration={chore.estimated_time_minutes || 15}
                              onComplete={() => {
                                setActiveTimer(null);
                                handleCompleteChore(chore.id);
                              }}
                              onStop={() => setActiveTimer(null)}
                            />
                          ) : chore.status === 'completed' ? (
                            <Button disabled className="w-full bg-green-500 text-white">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completed! 🎉
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="kids" 
                                onClick={() => handleCompleteChore(chore.id)}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete
                              </Button>
                              {chore.estimated_time_minutes && (
                                <Button
                                  variant="outline"
                                  onClick={() => setActiveTimer(chore.id)}
                                  size="icon"
                                >
                                  <Timer className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* All Chores */}
            <section>
              <h3 className="text-2xl font-bold text-kids-primary mb-4 flex items-center gap-2">
                📋 All My Chores
              </h3>
              
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {myChores.map((chore) => (
                  <Card 
                    key={chore.id} 
                    className={`bg-white hover:shadow-kids hover:scale-105 transform transition-bounce ${
                      chore.status === 'completed' ? 'bg-green-50 border-green-200' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold flex items-center gap-2">
                          {getChoreEmoji(chore.difficulty)} {chore.title}
                        </h4>
                        <Badge variant="outline" className="text-kids-accent">
                          <Star className="h-3 w-3 mr-1" />
                          {chore.points_value}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Badge className={`${getDifficultyColor(chore.difficulty)} text-white text-xs`}>
                          {chore.difficulty}
                        </Badge>
                        
                        <Badge 
                          className={`text-xs ${
                            chore.status === 'completed' ? 'bg-green-500 text-white' :
                            chore.status === 'in_progress' ? 'bg-yellow-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}
                        >
                          {chore.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="wishlist" className="space-y-6">
            <h3 className="text-2xl font-bold text-kids-primary mb-4 flex items-center gap-2">
              💝 My Wishlist
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <EnhancedWishlistForm onSubmit={addWishlistItem} isLoading={wishlistLoading} />
              
              {wishlistItems.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  userPoints={profile?.points || 0}
                  onAchieve={achieveWishlistItem}
                />
              ))}
            </div>
            
            {wishlistItems.length === 0 && !wishlistLoading && (
              <Card className="bg-gradient-to-br from-kids-accent/10 to-kids-secondary/10">
                <CardContent className="p-8 text-center">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-kids-accent" />
                  <h3 className="text-xl font-bold mb-2">Your Wishlist is Empty!</h3>
                  <p className="text-muted-foreground">
                    Add your first wish to start setting goals and earning rewards!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <h3 className="text-2xl font-bold text-kids-primary mb-4 flex items-center gap-2">
              🎁 Awesome Rewards
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => (
                <Card 
                  key={reward.id} 
                  className="bg-gradient-to-br from-kids-accent/10 to-kids-secondary/10 hover:shadow-glow hover:scale-105 transform transition-bounce"
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="text-4xl animate-float">🎁</div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-lg">{reward.title}</h4>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{reward.category}</Badge>
                      <div className="flex items-center gap-1 text-kids-accent font-bold">
                        <Star className="h-4 w-4" />
                        {reward.points_cost} XP
                      </div>
                    </div>
                    
                    <Button 
                      variant="reward" 
                      size="sm" 
                      disabled={(profile?.points || 0) < reward.points_cost}
                      onClick={() => handleRedeemReward(reward.id)}
                      className="w-full"
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      {(profile?.points || 0) >= reward.points_cost ? "Redeem!" : "Need More XP"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Affiliate Partners */}
            <AffiliateDisplay 
              title="🛍️ Cool Stores" 
              description="Check out these awesome stores where you can spend your points!"
            />
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            <h3 className="text-2xl font-bold text-kids-primary mb-4 flex items-center gap-2">
              🏆 My Badges
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => {
                const earned = userBadges.some(ub => ub.badges.id === badge.id);
                
                return (
                  <Card 
                    key={badge.id} 
                    className={`text-center p-6 ${
                      earned 
                        ? 'bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-300 shadow-glow' 
                        : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <CardContent className="space-y-4">
                      <div className={`text-4xl ${earned ? 'animate-bounce' : 'grayscale'}`}>
                        {badge.icon || '🏆'}
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-bold text-lg">{badge.name}</h4>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                      
                      {earned ? (
                        <Badge className="bg-yellow-500 text-white">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Earned!
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Not earned yet
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <h3 className="text-2xl font-bold text-kids-primary mb-4 flex items-center gap-2">
              📅 My Schedule
            </h3>
            
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>
                    {selectedDate ? selectedDate.toDateString() : 'Select a date'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate && (
                    <div className="space-y-3">
                      {myChores
                        .filter(chore => {
                          if (!chore.due_date) return false;
                          const choreDate = new Date(chore.due_date);
                          return choreDate.toDateString() === selectedDate.toDateString();
                        })
                        .map(chore => (
                          <div 
                            key={chore.id}
                            className="flex items-center gap-3 p-3 border rounded-lg"
                          >
                            <div className="text-xl">
                              {getChoreEmoji(chore.difficulty)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{chore.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {chore.points_value} points
                              </div>
                            </div>
                            <Badge 
                              className={
                                chore.status === 'completed' ? 'bg-green-500 text-white' :
                                chore.status === 'in_progress' ? 'bg-yellow-500 text-white' :
                                'bg-gray-500 text-white'
                              }
                            >
                              {chore.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      
                      {myChores.filter(chore => {
                        if (!chore.due_date) return false;
                        const choreDate = new Date(chore.due_date);
                        return choreDate.toDateString() === selectedDate.toDateString();
                      }).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="text-4xl mb-2">🌟</div>
                          No chores for this day!
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Mini Games Modal */}
        <MiniGames
          isOpen={showMiniGames}
          onClose={() => {
            setShowMiniGames(false);
            setCompletedChoreInfo(null);
          }}
          onComplete={handleGameComplete}
          choreTitle={completedChoreInfo?.title}
        />
      </div>
    </div>
  );
}