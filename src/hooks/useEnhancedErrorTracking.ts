/**
 * Enhanced Error Tracking Hook for AdminFamilies
 * Provides comprehensive error tracking, categorization, and recovery mechanisms
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { handleError, getUserFriendlyError, getErrorCode, retryOperation } from '@/utils/errorHandling';

export interface DetailedError {
  id: string;
  type: 'network' | 'authentication' | 'database' | 'validation' | 'ui' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  originalError: any;
  code?: string;
  timestamp: string;
  operation: string;
  context: Record<string, any>;
  retryCount: number;
  isRetryable: boolean;
  userAction?: string;
  duration?: number;
  stack?: string;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  retrySuccess: number;
  lastSuccessfulOperation?: string;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  averageResponseTime: number;
}

interface OperationContext {
  operationId: string;
  startTime: number;
  userAction?: string;
  metadata?: Record<string, any>;
}

export function useEnhancedErrorTracking(componentName: string) {
  const [errors, setErrors] = useState<Record<string, DetailedError>>({});
  const [errorHistory, setErrorHistory] = useState<DetailedError[]>([]);
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({});
  const [metrics, setMetrics] = useState<ErrorMetrics>({
    totalErrors: 0,
    errorsByType: {},
    errorsBySeverity: {},
    retrySuccess: 0,
    systemHealth: 'healthy',
    averageResponseTime: 0
  });

  const operationContext = useRef<Record<string, OperationContext>>({});
  const responseTimeHistory = useRef<number[]>([]);

  // Categorize errors based on error content and patterns
  const categorizeError = useCallback((error: any): DetailedError['type'] => {
    const errorMessage = error?.message || String(error);
    const errorCode = getErrorCode(error);

    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorCode === 'NETWORK_ERROR') {
      return 'network';
    }
    if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') || errorCode === '401') {
      return 'authentication';
    }
    if (errorMessage.includes('database') || errorCode?.startsWith('PG') || errorCode?.startsWith('23')) {
      return 'database';
    }
    if (errorMessage.includes('validation') || errorCode === '400') {
      return 'validation';
    }
    if (errorMessage.includes('render') || errorMessage.includes('component')) {
      return 'ui';
    }
    return 'unknown';
  }, []);

  // Determine error severity
  const getSeverity = useCallback((error: any, type: DetailedError['type']): DetailedError['severity'] => {
    const errorMessage = error?.message || String(error);
    const errorCode = getErrorCode(error);

    if (type === 'authentication' || errorCode === '403' || errorMessage.includes('critical')) {
      return 'critical';
    }
    if (type === 'database' || type === 'network' || errorCode?.startsWith('5')) {
      return 'high';
    }
    if (type === 'validation' || type === 'ui') {
      return 'medium';
    }
    return 'low';
  }, []);

  // Check if error is retryable
  const isRetryable = useCallback((error: any, type: DetailedError['type']): boolean => {
    const errorCode = getErrorCode(error);
    const errorMessage = error?.message || String(error);

    // Network errors are usually retryable
    if (type === 'network' || errorMessage.includes('timeout')) {
      return true;
    }
    
    // Some database errors are retryable (connection issues, not constraint violations)
    if (type === 'database' && !errorCode?.startsWith('23')) {
      return true;
    }

    // Authentication errors are generally not retryable
    if (type === 'authentication') {
      return false;
    }

    return false;
  }, []);

  // Start tracking an operation
  const startOperation = useCallback((operationName: string, userAction?: string, metadata?: Record<string, any>) => {
    const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    operationContext.current[operationId] = {
      operationId,
      startTime: Date.now(),
      userAction,
      metadata
    };
    return operationId;
  }, []);

  // Track successful operation
  const trackSuccess = useCallback((operationId: string, operationName: string) => {
    const context = operationContext.current[operationId];
    if (context) {
      const duration = Date.now() - context.startTime;
      responseTimeHistory.current.push(duration);
      
      // Keep only last 100 response times for average calculation
      if (responseTimeHistory.current.length > 100) {
        responseTimeHistory.current = responseTimeHistory.current.slice(-100);
      }

      setMetrics(prev => ({
        ...prev,
        lastSuccessfulOperation: operationName,
        averageResponseTime: responseTimeHistory.current.reduce((a, b) => a + b, 0) / responseTimeHistory.current.length
      }));

      delete operationContext.current[operationId];
    }
  }, []);

  // Track error with enhanced context
  const trackError = useCallback((
    error: any,
    operation: string,
    operationId?: string,
    additionalContext?: Record<string, any>
  ): string => {
    const errorId = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const type = categorizeError(error);
    const severity = getSeverity(error, type);
    const context = operationId ? operationContext.current[operationId] : null;
    const duration = context ? Date.now() - context.startTime : undefined;

    const detailedError: DetailedError = {
      id: errorId,
      type,
      severity,
      message: getUserFriendlyError(error),
      originalError: error,
      code: getErrorCode(error),
      timestamp: new Date().toISOString(),
      operation,
      context: {
        component: componentName,
        userAction: context?.userAction,
        ...context?.metadata,
        ...additionalContext
      },
      retryCount: retryAttempts[operation] || 0,
      isRetryable: isRetryable(error, type),
      userAction: context?.userAction,
      duration,
      stack: error?.stack
    };

    // Update errors state
    setErrors(prev => ({
      ...prev,
      [operation]: detailedError
    }));

    // Add to history
    setErrorHistory(prev => [detailedError, ...prev.slice(0, 49)]); // Keep last 50 errors

    // Update metrics
    setMetrics(prev => {
      const newErrorsByType = { ...prev.errorsByType };
      newErrorsByType[type] = (newErrorsByType[type] || 0) + 1;

      const newErrorsBySeverity = { ...prev.errorsBySeverity };
      newErrorsBySeverity[severity] = (newErrorsBySeverity[severity] || 0) + 1;

      const criticalErrors = newErrorsBySeverity.critical || 0;
      const highErrors = newErrorsBySeverity.high || 0;
      const totalErrors = prev.totalErrors + 1;

      let systemHealth: ErrorMetrics['systemHealth'] = 'healthy';
      if (criticalErrors > 0 || (highErrors > 5 && totalErrors > 10)) {
        systemHealth = 'critical';
      } else if (highErrors > 2 || totalErrors > 5) {
        systemHealth = 'degraded';
      }

      return {
        ...prev,
        totalErrors,
        errorsByType: newErrorsByType,
        errorsBySeverity: newErrorsBySeverity,
        systemHealth
      };
    });

    // Clean up operation context
    if (operationId && operationContext.current[operationId]) {
      delete operationContext.current[operationId];
    }

    return errorId;
  }, [componentName, categorizeError, getSeverity, isRetryable, retryAttempts]);

  // Enhanced retry with tracking
  const retryWithTracking = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    userAction?: string
  ): Promise<T> => {
    const operationId = startOperation(operationName, userAction);
    
    try {
      const result = await retryOperation(operation, maxRetries, baseDelay, operationName);
      
      // Track retry success if we had previous failures
      if (retryAttempts[operationName] > 0) {
        setMetrics(prev => ({
          ...prev,
          retrySuccess: prev.retrySuccess + 1
        }));
        
        // Clear retry count on success
        setRetryAttempts(prev => ({
          ...prev,
          [operationName]: 0
        }));
      }

      trackSuccess(operationId, operationName);
      return result;
    } catch (error) {
      const currentAttempts = (retryAttempts[operationName] || 0) + 1;
      setRetryAttempts(prev => ({
        ...prev,
        [operationName]: currentAttempts
      }));

      trackError(error, operationName, operationId, { 
        retryAttempt: currentAttempts,
        maxRetries 
      });
      throw error;
    }
  }, [startOperation, retryAttempts, trackSuccess, trackError]);

  // Clear specific error
  const clearError = useCallback((operation: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[operation];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Get error for specific operation
  const getError = useCallback((operation: string): DetailedError | undefined => {
    return errors[operation];
  }, [errors]);

  // Check if operation has error
  const hasError = useCallback((operation: string): boolean => {
    return !!errors[operation];
  }, [errors]);

  // Get recovery suggestions
  const getRecoverySuggestions = useCallback((operation: string): string[] => {
    const error = errors[operation];
    if (!error) return [];

    const suggestions: string[] = [];

    switch (error.type) {
      case 'network':
        suggestions.push('Check your internet connection');
        suggestions.push('Try refreshing the page');
        if (error.isRetryable) suggestions.push('Retry the operation');
        break;
      case 'authentication':
        suggestions.push('Please log in again');
        suggestions.push('Check your permissions');
        break;
      case 'database':
        suggestions.push('Try again in a moment');
        suggestions.push('Contact support if the issue persists');
        break;
      case 'validation':
        suggestions.push('Check your input data');
        suggestions.push('Ensure all required fields are filled');
        break;
      case 'ui':
        suggestions.push('Try refreshing the page');
        suggestions.push('Clear your browser cache');
        break;
      default:
        suggestions.push('Try refreshing the page');
        suggestions.push('Contact support if needed');
    }

    return suggestions;
  }, [errors]);

  // Update system health based on recent errors
  useEffect(() => {
    const recentErrors = errorHistory.slice(0, 10); // Last 10 errors
    const criticalCount = recentErrors.filter(e => e.severity === 'critical').length;
    const highCount = recentErrors.filter(e => e.severity === 'high').length;

    let health: ErrorMetrics['systemHealth'] = 'healthy';
    if (criticalCount > 0) {
      health = 'critical';
    } else if (highCount > 3) {
      health = 'degraded';
    }

    setMetrics(prev => ({
      ...prev,
      systemHealth: health
    }));
  }, [errorHistory]);

  return {
    // Error state
    errors,
    errorHistory,
    metrics,
    
    // Tracking methods
    startOperation,
    trackError,
    trackSuccess,
    retryWithTracking,
    
    // Error management
    clearError,
    clearAllErrors,
    getError,
    hasError,
    getRecoverySuggestions,
    
    // Utilities
    categorizeError,
    getSeverity,
    isRetryable
  };
}
