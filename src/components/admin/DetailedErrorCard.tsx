/**
 * DetailedErrorCard Component
 * Displays comprehensive error information with actions and context
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  XCircle,
  RefreshCw,
  Copy,
  ChevronDown,
  Clock,
  Code,
  User,
  Activity
} from 'lucide-react';
import { DetailedError } from '@/hooks/useEnhancedErrorTracking';
import { useToast } from '@/hooks/use-toast';

interface DetailedErrorCardProps {
  error: DetailedError;
  onRetry?: () => void;
  onDismiss?: () => void;
  onGetHelp?: () => void;
  showTechnicalDetails?: boolean;
  suggestions?: string[];
}

export function DetailedErrorCard({
  error,
  onRetry,
  onDismiss,
  onGetHelp,
  showTechnicalDetails = false,
  suggestions = []
}: DetailedErrorCardProps) {
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  const getSeverityIcon = () => {
    switch (error.severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-info" />;
    }
  };

  const getSeverityColor = () => {
    switch (error.severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = () => {
    switch (error.type) {
      case 'network':
        return '🌐';
      case 'authentication':
        return '🔐';
      case 'database':
        return '🗄️';
      case 'validation':
        return '✅';
      case 'ui':
        return '🎨';
      default:
        return '❓';
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Error details copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTechnicalSummary = () => {
    return JSON.stringify({
      id: error.id,
      type: error.type,
      severity: error.severity,
      operation: error.operation,
      code: error.code,
      timestamp: error.timestamp,
      retryCount: error.retryCount,
      duration: error.duration,
      context: error.context
    }, null, 2);
  };

  return (
    <Card className={`border-l-4 ${
      error.severity === 'critical' ? 'border-l-destructive' :
      error.severity === 'high' ? 'border-l-warning' :
      error.severity === 'medium' ? 'border-l-warning' :
      'border-l-info'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSeverityIcon()}
            <span className="text-lg font-semibold">
              {getTypeIcon()} {error.type.charAt(0).toUpperCase() + error.type.slice(1)} Error
            </span>
            <Badge variant={getSeverityColor()}>
              {error.severity.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {error.isRetryable && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="h-8"
              >
                Dismiss
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Message */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium text-foreground">
            {error.message}
          </p>
        </div>

        {/* Basic Error Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Operation:</span>
            <span className="font-medium">{error.operation}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Time:</span>
            <span className="font-medium">{formatTimestamp(error.timestamp)}</span>
          </div>

          {error.code && (
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Code:</span>
              <span className="font-medium">{error.code}</span>
            </div>
          )}

          {error.userAction && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Action:</span>
              <span className="font-medium">{error.userAction}</span>
            </div>
          )}
        </div>

        {/* Retry Information */}
        {error.retryCount > 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
            <p className="text-sm">
              <strong>Retry Count:</strong> {error.retryCount}
              {error.duration && (
                <span className="ml-2">
                  <strong>Duration:</strong> {error.duration}ms
                </span>
              )}
            </p>
          </div>
        )}

        {/* Recovery Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Suggested Actions:</h4>
            <ul className="text-sm space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {error.isRetryable && onRetry && (
            <Button
              size="sm"
              onClick={onRetry}
              className="bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(getTechnicalSummary())}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Details
          </Button>

          {onGetHelp && (
            <Button
              size="sm"
              variant="outline"
              onClick={onGetHelp}
            >
              Get Help
            </Button>
          )}
        </div>

        {/* Technical Details (Collapsible) */}
        {showTechnicalDetails && (
          <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                Technical Details
                <ChevronDown className={`h-4 w-4 transition-transform ${!isCollapsed ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <div className="bg-muted rounded-lg p-3">
                <pre className="text-xs overflow-auto max-h-40">
                  {getTechnicalSummary()}
                </pre>
              </div>
              
              {error.stack && (
                <div className="bg-muted rounded-lg p-3">
                  <h5 className="text-xs font-medium mb-2">Stack Trace:</h5>
                  <pre className="text-xs overflow-auto max-h-40 text-muted-foreground">
                    {error.stack}
                  </pre>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}