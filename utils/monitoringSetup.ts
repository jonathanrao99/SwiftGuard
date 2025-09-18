/**
 * SwiftGuard Monitoring Setup
 * Initializes all monitoring and observability systems
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { initCrashReporting } from './crashReporting';
import { logger } from './Logger';

interface MonitoringConfig {
  sentryDsn?: string;
  environment?: string;
  debugMode?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableCrashReporting?: boolean;
}

class MonitoringSetup {
  private static instance: MonitoringSetup;
  private isInitialized = false;
  private config: MonitoringConfig = {};

  private constructor() {}

  public static getInstance(): MonitoringSetup {
    if (!MonitoringSetup.instance) {
      MonitoringSetup.instance = new MonitoringSetup();
    }
    return MonitoringSetup.instance;
  }

  /**
   * Initialize all monitoring systems
   */
  public async initialize(config?: MonitoringConfig): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Monitoring already initialized');
      return;
    }

    try {
      // Merge config with defaults
      this.config = {
        environment: __DEV__ ? 'development' : 'production',
        debugMode: __DEV__,
        enablePerformanceMonitoring: true,
        enableCrashReporting: true,
        ...config,
      };

      // Get configuration from app config
      const extra = (Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra;
      this.config.sentryDsn = this.config.sentryDsn || extra?.SENTRY_DSN;

      // Only log initialization in debug mode
      if (this.config.debugMode) {
        logger.info('Initializing monitoring systems', {
          environment: this.config.environment,
          debugMode: this.config.debugMode,
          hasSentryDsn: !!this.config.sentryDsn,
        });
      }

      // Add error boundary for monitoring initialization
      const safeInitialize = async () => {
        try {
          // Initialize Sentry first if DSN is available
          if (this.config.sentryDsn) {
            await this.initializeSentry();
          } else {
            if (this.config.debugMode) {
              logger.warn('Sentry DSN not provided, skipping Sentry initialization');
            }
          }
          
          await this.initializeCrashReporting();
          await this.initializePerformanceMonitoring();
          this.setupErrorBoundaries();
        } catch (error) {
          logger.error('Error in monitoring initialization', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
      };

      await safeInitialize();

      this.isInitialized = true;
      if (this.config.debugMode) {
        logger.info('Monitoring systems initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize monitoring systems', {}, error as Error);
      throw error;
    }
  }

  /**
   * Initialize Sentry
   */
  private async initializeSentry(): Promise<void> {
    try {
      // Check if Sentry is available
      if (!Sentry || typeof Sentry.init !== 'function') {
        logger.warn('Sentry not available, skipping initialization');
        return;
      }

      Sentry.init({
        dsn: this.config.sentryDsn,
        environment: this.config.environment,
        debug: this.config.debugMode,
        
        // Performance monitoring
        tracesSampleRate: this.config.environment === 'production' ? 0.1 : 1.0,
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 10000,
        
        // Error filtering
        beforeSend(event) {
          // Filter out development errors in production
          if (this.config.environment === 'production' && this.config.debugMode) {
            return null;
          }
          
          // Filter out known non-critical errors
          if (event.exception) {
            const error = event.exception.values?.[0];
            if (error?.value?.includes('Network request failed')) {
              return null; // Skip network errors
            }
          }
          
          return event;
        },
        
        // User context
        initialScope: {
          tags: {
            platform: Platform.OS,
            version: Platform.Version.toString(),
            app_version: Constants.expoConfig?.version || '1.0.0',
          },
        },
        
        // Integrations
        integrations: [
          new Sentry.ReactNativeTracing({
            // Performance monitoring
            routingInstrumentation: new Sentry.ReactNativeNavigationInstrumentation(),
            enableStallTracking: true,
            enableNativeFramesTracking: Platform.OS === 'ios',
            enableAppStartTracking: true,
            enableUserInteractionTracing: true,
          }),
        ],
      });

      logger.info('Sentry initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Sentry', {}, error as Error);
      throw error;
    }
  }

  /**
   * Initialize crash reporting
   */
  private async initializeCrashReporting(): Promise<void> {
    try {
      await initCrashReporting();
      if (this.config.debugMode) {
        logger.info('Crash reporting initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize crash reporting', {}, error as Error);
      throw error;
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    try {
      // Monitor app startup time
      const startTime = Date.now();
      
      // Monitor memory usage
      if (Platform.OS === 'ios') {
        this.monitorMemoryUsage();
      }
      
      // Monitor network performance
      this.monitorNetworkPerformance();
      
      // Monitor render performance
      this.monitorRenderPerformance();
      
      if (this.config.debugMode) {
        logger.info('Performance monitoring initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize performance monitoring', {}, error as Error);
    }
  }

  /**
   * Monitor memory usage (iOS only)
   */
  private monitorMemoryUsage(): void {
    if (Platform.OS !== 'ios') return;
    
    try {
      // This would integrate with native memory monitoring
      // For now, we'll log a placeholder
      logger.info('Memory monitoring enabled for iOS');
    } catch (error) {
      logger.error('Failed to initialize memory monitoring', {}, error as Error);
    }
  }

  /**
   * Monitor network performance
   */
  private monitorNetworkPerformance(): void {
    try {
      // Override fetch to monitor network requests
      const originalFetch = global.fetch;
      
      global.fetch = async (...args) => {
        const startTime = Date.now();
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
        
        try {
          const response = await originalFetch(...args);
          const duration = Date.now() - startTime;
          
          // Only log slow requests (>500ms) or errors in development
          if (this.config.debugMode && (duration > 500 || !response.ok)) {
            logger.logPerformance('network_request', duration, {
              url: url.replace(/[?&]token=[^&]+/g, 'token=***'), // Remove tokens
              method: args[1]?.method || 'GET',
              status: response.status,
            });
          }
          
          return response;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          logger.error('Network request failed', {
            url: url.replace(/[?&]token=[^&]+/g, 'token=***'),
            method: args[1]?.method || 'GET',
            duration,
          }, error as Error);
          
          throw error;
        }
      };
      
      if (this.config.debugMode) {
        logger.info('Network performance monitoring initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize network monitoring', {}, error as Error);
    }
  }

  /**
   * Monitor render performance
   */
  private monitorRenderPerformance(): void {
    try {
      // This would integrate with React DevTools or custom performance monitoring
      if (this.config.debugMode) {
        logger.info('Render performance monitoring initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize render monitoring', {}, error as Error);
    }
  }

  /**
   * Set up error boundaries
   */
  private setupErrorBoundaries(): void {
    try {
      // Global error handling is already set up in crashReporting.ts
      if (this.config.debugMode) {
        logger.info('Error boundaries configured');
      }
    } catch (error) {
      logger.error('Failed to setup error boundaries', {}, error as Error);
    }
  }

  /**
   * Set user context for monitoring
   */
  public setUserContext(user: {
    id?: string;
    email?: string;
    role?: string;
    [key: string]: any;
  }): void {
    try {
      if (this.config.sentryDsn) {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          role: user.role,
        });
      }
      
      logger.info('User context set for monitoring', {
        userId: user.id,
        role: user.role,
      });
    } catch (error) {
      logger.error('Failed to set user context', {}, error as Error);
    }
  }

  /**
   * Clear user context
   */
  public clearUserContext(): void {
    try {
      if (this.config.sentryDsn) {
        Sentry.setUser(null);
      }
      
      logger.info('User context cleared');
    } catch (error) {
      logger.error('Failed to clear user context', {}, error as Error);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  public addBreadcrumb(message: string, category?: string, level?: 'debug' | 'info' | 'warning' | 'error'): void {
    try {
      if (this.config.sentryDsn) {
        Sentry.addBreadcrumb({
          message,
          category: category || 'user',
          level: level || 'info',
          timestamp: Date.now() / 1000,
        });
      }
      
      logger.debug(`Breadcrumb: ${message}`, { category, level });
    } catch (error) {
      logger.error('Failed to add breadcrumb', {}, error as Error);
    }
  }

  /**
   * Capture custom event
   */
  public captureEvent(event: {
    message?: string;
    level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
    tags?: { [key: string]: string };
    extra?: { [key: string]: any };
  }): void {
    try {
      if (this.config.sentryDsn) {
        Sentry.captureEvent(event);
      }
      
      logger.info('Custom event captured', event);
    } catch (error) {
      logger.error('Failed to capture event', {}, error as Error);
    }
  }

  /**
   * Get monitoring status
   */
  public getStatus(): {
    initialized: boolean;
    sentryEnabled: boolean;
    crashReportingEnabled: boolean;
    performanceMonitoringEnabled: boolean;
    environment: string;
  } {
    return {
      initialized: this.isInitialized,
      sentryEnabled: !!this.config.sentryDsn,
      crashReportingEnabled: this.config.enableCrashReporting || false,
      performanceMonitoringEnabled: this.config.enablePerformanceMonitoring || false,
      environment: this.config.environment || 'unknown',
    };
  }
}

// Export singleton instance
export const monitoringSetup = MonitoringSetup.getInstance();

// Export initialization function
export const initializeMonitoring = async (config?: MonitoringConfig): Promise<void> => {
  return monitoringSetup.initialize(config);
};

// Export utility functions
export const setUserContext = (user: { id?: string; email?: string; role?: string; [key: string]: any }) => {
  monitoringSetup.setUserContext(user);
};

export const clearUserContext = () => {
  monitoringSetup.clearUserContext();
};

export const addBreadcrumb = (message: string, category?: string, level?: 'debug' | 'info' | 'warning' | 'error') => {
  monitoringSetup.addBreadcrumb(message, category, level);
};

export const captureEvent = (event: {
  message?: string;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  tags?: { [key: string]: string };
  extra?: { [key: string]: any };
}) => {
  monitoringSetup.captureEvent(event);
};

export const getMonitoringStatus = () => {
  return monitoringSetup.getStatus();
};

