import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

// Gamification interfaces
interface UserPoints {
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  lastUpdated: Date;
}

interface UserLevel {
  userId: string;
  currentLevel: number;
  experiencePoints: number;
  pointsToNextLevel: number;
  levelProgress: number; // 0-100%
  lastLevelUp: Date | null;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'chores' | 'streaks' | 'points' | 'social' | 'special';
  pointsRequired: number;
  condition: string; // JSON string describing unlock condition
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  hidden: boolean; // Secret achievements
}

interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress: number; // 0-100%
  notified: boolean;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  points: number;
  level: number;
  rank: number;
  change: number; // Position change from last period
}

interface Streak {
  userId: string;
  type: 'daily' | 'weekly' | 'monthly';
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date;
  active: boolean;
}

interface PointTransaction {
  id: string;
  userId: string;
  points: number;
  reason: string;
  choreId?: string;
  achievementId?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

// Gamification system state management
interface GamificationState {
  // User Progress Data
  userPoints: Record<string, UserPoints>;
  userLevels: Record<string, UserLevel>;
  achievements: Achievement[];
  userAchievements: Record<string, UserAchievement[]>;
  streaks: Record<string, Streak[]>;
  pointTransactions: PointTransaction[];
  
  // Leaderboards
  familyLeaderboard: LeaderboardEntry[];
  globalLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  
  // UI State
  showLevelUpAnimation: boolean;
  showAchievementNotification: UserAchievement | null;
  celebrationQueue: Array<{ type: 'level' | 'achievement' | 'streak'; data: any }>;
  
  // Loading States
  loadingPoints: boolean;
  loadingAchievements: boolean;
  loadingLeaderboard: boolean;
  
  // Cache Management
  lastPointsUpdate: Date | null;
  lastLeaderboardUpdate: Date | null;
  
  // Actions - Points Management
  updatePoints: (userId: string, points: number, reason: string, metadata?: any) => Promise<void>;
  getPointsForUser: (userId: string) => UserPoints | null;
  calculateLevelProgress: (userId: string) => void;
  
  // Actions - Achievement System
  checkAchievements: (userId: string) => Promise<void>;
  unlockAchievement: (userId: string, achievementId: string) => Promise<void>;
  getUserAchievements: (userId: string) => UserAchievement[];
  getAchievementProgress: (userId: string, achievementId: string) => number;
  
  // Actions - Streak Management
  updateStreak: (userId: string, type: 'daily' | 'weekly' | 'monthly') => Promise<void>;
  getActiveStreaks: (userId: string) => Streak[];
  
  // Actions - Leaderboards
  updateLeaderboard: (familyId?: string) => Promise<void>;
  getUserRank: (userId: string, scope: 'family' | 'global' | 'weekly') => number;
  
  // Actions - Celebrations
  triggerLevelUp: (userId: string, newLevel: number) => void;
  triggerAchievementUnlock: (achievement: UserAchievement) => void;
  dismissNotification: () => void;
  triggerCelebration: (celebration: any) => void;
  
  // Utility Actions
  fetchUserData: (userId: string) => Promise<void>;
  refreshAll: (familyId?: string) => Promise<void>;
}

// Level calculation constants
const POINTS_PER_LEVEL = 100;
const LEVEL_MULTIPLIER = 1.2;

// Calculate required points for a level
const getPointsForLevel = (level: number): number => {
  return Math.floor(POINTS_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1));
};

// Calculate level from total points
const getLevelFromPoints = (points: number): { level: number; progress: number; pointsToNext: number } => {
  let level = 1;
  let totalPointsForLevel = 0;
  
  while (totalPointsForLevel <= points) {
    const pointsForCurrentLevel = getPointsForLevel(level);
    if (totalPointsForLevel + pointsForCurrentLevel > points) break;
    totalPointsForLevel += pointsForCurrentLevel;
    level++;
  }
  
  const pointsForCurrentLevel = getPointsForLevel(level);
  const pointsInCurrentLevel = points - totalPointsForLevel;
  const progress = (pointsInCurrentLevel / pointsForCurrentLevel) * 100;
  const pointsToNext = pointsForCurrentLevel - pointsInCurrentLevel;
  
  return { level, progress, pointsToNext };
};

export const useGamificationStore = create<GamificationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        userPoints: {},
        userLevels: {},
        achievements: [],
        userAchievements: {},
        streaks: {},
        pointTransactions: [],
        familyLeaderboard: [],
        globalLeaderboard: [],
        weeklyLeaderboard: [],
        showLevelUpAnimation: false,
        showAchievementNotification: null,
        celebrationQueue: [],
        loadingPoints: false,
        loadingAchievements: false,
        loadingLeaderboard: false,
        lastPointsUpdate: null,
        lastLeaderboardUpdate: null,

        // Points management
        updatePoints: async (userId: string, points: number, reason: string, metadata: any = {}) => {
          try {
            // Update points via progress_logs table for now
            const { error } = await supabase
              .from('progress_logs')
              .insert({
                user_id: userId,
                points_earned: points,
                action: reason,
                notes: JSON.stringify(metadata),
              });

            if (error) throw error;

            // Update local state optimistically
            const currentPoints = get().userPoints[userId] || {
              userId,
              currentPoints: 0,
              lifetimePoints: 0,
              weeklyPoints: 0,
              monthlyPoints: 0,
              lastUpdated: new Date(),
            };

            const newPoints = {
              ...currentPoints,
              currentPoints: currentPoints.currentPoints + points,
              lifetimePoints: currentPoints.lifetimePoints + points,
              weeklyPoints: currentPoints.weeklyPoints + points,
              monthlyPoints: currentPoints.monthlyPoints + points,
              lastUpdated: new Date(),
            };

            set(state => ({
              userPoints: {
                ...state.userPoints,
                [userId]: newPoints,
              },
              lastPointsUpdate: new Date(),
            }));

            // Log transaction
            const transaction: PointTransaction = {
              id: `${Date.now()}-${Math.random()}`,
              userId,
              points,
              reason,
              timestamp: new Date(),
              metadata,
            };

            set(state => ({
              pointTransactions: [transaction, ...state.pointTransactions.slice(0, 99)], // Keep last 100
            }));

            // Check for level up
            get().calculateLevelProgress(userId);
            
            // Check for achievements
            await get().checkAchievements(userId);

          } catch (error) {
            console.error('Error updating points:', error);
            throw error;
          }
        },

        getPointsForUser: (userId: string) => {
          return get().userPoints[userId] || null;
        },

        calculateLevelProgress: (userId: string) => {
          const pointsData = get().userPoints[userId];
          if (!pointsData) return;

          const { level, progress, pointsToNext } = getLevelFromPoints(pointsData.lifetimePoints);
          const currentLevel = get().userLevels[userId];

          const newLevel: UserLevel = {
            userId,
            currentLevel: level,
            experiencePoints: pointsData.lifetimePoints,
            pointsToNextLevel: pointsToNext,
            levelProgress: progress,
            lastLevelUp: currentLevel && currentLevel.currentLevel < level ? new Date() : currentLevel?.lastLevelUp || null,
          };

          set(state => ({
            userLevels: {
              ...state.userLevels,
              [userId]: newLevel,
            },
          }));

          // Trigger level up celebration if level increased
          if (currentLevel && currentLevel.currentLevel < level) {
            get().triggerLevelUp(userId, level);
          }
        },

        // Achievement system
        checkAchievements: async (userId: string) => {
          try {
            const achievements = get().achievements;
            const userPoints = get().userPoints[userId];
            const userAchievements = get().userAchievements[userId] || [];
            
            if (!userPoints) return;

            for (const achievement of achievements) {
              // Skip if already unlocked
              if (userAchievements.some(ua => ua.achievementId === achievement.id)) continue;

              let shouldUnlock = false;

              // Check achievement conditions
              switch (achievement.category) {
                case 'points':
                  shouldUnlock = userPoints.lifetimePoints >= achievement.pointsRequired;
                  break;
                
                case 'chores':
                  // Would check chore completion count
                  const choreCount = get().pointTransactions
                    .filter(t => t.userId === userId && t.reason.includes('chore'))
                    .length;
                  shouldUnlock = choreCount >= achievement.pointsRequired;
                  break;
                
                case 'streaks':
                  const streaks = get().streaks[userId] || [];
                  const maxStreak = Math.max(...streaks.map(s => s.currentStreak), 0);
                  shouldUnlock = maxStreak >= achievement.pointsRequired;
                  break;
              }

              if (shouldUnlock) {
                await get().unlockAchievement(userId, achievement.id);
              }
            }
          } catch (error) {
            console.error('Error checking achievements:', error);
          }
        },

        unlockAchievement: async (userId: string, achievementId: string) => {
          try {
            const { error } = await supabase
              .from('user_badges')
              .insert({
                user_id: userId,
                badge_id: achievementId,
              });

            if (error) throw error;

            const achievement = get().achievements.find(a => a.id === achievementId);
            if (!achievement) return;

            const userAchievement: UserAchievement = {
              userId,
              achievementId,
              unlockedAt: new Date(),
              progress: 100,
              notified: false,
            };

            set(state => ({
              userAchievements: {
                ...state.userAchievements,
                [userId]: [...(state.userAchievements[userId] || []), userAchievement],
              },
            }));

            // Award points for achievement
            await get().updatePoints(userId, achievement.pointsRequired, `Achievement: ${achievement.name}`);
            
            // Trigger celebration
            get().triggerAchievementUnlock(userAchievement);

          } catch (error) {
            console.error('Error unlocking achievement:', error);
          }
        },

        getUserAchievements: (userId: string) => {
          return get().userAchievements[userId] || [];
        },

        getAchievementProgress: (userId: string, achievementId: string) => {
          const userAchievement = get().userAchievements[userId]?.find(ua => ua.achievementId === achievementId);
          return userAchievement?.progress || 0;
        },

        // Streak management
        updateStreak: async (userId: string, type: 'daily' | 'weekly' | 'monthly') => {
          try {
            // For now, update streak locally only
            // In production, this would use a streaks table
            const userStreaks = get().streaks[userId] || [];
            const existingStreak = userStreaks.find(s => s.type === type);

            if (existingStreak) {
              existingStreak.currentStreak += 1;
              existingStreak.lastActivity = new Date();
              existingStreak.active = true;
              
              if (existingStreak.currentStreak > existingStreak.longestStreak) {
                existingStreak.longestStreak = existingStreak.currentStreak;
              }
            } else {
              const newStreak: Streak = {
                userId,
                type,
                currentStreak: 1,
                longestStreak: 1,
                lastActivity: new Date(),
                active: true,
              };
              userStreaks.push(newStreak);
            }

            set(state => ({
              streaks: {
                ...state.streaks,
                [userId]: userStreaks,
              },
            }));

          } catch (error) {
            console.error('Error updating streak:', error);
          }
        },

        getActiveStreaks: (userId: string) => {
          return get().streaks[userId]?.filter(s => s.active) || [];
        },

        // Leaderboard management
        updateLeaderboard: async (familyId?: string) => {
          try {
            set({ loadingLeaderboard: true });

            // For now, create mock leaderboard from profiles
            const { data, error } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, points, level')
              .order('points', { ascending: false })
              .limit(100);

            if (error) throw error;

            const leaderboard: LeaderboardEntry[] = (data || []).map((profile, index) => ({
              userId: profile.id,
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
              points: profile.points || 0,
              level: profile.level || 1,
              rank: index + 1,
              change: 0, // Would be calculated from previous rankings
            }));

            if (familyId) {
              set({
                familyLeaderboard: leaderboard,
                lastLeaderboardUpdate: new Date(),
                loadingLeaderboard: false,
              });
            } else {
              set({
                globalLeaderboard: leaderboard,
                lastLeaderboardUpdate: new Date(),
                loadingLeaderboard: false,
              });
            }
          } catch (error) {
            console.error('Error updating leaderboard:', error);
            set({ loadingLeaderboard: false });
          }
        },

        getUserRank: (userId: string, scope: 'family' | 'global' | 'weekly') => {
          const leaderboard = scope === 'family' ? get().familyLeaderboard :
                            scope === 'global' ? get().globalLeaderboard :
                            get().weeklyLeaderboard;
          
          const entry = leaderboard.find(e => e.userId === userId);
          return entry?.rank || 0;
        },

        // Celebration triggers
        triggerLevelUp: (userId: string, newLevel: number) => {
          set(state => ({
            celebrationQueue: [...state.celebrationQueue, { type: 'level', data: { userId, newLevel } }],
            showLevelUpAnimation: true,
          }));

          // Auto-dismiss after 3 seconds
          setTimeout(() => {
            set({ showLevelUpAnimation: false });
          }, 3000);
        },

        triggerAchievementUnlock: (achievement: UserAchievement) => {
          set({
            showAchievementNotification: achievement,
          });

          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            get().dismissNotification();
          }, 5000);
        },

        dismissNotification: () => {
          set({ showAchievementNotification: null });
        },

        // Utility functions
        fetchUserData: async (userId: string) => {
          try {
            // Fetch points data from profiles table
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('points, level')
              .eq('id', userId)
              .single();

            if (profileError && profileError.code !== 'PGRST116') throw profileError;

            if (profileData) {
              set(state => ({
                userPoints: {
                  ...state.userPoints,
                  [userId]: {
                    userId,
                    currentPoints: profileData.points || 0,
                    lifetimePoints: profileData.points || 0,
                    weeklyPoints: 0, // Would be calculated
                    monthlyPoints: 0, // Would be calculated
                    lastUpdated: new Date(),
                  },
                },
              }));
            }

            // Calculate level progress
            get().calculateLevelProgress(userId);

          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        },

        refreshAll: async (familyId?: string) => {
          const promises = [
            get().updateLeaderboard(familyId),
          ];

          await Promise.allSettled(promises);
        },
        
        triggerCelebration: (celebration: any) => {
          console.log('🎉 Celebration triggered:', celebration);
        },
      }),
      {
        name: 'gamification-store',
        partialize: (state) => ({
          userPoints: state.userPoints,
          userLevels: state.userLevels,
          userAchievements: state.userAchievements,
          streaks: state.streaks,
          lastPointsUpdate: state.lastPointsUpdate,
        }),
      }
    ),
    {
      name: 'gamification-store',
    }
  )
);