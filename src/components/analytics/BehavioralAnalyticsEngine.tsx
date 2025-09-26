import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BehavioralPattern {
  id: string;
  pattern_type: string;
  confidence_score: number;
  pattern_data: any;
  detected_at: string;
  is_active: boolean;
}

interface AnalyticsInsight {
  type: 'strength' | 'challenge' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  recommendations: string[];
}

export const BehavioralAnalyticsEngine: React.FC<{ familyId: string; userId?: string }> = ({ 
  familyId, 
  userId 
}) => {
  const [patterns, setPatterns] = useState<BehavioralPattern[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBehavioralData();
  }, [familyId, userId]);

  const fetchBehavioralData = async () => {
    try {
      setLoading(true);
      
      // Fetch behavioral patterns
      let query = supabase
        .from('behavioral_patterns')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('detected_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: patternsData } = await query;
      setPatterns(patternsData || []);

      // Generate insights based on patterns
      generateInsights(patternsData || []);
    } catch (error) {
      console.error('Error fetching behavioral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (patternsData: BehavioralPattern[]) => {
    const generatedInsights: AnalyticsInsight[] = [];

    // Analyze completion patterns
    const completionPatterns = patternsData.filter(p => p.pattern_type === 'completion_consistency');
    if (completionPatterns.length > 0) {
      const avgConfidence = completionPatterns.reduce((sum, p) => sum + p.confidence_score, 0) / completionPatterns.length;
      
      generatedInsights.push({
        type: avgConfidence > 0.7 ? 'strength' : 'challenge',
        title: 'Task Completion Consistency',
        description: `Shows ${avgConfidence > 0.7 ? 'strong' : 'developing'} patterns in completing assigned tasks`,
        confidence: avgConfidence,
        recommendations: avgConfidence > 0.7 
          ? ['Maintain current routine', 'Consider increasing task complexity']
          : ['Break tasks into smaller steps', 'Add visual reminders', 'Implement reward checkpoints']
      });
    }

    // Analyze engagement patterns
    const engagementPatterns = patternsData.filter(p => p.pattern_type === 'engagement_timing');
    if (engagementPatterns.length > 0) {
      generatedInsights.push({
        type: 'opportunity',
        title: 'Optimal Engagement Times',
        description: 'Identified peak performance windows for task engagement',
        confidence: 0.8,
        recommendations: [
          'Schedule important tasks during peak hours',
          'Use low-energy times for preparation activities',
          'Consider energy patterns when planning activities'
        ]
      });
    }

    setInsights(generatedInsights);
  };

  const getInsightIcon = (type: AnalyticsInsight['type']) => {
    switch (type) {
      case 'strength': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'challenge': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightColor = (type: AnalyticsInsight['type']) => {
    switch (type) {
      case 'strength': return 'bg-green-50 border-green-200';
      case 'challenge': return 'bg-amber-50 border-amber-200';
      case 'opportunity': return 'bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Behavioral Analytics
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
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Behavioral Analytics Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Patterns Detected</span>
              <Badge variant="secondary">{patterns.length}</Badge>
            </div>
            
            {patterns.slice(0, 3).map((pattern) => (
              <div key={pattern.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm capitalize">{pattern.pattern_type.replace('_', ' ')}</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(pattern.confidence_score * 100)}% confidence
                  </span>
                </div>
                <Progress value={pattern.confidence_score * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
        {insights.map((insight, index) => (
          <Card key={index} className={getInsightColor(insight.type)}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge variant="outline">
                      {Math.round(insight.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Recommendations:</span>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {insight.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        onClick={fetchBehavioralData} 
        variant="outline" 
        className="w-full"
      >
        Refresh Analysis
      </Button>
    </div>
  );
};