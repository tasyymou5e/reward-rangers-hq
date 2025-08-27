import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAnalyticsData() {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    totalUsers: 0,
    totalFamilies: 0,
    totalChores: 0,
    completedChores: 0,
    completionRate: 0,
    activeUsers: 0,
    averageSessionTime: 25,
    topPerformer: "Loading..."
  });

  const [userGrowthData, setUserGrowthData] = useState([]);
  const [choreCompletionData, setChoreCompletionData] = useState([]);
  const [familyEngagementData, setFamilyEngagementData] = useState([]);
  const [systemPerformanceData, setSystemPerformanceData] = useState([]);
  const [userActivityData, setUserActivityData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [conversionData, setConversionData] = useState([]);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadKPIData(),
        loadUserGrowthData(),
        loadChoreCompletionData(),
        loadFamilyEngagementData(),
        loadSystemPerformanceData(),
        loadUserActivityData(),
        loadRevenueData(),
        loadConversionData()
      ]);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKPIData = async () => {
    try {
      const [users, families, chores, completedChores, activeUsers] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('families').select('id', { count: 'exact', head: true }),
        supabase.from('chores').select('id', { count: 'exact', head: true }),
        supabase.from('chores').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .gte('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Get top performer
      const { data: topPerformerData } = await supabase
        .from('progress_logs')
        .select('user_id, points_earned, profiles(display_name)')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('points_earned', { ascending: false })
        .limit(1);

      const totalUsers = users.count || 0;
      const totalChores = chores.count || 0;
      const completed = completedChores.count || 0;

      setKpiData({
        totalUsers,
        totalFamilies: families.count || 0,
        totalChores,
        completedChores: completed,
        completionRate: totalChores > 0 ? Math.round((completed / totalChores) * 100) : 0,
        activeUsers: activeUsers.count || 0,
        averageSessionTime: 25, // Mock data for now
        topPerformer: topPerformerData?.[0]?.profiles?.display_name || "No data"
      });
    } catch (error) {
      console.error('Error loading KPI data:', error);
    }
  };

  const loadUserGrowthData = async () => {
    try {
      // Generate mock data based on real user count
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const baseUsers = Math.max(count || 0, 10);
      
      const mockData = months.map((month, index) => ({
        month,
        users: Math.floor(baseUsers * (0.3 + index * 0.15)),
        activeUsers: Math.floor(baseUsers * (0.2 + index * 0.12))
      }));

      setUserGrowthData(mockData as any);
    } catch (error) {
      console.error('Error loading user growth data:', error);
    }
  };

  const loadChoreCompletionData = async () => {
    try {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const { count: totalChores } = await supabase
        .from('chores')
        .select('id', { count: 'exact', head: true });

      const { count: completedChores } = await supabase
        .from('chores')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed');

      const base = Math.max(totalChores || 0, 20);
      
      const mockData = weeks.map((week, index) => ({
        week,
        assigned: Math.floor(base * (0.8 + index * 0.05)),
        completed: Math.floor(base * (0.6 + index * 0.08))
      }));

      setChoreCompletionData(mockData as any);
    } catch (error) {
      console.error('Error loading chore completion data:', error);
    }
  };

  const loadFamilyEngagementData = async () => {
    try {
      const { data: families } = await supabase
        .from('families')
        .select('name')
        .limit(5);

      const mockData = (families || []).map((family, index) => ({
        family: family.name,
        choresCompleted: Math.floor(Math.random() * 50) + 10,
        pointsEarned: Math.floor(Math.random() * 500) + 100,
        messagesExchanged: Math.floor(Math.random() * 30) + 5
      }));

      setFamilyEngagementData(mockData as any);
    } catch (error) {
      console.error('Error loading family engagement data:', error);
    }
  };

  const loadSystemPerformanceData = async () => {
    const times = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const mockData = times.map(time => ({
      time,
      responseTime: Math.floor(Math.random() * 200) + 50,
      activeConnections: Math.floor(Math.random() * 100) + 20,
      errorRate: Math.random() * 2
    }));

    setSystemPerformanceData(mockData as any);
  };

  const loadUserActivityData = async () => {
    const mockData = [
      { name: 'Parents', value: 45 },
      { name: 'Kids', value: 35 },
      { name: 'Admins', value: 15 },
      { name: 'Inactive', value: 5 }
    ];

    setUserActivityData(mockData as any);
  };

  const loadRevenueData = async () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const mockData = months.map((month, index) => ({
      month,
      revenue: Math.floor(Math.random() * 5000) + 1000 + (index * 500)
    }));

    setRevenueData(mockData as any);
  };

  const loadConversionData = async () => {
    const mockData = [
      { stage: 'Signup', rate: 100 },
      { stage: 'Email Verified', rate: 85 },
      { stage: 'Family Created', rate: 72 },
      { stage: 'First Chore', rate: 65 },
      { stage: 'Week 1 Active', rate: 45 },
      { stage: 'Month 1 Retention', rate: 32 }
    ];

    setConversionData(mockData as any);
  };

  return {
    loading,
    kpiData,
    userGrowthData,
    choreCompletionData,
    familyEngagementData,
    systemPerformanceData,
    userActivityData,
    revenueData,
    conversionData,
    refreshData: loadAnalyticsData
  };
}