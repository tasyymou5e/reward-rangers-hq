/**
 * Secure logging utility for production environments
 * Prevents sensitive data exposure while maintaining debugging capabilities
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'auth' | 'api' | 'ui' | 'security' | 'performance' | 'system';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  /**
   * Sanitize sensitive data from log entries
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'session',
      'email', 'phone', 'ssn', 'credit_card', 'api_key'
    ];

    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }
      
      if (obj && typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            if (typeof value === 'string' && value.length > 0) {
              cleaned[key] = '***REDACTED***';
            } else {
              cleaned[key] = '[REDACTED]';
            }
          } else {
            cleaned[key] = sanitizeObject(value);
          }
        }
        return cleaned;
      }
      
      return obj;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Create a secure log entry
   */
  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    userId?: string
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: this.sanitizeData(data),
      userId: userId ? userId.slice(-8) : undefined, // Only log last 8 chars
      sessionId: this.getSessionId()?.slice(-8) // Only log last 8 chars
    };

    return entry;
  }

  /**
   * Get current session ID safely
   */
  private getSessionId(): string | undefined {
    try {
      // Try to get session from localStorage or other safe source
      const session = localStorage.getItem('supabase.auth.token');
      return session ? JSON.parse(session)?.access_token?.slice(-16) : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Add log entry to memory store
   */
  private addToStore(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Log with appropriate console output based on environment
   */
  private consoleLog(entry: LogEntry) {
    if (!this.isDevelopment) {
      // In production, only log errors and critical warnings
      if (entry.level === 'error' || (entry.level === 'warn' && entry.category === 'security')) {
        console.warn(`[${entry.category}] ${entry.message}`, entry.data ? { timestamp: entry.timestamp } : '');
      }
      return;
    }

    // Development logging with full details
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.data);
        break;
      case 'info':
        console.info(prefix, entry.message, entry.data);
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data);
        break;
      case 'error':
        console.error(prefix, entry.message, entry.data);
        break;
    }
  }

  /**
   * Main logging method
   */
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    userId?: string
  ) {
    const entry = this.createLogEntry(level, category, message, data, userId);
    this.addToStore(entry);
    this.consoleLog(entry);
  }

  /**
   * Convenience methods
   */
  debug(category: LogCategory, message: string, data?: any, userId?: string) {
    this.log('debug', category, message, data, userId);
  }

  info(category: LogCategory, message: string, data?: any, userId?: string) {
    this.log('info', category, message, data, userId);
  }

  warn(category: LogCategory, message: string, data?: any, userId?: string) {
    this.log('warn', category, message, data, userId);
  }

  error(category: LogCategory, message: string, data?: any, userId?: string) {
    this.log('error', category, message, data, userId);
  }

  /**
   * Get recent logs (for debugging purposes)
   */
  getRecentLogs(count = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: LogCategory, count = 50): LogEntry[] {
    return this.logs
      .filter(log => log.category === category)
      .slice(-count);
  }

  /**
   * Clear logs (for memory management)
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs for support (with additional sanitization)
   */
  exportLogsForSupport(): string {
    const supportLogs = this.logs.map(log => ({
      timestamp: log.timestamp,
      level: log.level,
      category: log.category,
      message: log.message,
      hasData: !!log.data,
      userId: log.userId ? `user_***${log.userId}` : undefined
    }));

    return JSON.stringify(supportLogs, null, 2);
  }
}

// Create singleton instance
const logger = new SecureLogger();

// Export backward compatible secureLog
export const secureLog = Object.assign(
  (categoryOrMessage: LogCategory | string, messageOrData?: string | any, dataOrLevel?: any, levelOrUserId?: LogLevel | string, userId?: string) => {
    // Handle both old and new calling patterns
    const validCategories: LogCategory[] = ['auth', 'api', 'ui', 'security', 'performance', 'system'];
    
    if (validCategories.includes(categoryOrMessage as LogCategory)) {
      // New pattern: category first
      logger.log(dataOrLevel || 'info', categoryOrMessage as LogCategory, messageOrData as string, dataOrLevel, levelOrUserId as string);
    } else {
      // Old pattern: message first - default to 'system' category
      logger.log('info', 'system', categoryOrMessage as string, messageOrData);
    }
  },
  {
    debug: (message: string, data?: any) => logger.debug('system', message, data),
    info: (message: string, data?: any) => logger.info('system', message, data),
    warn: (message: string, data?: any) => logger.warn('system', message, data),
    error: (message: string, data?: any) => logger.error('system', message, data),
  }
);

// Export logger instance for advanced usage
export { logger as secureLogger };

// Export convenience methods
export const logAuth = (message: string, data?: any, level: LogLevel = 'info', userId?: string) => {
  logger.log(level, 'auth', message, data, userId);
};

export const logAPI = (message: string, data?: any, level: LogLevel = 'info', userId?: string) => {
  logger.log(level, 'api', message, data, userId);
};

export const logSecurity = (message: string, data?: any, level: LogLevel = 'warn', userId?: string) => {
  logger.log(level, 'security', message, data, userId);
};

export const logPerformance = (message: string, data?: any, level: LogLevel = 'info') => {
  logger.log(level, 'performance', message, data);
};

export const logSystem = (message: string, data?: any, level: LogLevel = 'info') => {
  logger.log(level, 'system', message, data);
};

export const logUI = (message: string, data?: any, level: LogLevel = 'debug') => {
  logger.log(level, 'ui', message, data);
};
