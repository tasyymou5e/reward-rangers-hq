import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// DatePickerWithRange component would need to be implemented
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  Star, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import { addDays, format, subDays } from 'date-fns';

interface FamilyStats {
  totalFamilies: number;
  activeFamilies: number;
  totalMembers: number;
  averageMembersPerFamily: number;
  growthRate: number;
  churnRate: number;
}

interface ChartData {
  name: string;
  value: number;
  date?: string;
  families?: number;
  members?: number;
  chores?: number;
  points?: number;
}

interface EngagementMetric {
  familyId: string;
  familyName: string;
  totalMembers: number;
  activeMembers: number;
  choreCompletionRate: number;
  avgPointsPerMember: number;
  lastActivity: string;
  engagementScore: number;
}

interface FamilyAnalyticsDashboardProps {
  familyId?: string; // Optional: show analytics for specific family
}

export function FamilyAnalyticsDashboard({ familyId }: FamilyAnalyticsDashboardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
  const [growthData, setGrowthData] = useState<ChartData[]>([]);
  const [engagementData, setEngagementData] = useState<ChartData[]>([]);
  const [distributionData, setDistributionData] = useState<ChartData[]>([]);
  const [topFamilies, setTopFamilies] = useState<EngagementMetric[]>([]);
  const [activityHeatmap, setActivityHeatmap] = useState<ChartData[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, familyId]);

  useEffect(() => {
    // Update date range when timeframe changes
    const now = new Date();
    switch (timeframe) {
      case '7d':
        setDateRange({ from: subDays(now, 7), to: now });
        break;
      case '30d':
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case '90d':
        setDateRange({ from: subDays(now, 90), to: now });
        break;
    }
  }, [timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFamilyStats(),
        loadGrowthData(),
        loadEngagementData(),
        loadDistributionData(),
        loadTopFamilies(),
        loadActivityHeatmap()
      ]);
    } catch (error) {
      toast({
        title: 'Error loading analytics',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyStats = async () => {
    const { data: families } = await supabase
      .from('families')
      .select('id, created_at, parent_id')
      .gte('created_at', dateRange?.from?.toISOString())
      .lte('created_at', dateRange?.to?.toISOString());

    const { data: members } = await supabase
      .from('family_members')
      .select('family_id, user_id, joined_at');

    const totalFamilies = families?.length || 0;
    const totalMembers = members?.length || 0;
    const averageMembersPerFamily = totalFamilies > 0 ? totalMembers / totalFamilies : 0;

    // Calculate growth rate (simplified)
    const previousPeriodStart = subDays(dateRange?.from || new Date(), 
      Math.floor((dateRange?.to?.getTime() || 0) - (dateRange?.from?.getTime() || 0)) / (1000 * 60 * 60 * 24)
    );
    
    const { data: previousFamilies } = await supabase
      .from('families')
      .select('id')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', dateRange?.from?.toISOString());

    const previousCount = previousFamilies?.length || 0;
    const growthRate = previousCount > 0 ? ((totalFamilies - previousCount) / previousCount) * 100 : 0;

    setFamilyStats({
      totalFamilies,
      activeFamilies: totalFamilies, // Simplified - could add activity criteria
      totalMembers,
      averageMembersPerFamily,
      growthRate,
      churnRate: 0 // Would need to calculate based on inactive families
    });
  };

  const loadGrowthData = async () => {
    const days = Math.floor((dateRange?.to?.getTime() || 0) - (dateRange?.from?.getTime() || 0)) / (1000 * 60 * 60 * 24);
    const interval = Math.max(1, Math.floor(days / 20)); // Max 20 data points

    const data: ChartData[] = [];
    
    for (let i = 0; i <= days; i += interval) {
      const date = addDays(dateRange?.from || new Date(), i);
      
      const { data: families } = await supabase
        .from('families')
        .select('id')
        .lte('created_at', date.toISOString());

      const { data: members } = await supabase
        .from('family_members')
        .select('id')
        .lte('joined_at', date.toISOString());

      data.push({
        name: format(date, 'MMM dd'),
        date: date.toISOString(),
        families: families?.length || 0,
        members: members?.length || 0,
        value: families?.length || 0
      });
    }

    setGrowthData(data);
  };

  const loadEngagementData = async () => {
    // Load chore completion data
    const { data: chores } = await supabase
      .from('chores')
      .select('created_at, completed_at, points_value')
      .gte('created_at', dateRange?.from?.toISOString())
      .lte('created_at', dateRange?.to?.toISOString());

    // Group by day
    const dailyEngagement: Record<string, { chores: number; points: number }> = {};
    
    chores?.forEach(chore => {
      const date = format(new Date(chore.created_at), 'yyyy-MM-dd');
      if (!dailyEngagement[date]) {
        dailyEngagement[date] = { chores: 0, points: 0 };
      }
      dailyEngagement[date].chores++;
      if (chore.completed_at) {
        dailyEngagement[date].points += chore.points_value || 0;
      }
    });

    const data = Object.entries(dailyEngagement).map(([date, metrics]) => ({
      name: format(new Date(date), 'MMM dd'),
      date,
      chores: metrics.chores,
      points: metrics.points,
      value: metrics.chores
    }));

    setEngagementData(data.sort((a, b) => a.date.localeCompare(b.date)));
  };

  const loadDistributionData = async () => {
    const { data: families } = await supabase
      .from('families')
      .select(`
        id,
        name,
        family_members(count)
      `);

    const distribution: Record<string, number> = {
      '1 member': 0,
      '2-3 members': 0,
      '4-5 members': 0,
      '6+ members': 0
    };

    families?.forEach(family => {
      const memberCount = family.family_members?.length || 0;
      if (memberCount === 1) {
        distribution['1 member']++;
      } else if (memberCount <= 3) {
        distribution['2-3 members']++;
      } else if (memberCount <= 5) {
        distribution['4-5 members']++;
      } else {
        distribution['6+ members']++;
      }
    });

    setDistributionData(
      Object.entries(distribution).map(([name, value]) => ({ name, value }))
    );
  };

  const loadTopFamilies = async () => {
    const { data: families } = await supabase
      .from('families')
      .select(`
        id,
        name,
        family_members(count),
        chores(count, status, points_value, completed_at)
      `)
      .limit(10);

    const metrics: EngagementMetric[] = families?.map(family => {
      const memberCount = family.family_members?.length || 0;
      const chores = family.chores || [];
      const completedChores = chores.filter(c => c.completed_at);
      const totalPoints = completedChores.reduce((sum, c) => sum + (c.points_value || 0), 0);
      
      return {
        familyId: family.id,
        familyName: family.name,
        totalMembers: memberCount,
        activeMembers: memberCount, // Simplified
        choreCompletionRate: chores.length > 0 ? (completedChores.length / chores.length) * 100 : 0,
        avgPointsPerMember: memberCount > 0 ? totalPoints / memberCount : 0,
        lastActivity: new Date().toISOString(), // Simplified
        engagementScore: (completedChores.length * 10) + (totalPoints * 0.1) // Simple scoring
      };
    }) || [];

    setTopFamilies(metrics.sort((a, b) => b.engagementScore - a.engagementScore));
  };

  const loadActivityHeatmap = async () => {
    // Generate 24-hour activity data
    const hours = Array.from({ length: 24 }, (_, i) => {
      return {
        name: `${i}:00`,
        value: Math.floor(Math.random() * 100), // Mock data - replace with real activity data
        hour: i
      };
    });

    setActivityHeatmap(hours);
  };

  const exportData = () => {
    const data = {
      familyStats,
      growthData,
      engagementData,
      distributionData,
      topFamilies,
      dateRange,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-8">
              <div className="animate-pulse bg-muted rounded h-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Family Analytics</h2>
          <p className="text-muted-foreground">
            {familyId ? 'Family-specific insights' : 'Platform-wide family insights and metrics'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          
          {timeframe === 'custom' && (
            <div className="text-xs text-muted-foreground">Custom date picker needed</div>
          )}
          
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Families</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{familyStats?.totalFamilies || 0}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {familyStats?.growthRate && familyStats.growthRate > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-success">+{familyStats.growthRate.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">{familyStats?.growthRate?.toFixed(1) || 0}%</span>
                </>
              )}
              <span>from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{familyStats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg {familyStats?.averageMembersPerFamily.toFixed(1) || 0} per family
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Families</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{familyStats?.activeFamilies || 0}</div>
            <p className="text-xs text-muted-foreground">
              {familyStats?.totalFamilies ? 
                ((familyStats.activeFamilies / familyStats.totalFamilies) * 100).toFixed(1) : 0}% activity rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topFamilies.length > 0 ? 
                (topFamilies.reduce((sum, f) => sum + f.engagementScore, 0) / topFamilies.length).toFixed(0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Engagement score</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Family Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="families" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="members" 
                  stroke="hsl(var(--secondary))" 
                  fill="hsl(var(--secondary))" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Family Size Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Family Size Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="chores" 
                  stroke="hsl(var(--primary))" 
                  name="Chores Created"
                />
                <Line 
                  type="monotone" 
                  dataKey="points" 
                  stroke="hsl(var(--secondary))" 
                  name="Points Earned"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Activity by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityHeatmap}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Families Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Families</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topFamilies.slice(0, 10).map((family, index) => (
              <div key={family.familyId} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{family.familyName}</p>
                    <p className="text-sm text-muted-foreground">
                      {family.totalMembers} members • {family.choreCompletionRate.toFixed(1)}% completion
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{family.engagementScore.toFixed(0)} pts</p>
                  <p className="text-sm text-muted-foreground">
                    {family.avgPointsPerMember.toFixed(0)} avg/member
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}