import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, Lightbulb, RefreshCw, Clock, Target } from 'lucide-react';
import { usePredictiveAnalytics } from '@/hooks/usePredictiveAnalytics';

export function PredictiveInsights() {
  const { suggestions, analytics, loading, generateSuggestions } = usePredictiveAnalytics();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* AI Suggestions */}
      <Card className="bg-white border-parents-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-parents-primary">
              <Brain className="h-5 w-5" />
              AI-Powered Suggestions
            </CardTitle>
            <Button
              onClick={generateSuggestions}
              disabled={loading}
              size="sm"
              variant="outline"
              className="border-parents-primary text-parents-primary hover:bg-parents-primary hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.length === 0 && !loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No suggestions available yet.</p>
              <p className="text-sm">Complete more chores to get AI insights!</p>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-parents-primary/5 to-parents-secondary/5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-parents-accent" />
                    <h4 className="font-medium text-parents-primary">{suggestion.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getImpactColor(suggestion.impact)}>
                      {suggestion.impact} impact
                    </Badge>
                    <Badge variant="outline" className={getConfidenceColor(suggestion.confidence)}>
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                <Progress value={suggestion.confidence * 100} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      {analytics && (
        <Card className="bg-white border-parents-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-parents-primary">
              <TrendingUp className="h-5 w-5" />
              Family Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Completion Rates */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Completion Rates
                </h4>
                {Object.entries(analytics.completionRates).map(([child, data]: [string, any]) => (
                  <div key={child} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{child}</span>
                      <span>{Math.round((data.onTime / data.total) * 100)}%</span>
                    </div>
                    <Progress value={(data.onTime / data.total) * 100} className="h-2" />
                  </div>
                ))}
              </div>

              {/* Preferred Times */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Preferred Times
                </h4>
                {Object.entries(analytics.preferredTimes).map(([time, count]: [string, any]) => (
                  <div key={time} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{time}</span>
                    <Badge variant="outline">{count} completions</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-parents-primary">{analytics.totalChores}</div>
                  <div className="text-sm text-muted-foreground">Total Chores</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-parents-primary">
                    {Math.round(analytics.averageTime / 60) || 0}m
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-parents-primary">
                    {Object.keys(analytics.completionRates).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Children</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}