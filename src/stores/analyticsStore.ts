import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

// Analytics interfaces
interface DailyAnalytics {
  date: string;
  activeUsers: number;
  newUsers: number;
  choresCompleted: number;
  pointsEarned: number;
  sessionDuration: number;
}

interface EngagementMetrics {
  userId: string;
  date: string;
  sessionCount: number;
  totalDuration: number;
  choresCompleted: number;
  pointsEarned: number;
  achievementsUnlocked: number;
}

interface RetentionData {
  cohort: string;
  day0: number;
  day1: number;
  day7: number;
  day30: number;
}

interface DateRange {
  start: string;
  end: string;
}

// Analytics state management
interface AnalyticsState {
  // Cached Data
  dailyAnalytics: DailyAnalytics[];
  engagementMetrics: EngagementMetrics[];
  userRetention: RetentionData[];
  
  // UI State
  dateRange: DateRange;
  selectedMetric: string;
  loading: Record<string, boolean>;
  
  // Cache Management
  lastFetch: Record<string, Date>;
  
  // Actions
  fetchDailyAnalytics: (dateRange: DateRange) => Promise<void>;
  fetchEngagementMetrics: (familyId?: string) => Promise<void>;
  fetchRetentionData: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  
  setDateRange: (range: DateRange) => void;
  setSelectedMetric: (metric: string) => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        dailyAnalytics: [],
        engagementMetrics: [],
        userRetention: [],
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
        selectedMetric: 'activeUsers',
        loading: {},
        lastFetch: {},

        // Fetch daily analytics
        fetchDailyAnalytics: async (dateRange: DateRange) => {
          try {
            set(state => ({ loading: { ...state.loading, dailyAnalytics: true } }));

            // Mock analytics data for now
            const mockData: DailyAnalytics[] = [];
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              mockData.push({
                date: d.toISOString().split('T')[0],
                activeUsers: Math.floor(Math.random() * 50) + 10,
                newUsers: Math.floor(Math.random() * 10),
                choresCompleted: Math.floor(Math.random() * 100) + 20,
                pointsEarned: Math.floor(Math.random() * 1000) + 200,
                sessionDuration: Math.floor(Math.random() * 30) + 10,
              });
            }

            set(state => ({
              dailyAnalytics: mockData,
              loading: { ...state.loading, dailyAnalytics: false },
              lastFetch: { ...state.lastFetch, dailyAnalytics: new Date() },
            }));
          } catch (error) {
            console.error('Error fetching daily analytics:', error);
            set(state => ({ loading: { ...state.loading, dailyAnalytics: false } }));
          }
        },

        fetchEngagementMetrics: async (familyId?: string) => {
          try {
            set(state => ({ loading: { ...state.loading, engagement: true } }));

            // In production, this would fetch real engagement data
            const mockMetrics: EngagementMetrics[] = [];
            
            set(state => ({
              engagementMetrics: mockMetrics,
              loading: { ...state.loading, engagement: false },
              lastFetch: { ...state.lastFetch, engagement: new Date() },
            }));
          } catch (error) {
            console.error('Error fetching engagement metrics:', error);
            set(state => ({ loading: { ...state.loading, engagement: false } }));
          }
        },

        fetchRetentionData: async () => {
          try {
            set(state => ({ loading: { ...state.loading, retention: true } }));

            // Mock retention data
            const mockRetention: RetentionData[] = [
              { cohort: '2024-01', day0: 100, day1: 80, day7: 65, day30: 45 },
              { cohort: '2024-02', day0: 100, day1: 85, day7: 70, day30: 50 },
            ];

            set(state => ({
              userRetention: mockRetention,
              loading: { ...state.loading, retention: false },
              lastFetch: { ...state.lastFetch, retention: new Date() },
            }));
          } catch (error) {
            console.error('Error fetching retention data:', error);
            set(state => ({ loading: { ...state.loading, retention: false } }));
          }
        },

        refreshAnalytics: async () => {
          const { dateRange } = get();
          await Promise.all([
            get().fetchDailyAnalytics(dateRange),
            get().fetchEngagementMetrics(),
            get().fetchRetentionData(),
          ]);
        },

        setDateRange: (range: DateRange) => set({ dateRange: range }),
        setSelectedMetric: (metric: string) => set({ selectedMetric: metric }),
      }),
      {
        name: 'analytics-store',
        partialize: (state) => ({
          dateRange: state.dateRange,
          selectedMetric: state.selectedMetric,
        }),
      }
    ),
    {
      name: 'analytics-store',
    }
  )
);