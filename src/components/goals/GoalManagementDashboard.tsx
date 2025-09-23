import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/hooks/useFamily';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Users, Calendar, Star, CheckCircle } from 'lucide-react';
import ChildGoalProposal from './ChildGoalProposal';
import ParentGoalReview from './ParentGoalReview';

interface GoalStats {
  totalProposals: number;
  approvedGoals: number;
  rejectedGoals: number;
  pendingGoals: number;
  completedGoals: number;
  successRate: number;
}

interface MonthlyData {
  month: string;
  proposals: number;
  approved: number;
  completed: number;
}

export default function GoalManagementDashboard() {
  const { user, profile } = useAuth();
  const { family } = useFamily();
  const [stats, setStats] = useState<GoalStats>({
    totalProposals: 0,
    approvedGoals: 0,
    rejectedGoals: 0,
    pendingGoals: 0,
    completedGoals: 0,
    successRate: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (family) {
      fetchGoalAnalytics();
    }
  }, [family]);

  const fetchGoalAnalytics = async () => {
    if (!family) return;

    try {
      // Fetch goal proposals stats
      const { data: proposals, error: proposalsError } = await supabase
        .from('child_goal_proposals')
        .select('*')
        .eq('family_id', family.id);

      if (proposalsError) throw proposalsError;

      // Fetch completed chores that originated from goals
      const { data: completedChores, error: choresError } = await supabase
        .from('chores')
        .select('*')
        .eq('family_id', family.id)
        .eq('status', 'completed');

      if (choresError) throw choresError;

      const totalProposals = proposals?.length || 0;
      const approvedGoals = proposals?.filter(p => p.status === 'approved').length || 0;
      const rejectedGoals = proposals?.filter(p => p.status === 'rejected').length || 0;
      const pendingGoals = proposals?.filter(p => p.status === 'pending').length || 0;
      const completedGoals = completedChores?.length || 0;
      const successRate = approvedGoals > 0 ? (completedGoals / approvedGoals) * 100 : 0;

      setStats({
        totalProposals,
        approvedGoals,
        rejectedGoals,
        pendingGoals,
        completedGoals,
        successRate
      });

      // Calculate monthly trends
      const monthlyMap = new Map<string, { proposals: number; approved: number; completed: number }>();
      
      proposals?.forEach(proposal => {
        const month = new Date(proposal.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const current = monthlyMap.get(month) || { proposals: 0, approved: 0, completed: 0 };
        current.proposals++;
        if (proposal.status === 'approved') current.approved++;
        monthlyMap.set(month, current);
      });

      completedChores?.forEach(chore => {
        const month = new Date(chore.completed_at || chore.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const current = monthlyMap.get(month) || { proposals: 0, approved: 0, completed: 0 };
        current.completed++;
        monthlyMap.set(month, current);
      });

      const monthlyArray = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        ...data
      })).slice(-6); // Last 6 months

      setMonthlyData(monthlyArray);
    } catch (error) {
      console.error('Error fetching goal analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const isParent = profile?.role === 'parent';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Goal Management</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProposals}</div>
            <Badge variant="secondary" className="mt-1">
              {stats.pendingGoals} pending
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Goals</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedGoals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.rejectedGoals} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completedGoals}</div>
            <p className="text-xs text-muted-foreground">
              Goals turned into chores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(0)}%</div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Progress
            </CardTitle>
            <CardDescription>Goal proposals and completion trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="font-medium">{month.month}</div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {month.proposals} proposed
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {month.approved} approved
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      {month.completed} completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-based Content */}
      <Tabs defaultValue={isParent ? "review" : "propose"} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="propose">
            {isParent ? "Child Proposals" : "Create Goal"}
          </TabsTrigger>
          <TabsTrigger value="review">
            {isParent ? "Review & Approve" : "My Proposals"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="propose" className="space-y-4">
          {isParent ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Child Goal Proposals
                </CardTitle>
                <CardDescription>
                  View goals proposed by your children
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Switch to the "Review & Approve" tab to see pending proposals.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ChildGoalProposal />
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <ParentGoalReview />
        </TabsContent>
      </Tabs>
    </div>
  );
}