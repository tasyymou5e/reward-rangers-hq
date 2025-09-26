import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Users,
  Shield,
  Mail,
  Database,
  Upload,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextualLoadingProps {
  type: 'families' | 'users' | 'security' | 'invitation' | 'upload' | 'download' | 'database' | 'generic';
  message?: string;
  progress?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface ProgressLoadingProps {
  steps: Array<{
    id: string;
    label: string;
    status: 'pending' | 'loading' | 'complete' | 'error';
    message?: string;
  }>;
  currentStep?: string;
  progress?: number;
  className?: string;
}

interface OperationLoadingProps {
  operation: string;
  progress?: number;
  currentStep?: string;
  totalSteps?: number;
  estimatedTime?: string;
  onCancel?: () => void;
  className?: string;
}

interface SkeletonListProps {
  count?: number;
  type?: 'table' | 'cards' | 'list' | 'form';
  className?: string;
}

// Contextual Loading Spinner
export function ContextualLoading({ type, message, progress, className, size = 'md' }: ContextualLoadingProps) {
  const getIcon = () => {
    switch (type) {
      case 'families': return Users;
      case 'users': return Users;
      case 'security': return Shield;
      case 'invitation': return Mail;
      case 'upload': return Upload;
      case 'download': return Download;
      case 'database': return Database;
      default: return Loader2;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'families': return 'Loading family data...';
      case 'users': return 'Loading user information...';
      case 'security': return 'Running security checks...';
      case 'invitation': return 'Processing invitation...';
      case 'upload': return 'Uploading files...';
      case 'download': return 'Preparing download...';
      case 'database': return 'Updating database...';
      default: return 'Loading...';
    }
  };

  const IconComponent = getIcon();
  const displayMessage = message || getDefaultMessage();
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4 p-8", className)}>
      <div className="relative">
        <IconComponent className={cn(sizeClasses[size], "animate-spin text-primary")} />
      </div>
      <div className="text-center space-y-2">
        <p className="font-medium">{displayMessage}</p>
        {progress !== undefined && (
          <div className="w-64 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Progress-based Loading
export function ProgressLoading({ steps, currentStep, progress, className }: ProgressLoadingProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="font-semibold flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Processing...
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress !== undefined && (
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-center text-muted-foreground">
              {progress}% complete
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                step.status === 'loading' && "bg-blue-50 border border-blue-200",
                step.status === 'complete' && "bg-green-50 border border-green-200",
                step.status === 'error' && "bg-red-50 border border-red-200",
                step.status === 'pending' && "bg-muted/30"
              )}
            >
              <div className="flex-shrink-0">
                {step.status === 'loading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                {step.status === 'complete' && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {step.status === 'error' && (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                {step.status === 'pending' && (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-medium",
                  step.status === 'loading' && "text-blue-700",
                  step.status === 'complete' && "text-green-700",
                  step.status === 'error' && "text-red-700",
                  step.status === 'pending' && "text-muted-foreground"
                )}>
                  {step.label}
                </p>
                {step.message && (
                  <p className="text-sm text-muted-foreground">{step.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Operation Loading with Details
export function OperationLoading({ 
  operation, 
  progress, 
  currentStep, 
  totalSteps, 
  estimatedTime, 
  onCancel,
  className 
}: OperationLoadingProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{operation}</h3>
            
            {currentStep && (
              <p className="text-sm text-muted-foreground">
                {currentStep}
                {totalSteps && ` (Step ${Math.ceil((progress || 0) / (100 / totalSteps))} of ${totalSteps})`}
              </p>
            )}
            
            {progress !== undefined && (
              <div className="w-full max-w-sm mx-auto space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            )}
            
            {estimatedTime && (
              <p className="text-xs text-muted-foreground">
                Estimated time remaining: {estimatedTime}
              </p>
            )}
          </div>
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel} size="sm">
              Cancel Operation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Skeleton List
export function SkeletonList({ count = 5, type = 'list', className }: SkeletonListProps) {
  const renderSkeletonItem = (index: number) => {
    switch (type) {
      case 'table':
        return (
          <div key={index} className="flex items-center space-x-4 p-4 border-b">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        );
      
      case 'cards':
        return (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-8 w-24 mt-4" />
              </div>
            </CardContent>
          </Card>
        );
      
      case 'form':
        return (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        );
      
      default: // list
        return (
          <div key={index} className="flex items-center space-x-3 p-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        );
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }, (_, index) => renderSkeletonItem(index))}
    </div>
  );
}

// Retry Loading State
export function RetryLoading({ 
  message, 
  onRetry, 
  error,
  className 
}: {
  message?: string;
  onRetry: () => void;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn("text-center space-y-4 p-8", className)}>
      <XCircle className="h-12 w-12 text-destructive mx-auto" />
      <div className="space-y-2">
        <h3 className="font-semibold">Failed to Load</h3>
        <p className="text-sm text-muted-foreground">
          {error || message || "Something went wrong while loading the data."}
        </p>
      </div>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}