/**
 * ErrorAnalyticsDashboard Component
 * Displays error analytics, trends, and system health metrics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Shield, 
  RefreshCw,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { ErrorMetrics, DetailedError } from '@/hooks/useEnhancedErrorTracking';

interface ErrorAnalyticsDashboardProps {
  metrics: ErrorMetrics;
  errorHistory: DetailedError[];
  onRefresh?: () => void;
  onExportData?: () => void;
  className?: string;
}

export function ErrorAnalyticsDashboard({
  metrics,
  errorHistory,
  onRefresh,
  onExportData,
  className
}: ErrorAnalyticsDashboardProps) {
  
  const getHealthIcon = () => {
    switch (metrics.systemHealth) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getHealthColor = () => {
    switch (metrics.systemHealth) {
      case 'healthy':
        return 'text-success';
      case 'degraded':
        return 'text-warning';
      case 'critical':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getHealthDescription = () => {
    switch (metrics.systemHealth) {
      case 'healthy':
        return 'All systems operating normally';
      case 'degraded':
        return 'Some issues detected, monitoring closely';
      case 'critical':
        return 'Critical issues require immediate attention';
      default:
        return 'System health unknown';
    }
  };

  const getRecentErrorTrend = () => {
    if (errorHistory.length < 2) return { trend: 'stable', percentage: 0 };
    
    const recent = errorHistory.slice(0, 5);
    const previous = errorHistory.slice(5, 10);
    
    const recentCount = recent.length;
    const previousCount = previous.length;
    
    if (previousCount === 0) return { trend: 'stable', percentage: 0 };
    
    const percentage = ((recentCount - previousCount) / previousCount) * 100;
    const trend = percentage > 20 ? 'increasing' : percentage < -20 ? 'decreasing' : 'stable';
    
    return { trend, percentage: Math.abs(percentage) };
  };

  const errorTrend = getRecentErrorTrend();

  const getMostCommonError = () => {
    if (Object.keys(metrics.errorsByType).length === 0) return null;
    
    const sortedTypes = Object.entries(metrics.errorsByType)
      .sort(([,a], [,b]) => b - a);
    
    return sortedTypes[0];
  };

  const mostCommonError = getMostCommonError();

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getErrorTypeProgress = (type: string) => {
    const count = metrics.errorsByType[type] || 0;
    const maxCount = Math.max(...Object.values(metrics.errorsByType));
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Error Analytics
          </h2>
          <p className="text-muted-foreground">
            System health monitoring and error insights
          </p>
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
          {onExportData && (
            <Button variant="outline" size="sm" onClick={onExportData}>
              Export Data
            </Button>
          )}
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className={`text-2xl font-bold ${getHealthColor()}`}>
                  {metrics.systemHealth.charAt(0).toUpperCase() + metrics.systemHealth.slice(1)}
                </p>
              </div>
              {getHealthIcon()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {getHealthDescription()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold">{metrics.totalErrors}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className={`h-3 w-3 mr-1 ${
                errorTrend.trend === 'increasing' ? 'text-destructive' :
                errorTrend.trend === 'decreasing' ? 'text-success' :
                'text-muted-foreground'
              }`} />
              <span className="text-xs text-muted-foreground">
                {errorTrend.trend} ({errorTrend.percentage.toFixed(1)}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retry Success</p>
                <p className="text-2xl font-bold text-success">{metrics.retrySuccess}</p>
              </div>
              <RefreshCw className="h-5 w-5 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Successful recoveries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">
                  {formatResponseTime(metrics.averageResponseTime)}
                </p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Average operation time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Errors by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Errors by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(metrics.errorsByType).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No errors recorded
              </p>
            ) : (
              Object.entries(metrics.errorsByType).map(([type, count]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{type}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                  <Progress value={getErrorTypeProgress(type)} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Errors by Severity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Errors by Severity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(metrics.errorsBySeverity).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No errors recorded
              </p>
            ) : (
              Object.entries(metrics.errorsBySeverity).map(([severity, count]) => {
                const maxCount = Math.max(...Object.values(metrics.errorsBySeverity));
                const progress = maxCount > 0 ? (count / maxCount) * 100 : 0;
                
                return (
                  <div key={severity} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{severity}</span>
                      <Badge 
                        variant={
                          severity === 'critical' ? 'destructive' :
                          severity === 'high' ? 'destructive' :
                          severity === 'medium' ? 'secondary' :
                          'outline'
                        }
                      >
                        {count}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mostCommonError && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">Most Common Error</p>
                <p className="text-lg font-bold capitalize">{mostCommonError[0]}</p>
                <p className="text-xs text-muted-foreground">
                  {mostCommonError[1]} occurrences
                </p>
              </div>
            )}

            {metrics.lastSuccessfulOperation && (
              <div className="bg-success/10 rounded-lg p-3">
                <p className="text-sm font-medium">Last Success</p>
                <p className="text-lg font-bold">{metrics.lastSuccessfulOperation}</p>
                <p className="text-xs text-muted-foreground">
                  Operation completed successfully
                </p>
              </div>
            )}

            <div className="bg-info/10 rounded-lg p-3">
              <p className="text-sm font-medium">Error Rate</p>
              <p className="text-lg font-bold">
                {metrics.totalErrors > 0 && metrics.retrySuccess > 0 
                  ? `${((metrics.retrySuccess / metrics.totalErrors) * 100).toFixed(1)}%`
                  : '0%'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Recovery success rate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}