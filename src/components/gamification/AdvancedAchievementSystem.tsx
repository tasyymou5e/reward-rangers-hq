import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Zap, Crown, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGamificationStore } from '@/stores/gamificationStore';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  unlock_condition: any;
  reward_multiplier: number;
  chain_order?: number;
  parent_achievement_id?: string;
}

interface UserAchievement {
  id: string;
  badge_id: string;
  earned_at: string;
  user_id: string;
}

interface AchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
  progress: number;
  unlocked_at?: string;
  next_in_chain?: Achievement;
}

export const AdvancedAchievementSystem: React.FC<{ userId: string; familyId: string }> = ({ 
  userId, 
  familyId 
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  const { triggerCelebration } = useGamificationStore();

  useEffect(() => {
    fetchAchievements();
    fetchUserAchievements();
  }, [userId, familyId]);

  useEffect(() => {
    if (achievements.length > 0 && userAchievements.length >= 0) {
      calculateProgress();
    }
  }, [achievements, userAchievements]);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievement_chains')
        .select('*')
        .order('category', { ascending: true })
        .order('chain_order', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchUserAchievements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setUserAchievements(data || []);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = async () => {
    const progressData: AchievementProgress[] = [];

    for (const achievement of achievements) {
      const userAchievement = userAchievements.find(ua => ua.badge_id === achievement.id);
      const unlocked = !!userAchievement;
      
      let progress = 0;
      if (!unlocked) {
        progress = await calculateAchievementProgress(achievement);
      } else {
        progress = 100;
      }

      // Find next achievement in chain
      const nextInChain = achievements.find(a => 
        a.parent_achievement_id === achievement.id && 
        a.chain_order === (achievement.chain_order || 0) + 1
      );

      progressData.push({
        achievement,
        unlocked,
        progress,
        unlocked_at: userAchievement?.earned_at,
        next_in_chain: nextInChain
      });
    }

    setAchievementProgress(progressData);
  };

  const calculateAchievementProgress = async (achievement: Achievement): Promise<number> => {
    const condition = achievement.unlock_condition;
    
    try {
      switch (condition.type) {
        case 'chores_completed':
          const { data: chores } = await supabase
            .from('chores')
            .select('id')
            .eq('assigned_to', userId)
            .eq('status', 'completed');
          return Math.min((chores?.length || 0) / condition.target * 100, 100);

        case 'consecutive_days':
          // This would require streak tracking logic
          return 0; // Placeholder

        case 'points_earned':
          const { data: profile } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', userId)
            .single();
          return Math.min((profile?.points || 0) / condition.target * 100, 100);

        case 'specific_chore_category':
          const { data: categoryChores } = await supabase
            .from('chores')
            .select('id')
            .eq('assigned_to', userId)
            .eq('status', 'completed')
            .ilike('title', `%${condition.category}%`);
          return Math.min((categoryChores?.length || 0) / condition.target * 100, 100);

        default:
          return 0;
      }
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  };

  const checkForNewAchievements = async () => {
    const readyToUnlock = achievementProgress.filter(ap => 
      !ap.unlocked && ap.progress >= 100
    );

    for (const ap of readyToUnlock) {
      await unlockAchievement(ap.achievement);
    }
  };

  const unlockAchievement = async (achievement: Achievement) => {
    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: achievement.id,
          earned_at: new Date().toISOString()
        });

      if (error) throw error;

      // Trigger celebration animation
      triggerCelebration({
        type: 'achievement',
        title: `Achievement Unlocked!`,
        subtitle: achievement.name,
        points: Math.round(50 * achievement.reward_multiplier)
      });

      // Refresh data
      await fetchUserAchievements();
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  };

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'completion': return <Trophy className="h-5 w-5" />;
      case 'consistency': return <Target className="h-5 w-5" />;
      case 'speed': return <Zap className="h-5 w-5" />;
      case 'mastery': return <Crown className="h-5 w-5" />;
      case 'social': return <Star className="h-5 w-5" />;
      default: return <Gift className="h-5 w-5" />;
    }
  };

  const getAchievementColor = (category: string, unlocked: boolean) => {
    if (!unlocked) return 'border-muted-foreground/20 text-muted-foreground';
    
    switch (category) {
      case 'completion': return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      case 'consistency': return 'border-blue-500 text-blue-700 bg-blue-50';
      case 'speed': return 'border-green-500 text-green-700 bg-green-50';
      case 'mastery': return 'border-purple-500 text-purple-700 bg-purple-50';
      case 'social': return 'border-pink-500 text-pink-700 bg-pink-50';
      default: return 'border-gray-500 text-gray-700 bg-gray-50';
    }
  };

  const categories = ['all', ...new Set(achievements.map(a => a.category))];
  const filteredProgress = selectedCategory === 'all' 
    ? achievementProgress 
    : achievementProgress.filter(ap => ap.achievement.category === selectedCategory);

  const unlockedCount = achievementProgress.filter(ap => ap.unlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievement System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Advanced Achievement System
            </div>
            <Badge variant="secondary">
              {unlockedCount}/{totalCount} Unlocked
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{Math.round((unlockedCount / totalCount) * 100)}%</span>
              </div>
              <Progress value={(unlockedCount / totalCount) * 100} className="h-3" />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredProgress.map((ap) => (
          <Card 
            key={ap.achievement.id} 
            className={`border-2 transition-all duration-300 ${getAchievementColor(ap.achievement.category, ap.unlocked)}`}
          >
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${ap.unlocked ? 'bg-current/10' : 'bg-muted'}`}>
                  {getAchievementIcon(ap.achievement.category)}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {ap.achievement.name}
                        {ap.unlocked && <Crown className="h-4 w-4 text-yellow-500" />}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {ap.achievement.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="capitalize">
                        {ap.achievement.category}
                      </Badge>
                      {ap.achievement.reward_multiplier > 1 && (
                        <Badge variant="secondary" className="ml-2">
                          {ap.achievement.reward_multiplier}x reward
                        </Badge>
                      )}
                    </div>
                  </div>

                  {!ap.unlocked && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(ap.progress)}%</span>
                      </div>
                      <Progress value={ap.progress} className="h-2" />
                    </div>
                  )}

                  {ap.unlocked && ap.unlocked_at && (
                    <div className="text-sm text-muted-foreground">
                      Unlocked on {new Date(ap.unlocked_at).toLocaleDateString()}
                    </div>
                  )}

                  {ap.next_in_chain && ap.unlocked && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-dashed">
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4" />
                        <span className="font-medium">Next in Chain:</span>
                        <span>{ap.next_in_chain.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        onClick={checkForNewAchievements} 
        className="w-full"
        variant="outline"
      >
        Check for New Achievements
      </Button>
    </div>
  );
};