import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, TrendingUp, Calendar, Target, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PredictiveInsight {
  id: string;
  type: 'performance_trend' | 'motivation_forecast' | 'challenge_prediction' | 'opportunity_window';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  actionable_items: string[];
  priority: 'low' | 'medium' | 'high';
  impact_score: number;
}

interface ChoreCompletion {
  id: string;
  completed_at: string;
  completion_time_seconds: number;
  points_value: number;
  assigned_to: string;
}

export const EnhancedPredictiveInsights: React.FC<{ familyId: string; userId?: string }> = ({ 
  familyId, 
  userId 
}) => {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [completionData, setCompletionData] = useState<ChoreCompletion[]>([]);

  useEffect(() => {
    generatePredictiveInsights();
  }, [familyId, userId]);

  const generatePredictiveInsights = async () => {
    try {
      setLoading(true);
      
      // Fetch recent completion data for analysis
      const { data: completions } = await supabase
        .from('chores')
        .select(`
          id,
          completed_at,
          completion_time_seconds,
          points_value,
          assigned_to
        `)
        .eq('family_id', familyId)
        .not('completed_at', 'is', null)
        .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: false });

      setCompletionData(completions || []);
      
      // Generate insights based on data analysis
      const generatedInsights = await analyzeDataAndGenerateInsights(completions || []);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error generating predictive insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeDataAndGenerateInsights = async (completions: any[]): Promise<PredictiveInsight[]> => {
    const insights: PredictiveInsight[] = [];

    // Performance Trend Analysis
    if (completions.length > 0) {
      const recentWeek = completions.filter(c => 
        new Date(c.completed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      const previousWeek = completions.filter(c => {
        const date = new Date(c.completed_at);
        return date > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) && 
               date <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      });

      const recentAvgTime = recentWeek.length > 0 ? 
        recentWeek.reduce((sum, c) => sum + (c.completion_time_seconds || 0), 0) / recentWeek.length : 0;
      const previousAvgTime = previousWeek.length > 0 ? 
        previousWeek.reduce((sum, c) => sum + (c.completion_time_seconds || 0), 0) / previousWeek.length : 0;

      if (recentAvgTime && previousAvgTime) {
        const improvement = ((previousAvgTime - recentAvgTime) / previousAvgTime) * 100;
        
        insights.push({
          id: 'performance-trend-1',
          type: 'performance_trend',
          title: improvement > 0 ? 'Performance Improving' : 'Performance Declining',
          description: `Task completion speed has ${improvement > 0 ? 'improved' : 'decreased'} by ${Math.abs(improvement).toFixed(1)}% this week`,
          confidence: 0.85,
          timeframe: 'Next 7 days',
          actionable_items: improvement > 0 
            ? ['Continue current strategies', 'Consider increasing task complexity', 'Reward consistent performance']
            : ['Review task difficulty', 'Check for external stressors', 'Provide additional support'],
          priority: improvement < -20 ? 'high' : 'medium',
          impact_score: Math.abs(improvement) / 10
        });
      }

      // Challenge Prediction
      if (completions.length > 10 && recentAvgTime > 0) {
        const recentFailures = completions.filter(c => 
          c.completion_time_seconds > (recentAvgTime * 1.5) || !c.completed_at
        );
        
        if (recentFailures.length > completions.length * 0.3) {
          insights.push({
            id: 'challenge-prediction-1',
            type: 'challenge_prediction',
            title: 'Increased Challenge Risk',
            description: 'Recent patterns suggest potential difficulty with upcoming tasks',
            confidence: 0.68,
            timeframe: 'Next 3-5 days',
            actionable_items: [
              'Reduce task complexity temporarily',
              'Increase check-in frequency',
              'Prepare additional support materials'
            ],
            priority: 'high',
            impact_score: 0.8
          });
        }
      }
    }

    // Motivation Forecast
    const weeklyPattern = analyzeWeeklyPatterns(completions);
    if (weeklyPattern.lowMotivationDays.length > 0) {
      insights.push({
        id: 'motivation-forecast-1',
        type: 'motivation_forecast',
        title: 'Motivation Dip Predicted',
        description: `Lower engagement typically occurs on ${weeklyPattern.lowMotivationDays.join(', ')}`,
        confidence: 0.72,
        timeframe: 'This week',
        actionable_items: [
          'Schedule easier tasks on low-motivation days',
          'Plan motivational activities beforehand',
          'Consider incentives for challenging days'
        ],
        priority: 'medium',
        impact_score: 0.6
      });
    }

    // Opportunity Window
    const bestPerformanceTimes = analyzeBestPerformanceTimes(completions);
    if (bestPerformanceTimes.length > 0) {
      insights.push({
        id: 'opportunity-window-1',
        type: 'opportunity_window',
        title: 'Optimal Performance Window',
        description: `Peak performance typically occurs during ${bestPerformanceTimes.join(', ')} hours`,
        confidence: 0.79,
        timeframe: 'Daily',
        actionable_items: [
          'Schedule important tasks during peak hours',
          'Use these times for challenging activities',
          'Plan relaxation during low-energy periods'
        ],
        priority: 'medium',
        impact_score: 0.7
      });
    }

    return insights.sort((a, b) => b.impact_score - a.impact_score);
  };

  const analyzeWeeklyPatterns = (completions: any[]) => {
    const dayOfWeekCounts = new Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    completions.forEach(c => {
      const dayOfWeek = new Date(c.completed_at).getDay();
      dayOfWeekCounts[dayOfWeek]++;
    });

    const avgCompletions = dayOfWeekCounts.reduce((sum, count) => sum + count, 0) / 7;
    const lowMotivationDays = dayOfWeekCounts
      .map((count, index) => ({ count, day: dayNames[index] }))
      .filter(item => item.count < avgCompletions * 0.7)
      .map(item => item.day);

    return { lowMotivationDays };
  };

  const analyzeBestPerformanceTimes = (completions: any[]) => {
    const hourCounts = new Array(24).fill(0);
    
    completions.forEach(c => {
      const hour = new Date(c.completed_at).getHours();
      hourCounts[hour]++;
    });

    const avgCompletions = hourCounts.reduce((sum, count) => sum + count, 0) / 24;
    const bestHours = hourCounts
      .map((count, hour) => ({ count, hour }))
      .filter(item => item.count > avgCompletions * 1.2)
      .map(item => {
        if (item.hour < 12) return `${item.hour || 12}AM`;
        return `${item.hour === 12 ? 12 : item.hour - 12}PM`;
      });

    return bestHours;
  };

  const getInsightIcon = (type: PredictiveInsight['type']) => {
    switch (type) {
      case 'performance_trend': return <TrendingUp className="h-4 w-4" />;
      case 'motivation_forecast': return <Calendar className="h-4 w-4" />;
      case 'challenge_prediction': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity_window': return <Target className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Predictive Insights
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Enhanced Predictive Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered analysis of behavioral patterns and performance trends
          </p>
          
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Not enough data available for predictive analysis. 
                Continue completing tasks to unlock insights!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <Card key={insight.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <h3 className="font-medium">{insight.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityColor(insight.priority) as any}>
                          {insight.priority}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(insight.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {insight.description}
                    </p>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Impact Score</span>
                        <span>{Math.round(insight.impact_score * 100)}%</span>
                      </div>
                      <Progress value={insight.impact_score * 100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">Timeframe:</span>
                        <span className="text-muted-foreground">{insight.timeframe}</span>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium">Recommended Actions:</span>
                        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                          {insight.actionable_items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Button 
        onClick={generatePredictiveInsights} 
        variant="outline" 
        className="w-full"
      >
        Refresh Insights
      </Button>
    </div>
  );
};