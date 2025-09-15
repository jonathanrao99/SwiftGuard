/**
 * SwiftGuard Central Logger with PII Scrubbing
 * Provides secure logging with automatic PII detection and scrubbing
 */

import * as Sentry from '@sentry/react-native';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  source: 'client' | 'edge';
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private isProduction: boolean = false;

  private constructor() {
    this.isProduction = __DEV__ === false;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public setProductionMode(isProduction: boolean): void {
    this.isProduction = isProduction;
  }

  /**
   * PII Detection Patterns
   */
  private readonly piiPatterns = {
    // Phone numbers (various formats)
    phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    
    // Email addresses
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    
    // Credit card numbers (various formats)
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    
    // SSN (US format)
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    
    // Driver's license (common formats)
    driversLicense: /\b[A-Z]{1,2}\d{6,8}\b/g,
    
    // Passport numbers
    passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
    
    // Bank account numbers
    bankAccount: /\b\d{8,17}\b/g,
    
    // IP addresses
    ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    
    // MAC addresses
    macAddress: /\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b/g,
    
    // JWT tokens
    jwt: /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
    
    // API keys
    apiKey: /\b[A-Za-z0-9]{20,}\b/g,
    
    // Coordinates (precise location)
    coordinates: /\b-?\d{1,3}\.\d{4,},\s*-?\d{1,3}\.\d{4,}\b/g,
  };

  /**
   * PII Scrubbing Functions
   */
  private scrubPII(text: string): string {
    let scrubbed = text;

    // Phone numbers - keep last 4 digits
    scrubbed = scrubbed.replace(this.piiPatterns.phone, (match) => {
      const digits = match.replace(/\D/g, '');
      if (digits.length >= 4) {
        return `***-***-${digits.slice(-4)}`;
      }
      return '***-***-****';
    });

    // Email addresses - keep domain
    scrubbed = scrubbed.replace(this.piiPatterns.email, (match) => {
      const [local, domain] = match.split('@');
      if (local.length > 2) {
        return `${local.substring(0, 2)}***@${domain}`;
      }
      return `***@${domain}`;
    });

    // Credit card numbers - keep last 4 digits
    scrubbed = scrubbed.replace(this.piiPatterns.creditCard, (match) => {
      const digits = match.replace(/\D/g, '');
      if (digits.length >= 4) {
        return `****-****-****-${digits.slice(-4)}`;
      }
      return '****-****-****-****';
    });

    // SSN - keep last 4 digits
    scrubbed = scrubbed.replace(this.piiPatterns.ssn, (match) => {
      const digits = match.replace(/\D/g, '');
      if (digits.length >= 4) {
        return `***-**-${digits.slice(-4)}`;
      }
      return '***-**-****';
    });

    // Driver's license - keep first 2 and last 2 characters
    scrubbed = scrubbed.replace(this.piiPatterns.driversLicense, (match) => {
      if (match.length > 4) {
        return `${match.substring(0, 2)}***${match.slice(-2)}`;
      }
      return '***';
    });

    // Passport - keep first 2 and last 2 characters
    scrubbed = scrubbed.replace(this.piiPatterns.passport, (match) => {
      if (match.length > 4) {
        return `${match.substring(0, 2)}***${match.slice(-2)}`;
      }
      return '***';
    });

    // Bank account - keep last 4 digits
    scrubbed = scrubbed.replace(this.piiPatterns.bankAccount, (match) => {
      if (match.length >= 4) {
        return `***${match.slice(-4)}`;
      }
      return '***';
    });

    // IP addresses - mask last octet
    scrubbed = scrubbed.replace(this.piiPatterns.ipAddress, (match) => {
      const parts = match.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
      return 'xxx.xxx.xxx.xxx';
    });

    // MAC addresses - mask last 3 octets
    scrubbed = scrubbed.replace(this.piiPatterns.macAddress, (match) => {
      const parts = match.split(/[:-]/);
      if (parts.length === 6) {
        return `${parts[0]}:${parts[1]}:${parts[2]}:xx:xx:xx`;
      }
      return 'xx:xx:xx:xx:xx:xx';
    });

    // JWT tokens - mask middle part
    scrubbed = scrubbed.replace(this.piiPatterns.jwt, (match) => {
      const parts = match.split('.');
      if (parts.length === 3) {
        return `${parts[0]}.***.${parts[2]}`;
      }
      return '***';
    });

    // API keys - keep first 4 and last 4 characters
    scrubbed = scrubbed.replace(this.piiPatterns.apiKey, (match) => {
      if (match.length > 8) {
        return `${match.substring(0, 4)}***${match.slice(-4)}`;
      }
      return '***';
    });

    // Coordinates - reduce precision to ~100m
    scrubbed = scrubbed.replace(this.piiPatterns.coordinates, (match) => {
      const [lat, lng] = match.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        // Reduce precision to 2 decimal places (~100m)
        const roundedLat = Math.round(lat * 100) / 100;
        const roundedLng = Math.round(lng * 100) / 100;
        return `${roundedLat}, ${roundedLng}`;
      }
      return '***, ***';
    });

    return scrubbed;
  }

  /**
   * Scrub PII from context object
   */
  private scrubContext(context: LogContext): LogContext {
    const scrubbed: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') {
        scrubbed[key] = this.scrubPII(value);
      } else if (typeof value === 'object' && value !== null) {
        scrubbed[key] = this.scrubContext(value as LogContext);
      } else {
        scrubbed[key] = value;
      }
    }

    return scrubbed;
  }

  /**
   * Format log entry
   */
  private formatLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message: this.scrubPII(message),
      context: context ? this.scrubContext(context) : undefined,
      timestamp: new Date().toISOString(),
      source: 'client',
    };
  }

  /**
   * Get level name
   */
  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      case LogLevel.CRITICAL: return 'CRITICAL';
      default: return 'UNKNOWN';
    }
  }

  /**
   * Log message
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (level < this.logLevel) {
      return;
    }

    const logEntry = this.formatLogEntry(level, message, context);
    const levelName = this.getLevelName(level);

    // Console logging (development only)
    if (!this.isProduction) {
      const contextStr = context ? ` ${JSON.stringify(logEntry.context)}` : '';
      console.log(`[${levelName}] ${logEntry.message}${contextStr}`);
    }

    // Sentry logging for errors and critical issues
    if (level >= LogLevel.ERROR) {
      Sentry.withScope((scope) => {
        scope.setLevel(level === LogLevel.CRITICAL ? 'fatal' : 'error');
        scope.setContext('logContext', logEntry.context || {});
        scope.setTag('logLevel', levelName);
        scope.setTag('logSource', logEntry.source);
        
        if (error) {
          scope.setException(error);
        }
        
        Sentry.captureMessage(logEntry.message);
      });
    }

    // Send to analytics service for monitoring
    if (level >= LogLevel.WARN) {
      // This would integrate with your analytics service
      // AnalyticsService.track('log_event', {
      //   level: levelName,
      //   message: logEntry.message,
      //   context: logEntry.context,
      //   timestamp: logEntry.timestamp,
      // });
    }
  }

  /**
   * Public logging methods
   */
  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  public critical(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  /**
   * Log API request/response
   */
  public logApiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, {
      ...context,
      method,
      url: this.scrubPII(url),
    });
  }

  public logApiResponse(method: string, url: string, status: number, context?: LogContext): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API Response: ${method} ${url} - ${status}`, {
      ...context,
      method,
      url: this.scrubPII(url),
      status,
    });
  }

  /**
   * Log user action
   */
  public logUserAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      ...context,
      action,
    });
  }

  /**
   * Log security event
   */
  public logSecurityEvent(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      securityEvent: event,
    });
  }

  /**
   * Log performance metric
   */
  public logPerformance(metric: string, value: number, context?: LogContext): void {
    this.info(`Performance: ${metric} = ${value}ms`, {
      ...context,
      metric,
      value,
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export for edge functions (Deno)
export const createEdgeLogger = () => {
  return {
    debug: (message: string, context?: any) => {
      console.log(`[DEBUG] ${message}`, context);
    },
    info: (message: string, context?: any) => {
      console.log(`[INFO] ${message}`, context);
    },
    warn: (message: string, context?: any) => {
      console.warn(`[WARN] ${message}`, context);
    },
    error: (message: string, context?: any, error?: Error) => {
      console.error(`[ERROR] ${message}`, context, error);
    },
    critical: (message: string, context?: any, error?: Error) => {
      console.error(`[CRITICAL] ${message}`, context, error);
    },
  };
};





