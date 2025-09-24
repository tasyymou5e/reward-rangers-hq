import { supabase } from "@/integrations/supabase/client";

export interface ConnectionStatus {
  isConnected: boolean;
  latency?: number;
  error?: string;
  timestamp: number;
}

export class ConnectionChecker {
  private static instance: ConnectionChecker;
  
  static getInstance(): ConnectionChecker {
    if (!ConnectionChecker.instance) {
      ConnectionChecker.instance = new ConnectionChecker();
    }
    return ConnectionChecker.instance;
  }

  async checkConnection(): Promise<ConnectionStatus> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      if (!navigator.onLine) {
        return {
          isConnected: false,
          error: 'No internet connection',
          timestamp: Date.now()
        };
      }

      // Test Supabase connectivity with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const { error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          return {
            isConnected: false,
            error: `Supabase error: ${error.message}`,
            timestamp: Date.now()
          };
        }

        const latency = Date.now() - startTime;
        return {
          isConnected: true,
          latency,
          timestamp: Date.now()
        };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          return {
            isConnected: false,
            error: 'Connection timeout',
            timestamp: Date.now()
          };
        }

        return {
          isConnected: false,
          error: `Network error: ${fetchError.message}`,
          timestamp: Date.now()
        };
      }
    } catch (error: any) {
      return {
        isConnected: false,
        error: `Unexpected error: ${error.message}`,
        timestamp: Date.now()
      };
    }
  }

  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Check if it's a network error worth retrying
        if (this.isRetryableError(error)) {
          await this.delay(delayMs * attempt);
          continue;
        } else {
          break;
        }
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'NetworkError',
      'fetch',
      'timeout',
      'connection',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(keyword => errorMessage.includes(keyword));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const connectionChecker = ConnectionChecker.getInstance();