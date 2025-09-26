import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCategory: 'user' | 'system' | 'network' | 'unknown';
  isOffline: boolean;
  retryCount: number;
}

interface ErrorCategory {
  type: 'user' | 'system' | 'network' | 'unknown';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  recoveryActions: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

export class EnhancedErrorBoundary extends Component<EnhancedErrorBoundaryProps, EnhancedErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCategory: 'unknown',
      isOffline: !navigator.onLine,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorCategory: EnhancedErrorBoundary.categorizeError(error)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Report error to monitoring service
    this.reportError(error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  componentDidMount() {
    // Listen for online/offline status
    window.addEventListener('online', this.handleOnlineStatusChange);
    window.addEventListener('offline', this.handleOnlineStatusChange);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnlineStatusChange);
    window.removeEventListener('offline', this.handleOnlineStatusChange);
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleOnlineStatusChange = () => {
    this.setState({ isOffline: !navigator.onLine });
  };

  static categorizeError(error: Error): 'user' | 'system' | 'network' | 'unknown' {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      stack.includes('networkerror')
    ) {
      return 'network';
    }

    // User errors (validation, input, etc.)
    if (
      message.includes('validation') ||
      message.includes('invalid input') ||
      message.includes('permission denied') ||
      message.includes('unauthorized') ||
      message.includes('access denied')
    ) {
      return 'user';
    }

    // System errors
    if (
      message.includes('internal server error') ||
      message.includes('database') ||
      message.includes('500') ||
      stack.includes('react') ||
      stack.includes('component')
    ) {
      return 'system';
    }

    return 'unknown';
  }

  reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real app, send to error reporting service
      console.error('Error reported:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        component: this.props.componentName,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= 3) {
      // Max retries reached, suggest page reload
      window.location.reload();
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1
    });

    // Add delay before retry to prevent immediate re-error
    this.retryTimeout = setTimeout(() => {
      this.forceUpdate();
    }, 1000 * (retryCount + 1));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const bugReport = {
      error: error?.message,
      stack: error?.stack,
      component: this.props.componentName,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    // In a real app, open bug reporting modal or redirect to support
    const mailtoLink = `mailto:support@chatterbox.family?subject=Bug Report&body=${encodeURIComponent(JSON.stringify(bugReport, null, 2))}`;
    window.open(mailtoLink);
  };

  getErrorCategory(): ErrorCategory {
    const { errorCategory, isOffline, retryCount } = this.state;

    const baseActions = [
      {
        label: retryCount >= 3 ? 'Reload Page' : 'Try Again',
        action: this.handleRetry,
        primary: true
      },
      {
        label: 'Go Home',
        action: this.handleGoHome
      },
      {
        label: 'Report Bug',
        action: this.handleReportBug
      }
    ];

    switch (errorCategory) {
      case 'network':
        return {
          type: 'network',
          icon: isOffline ? WifiOff : Wifi,
          title: isOffline ? 'No Internet Connection' : 'Network Error',
          description: isOffline 
            ? 'Please check your internet connection and try again.'
            : 'There was a problem connecting to our servers. This might be a temporary issue.',
          recoveryActions: isOffline 
            ? [
                {
                  label: 'Check Connection',
                  action: () => window.open('https://www.google.com', '_blank')
                },
                ...baseActions
              ]
            : baseActions
        };

      case 'user':
        return {
          type: 'user',
          icon: AlertTriangle,
          title: 'Invalid Operation',
          description: 'There was an issue with your request. Please check your input and try again.',
          recoveryActions: [
            {
              label: 'Go Back',
              action: () => window.history.back(),
              primary: true
            },
            ...baseActions.slice(1) // Exclude retry for user errors
          ]
        };

      case 'system':
        return {
          type: 'system',
          icon: Bug,
          title: 'Application Error',
          description: 'Something went wrong with the application. Our team has been notified.',
          recoveryActions: baseActions
        };

      default:
        return {
          type: 'unknown',
          icon: AlertTriangle,
          title: 'Unexpected Error',
          description: 'An unexpected error occurred. Please try refreshing the page.',
          recoveryActions: baseActions
        };
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const errorCategory = this.getErrorCategory();
    const IconComponent = errorCategory.icon;

    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <IconComponent className="h-6 w-6 text-destructive" />
            </div>
            
            <CardTitle className="flex items-center justify-center gap-2">
              {errorCategory.title}
              <Badge variant="outline" className="text-xs">
                {errorCategory.type}
              </Badge>
            </CardTitle>
            
            <p className="text-sm text-muted-foreground mt-2">
              {errorCategory.description}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {this.state.isOffline && (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  You're currently offline. Some features may not work properly.
                </AlertDescription>
              </Alert>
            )}
            
            {this.state.retryCount > 0 && (
              <Alert>
                <RefreshCw className="h-4 w-4" />
                <AlertDescription>
                  Retry attempt {this.state.retryCount} of 3
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col gap-2">
              {errorCategory.recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.primary ? 'default' : 'outline'}
                  onClick={action.action}
                  className="w-full"
                >
                  {action.label}
                </Button>
              ))}
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-2 bg-muted rounded text-xs">
                <summary className="cursor-pointer font-medium">
                  Developer Details
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
}

// Enhanced Error Hook for functional components
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by error handler:', error, errorInfo);
    }
    
    // Report error to monitoring service
    // In a real app, use a service like Sentry
    
    // You could also trigger a global error state here
    // or show a toast notification
  }, []);

  return { handleError };
}