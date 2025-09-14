import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
// import * as Sentry from '@sentry/react-native'; // Temporarily disabled for EAS update

// Types for error tracking
interface ErrorReport {
  id: string;
  timestamp: string;
  error: string;
  stack?: string;
  userAgent: string;
  userId?: string;
  screen?: string;
  action?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  id: string;
  timestamp: string;
  metricName: string;
  value: number;
  userId?: string;
  screen?: string;
  metadata?: Record<string, any>;
}

class ProductionMonitoring {
  private isProduction: boolean;
  private userId?: string;
  private currentScreen?: string;

  constructor() {
    this.isProduction = !__DEV__;
  }

  /**
   * Initialize monitoring with user context
   */
  init(userId?: string) {
    this.userId = userId;
    
    // Initialize Sentry - temporarily disabled
    // this.initializeSentry();
    
    this.setupGlobalErrorHandler();
    console.log(`✅ Production Monitoring initialized for user: ${userId}`);
  }

  /**
   * Initialize Sentry for error tracking - temporarily disabled
   */
  private initializeSentry() {
    // Temporarily disabled for EAS update
    console.log('⚠️ Sentry initialization temporarily disabled for EAS update');
    /*
    if (this.isProduction) {
      const sentryDsn = Constants.expoConfig?.extra?.SENTRY_DSN || process.env.SENTRY_DSN;
      
      if (sentryDsn) {
        Sentry.init({
          dsn: sentryDsn,
          environment: this.isProduction ? 'production' : 'development',
          release: Constants.expoConfig?.version || '1.0.0',
          dist: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1',
          integrations: [
            new Sentry.ReactNativeTracing({
              routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
            }),
          ],
          tracesSampleRate: this.isProduction ? 0.1 : 1.0,
          beforeSend(event) {
            // Filter out sensitive data
            if (event.user) {
              delete event.user.email;
              delete event.user.ip_address;
            }
            return event;
          },
        });

        // Set user context
        if (this.userId) {
          Sentry.setUser({ id: this.userId });
        }

        console.log('✅ Sentry initialized successfully');
      } else {
        console.warn('⚠️ SENTRY_DSN not found, monitoring will use local storage only');
      }
    }
    */
  }

  /**
   * Set current screen for context
   */
  setCurrentScreen(screenName: string) {
    this.currentScreen = screenName;
  }

  /**
   * Track errors with automatic reporting
   */
  async trackError(
    error: Error | string,
    context?: {
      screen?: string;
      action?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      metadata?: Record<string, any>;
    }
  ) {
    try {
      const errorReport: ErrorReport = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        error: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'object' ? error.stack : undefined,
        userAgent: `SwiftGuard/${Constants.expoConfig?.version || '1.0.0'}`,
        userId: this.userId,
        screen: context?.screen || this.currentScreen,
        action: context?.action,
        severity: context?.severity || 'medium',
        metadata: {
          ...context?.metadata,
          deviceInfo: {
            platform: Constants.platform,
            appVersion: Constants.expoConfig?.version,
            buildVersion: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode,
          }
        }
      };

      // Log locally for debugging
      if (__DEV__) {
        console.error('🚨 Error tracked:', errorReport);
      }

      // Store locally for offline sync
      await this.storeErrorLocally(errorReport);

      // Send to monitoring service if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await this.sendErrorToService(errorReport);
      }

      // Show user-friendly message for critical errors
      if (context?.severity === 'critical') {
        Alert.alert(
          'Something went wrong',
          'We\'re working to fix this issue. Please try again later.',
          [{ text: 'OK' }]
        );
      }

    } catch (monitoringError) {
      console.error('❌ Error in monitoring system:', monitoringError);
    }
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(
    metricName: string,
    value: number,
    context?: {
      screen?: string;
      metadata?: Record<string, any>;
    }
  ) {
    try {
      const metric: PerformanceMetric = {
        id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        metricName,
        value,
        userId: this.userId,
        screen: context?.screen || this.currentScreen,
        metadata: context?.metadata
      };

      if (__DEV__) {
        console.log(`📊 Performance: ${metricName} = ${value}ms`);
      }

      // Store and send performance data
      await this.storePerformanceLocally(metric);
      
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await this.sendPerformanceToService(metric);
      }

    } catch (error) {
      console.error('❌ Error tracking performance:', error);
    }
  }

  /**
   * Track user actions and events
   */
  async trackEvent(
    eventName: string,
    properties?: Record<string, any>
  ) {
    try {
      if (__DEV__) {
        console.log(`📱 Event: ${eventName}`, properties);
      }

      // Privacy-focused event tracking
      const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        eventName,
        userId: this.userId, // Only if user consented
        screen: this.currentScreen,
        properties: {
          ...properties,
          platform: Constants.platform?.ios ? 'ios' : 'android'
        }
      };

      await this.storeEventLocally(event);

      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await this.sendEventToService(event);
      }

    } catch (error) {
      console.error('❌ Error tracking event:', error);
    }
  }

  /**
   * Monitor app crashes and critical failures
   */
  private setupGlobalErrorHandler() {
    if (this.isProduction) {
      const originalHandler = ErrorUtils.getGlobalHandler();
      
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.trackError(error, {
          severity: 'critical',
          action: 'app_crash',
          metadata: { isFatal }
        });

        // Call original handler
        originalHandler(error, isFatal);
      });
    }
  }

  /**
   * Store error locally for offline sync
   */
  private async storeErrorLocally(error: ErrorReport) {
    try {
      const errors = await this.getStoredErrors();
      errors.push(error);
      
      // Keep only last 100 errors to manage storage
      if (errors.length > 100) {
        errors.splice(0, errors.length - 100);
      }
      
      await AsyncStorage.setItem('monitoring_errors', JSON.stringify(errors));
    } catch (error) {
      console.error('❌ Failed to store error locally:', error);
    }
  }

  /**
   * Store performance data locally
   */
  private async storePerformanceLocally(metric: PerformanceMetric) {
    try {
      const metrics = await this.getStoredMetrics();
      metrics.push(metric);
      
      // Keep only last 50 metrics
      if (metrics.length > 50) {
        metrics.splice(0, metrics.length - 50);
      }
      
      await AsyncStorage.setItem('monitoring_metrics', JSON.stringify(metrics));
    } catch (error) {
      console.error('❌ Failed to store metric locally:', error);
    }
  }

  /**
   * Store events locally
   */
  private async storeEventLocally(event: any) {
    try {
      const events = await this.getStoredEvents();
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      await AsyncStorage.setItem('monitoring_events', JSON.stringify(events));
    } catch (error) {
      console.error('❌ Failed to store event locally:', error);
    }
  }

  /**
   * Send error to monitoring service
   */
  private async sendErrorToService(error: ErrorReport) {
    try {
      if (__DEV__) {
        console.log('🔄 Would send error to monitoring service:', error.id);
        return;
      }

      // Send to Sentry - temporarily disabled
      /*
      if (this.isProduction) {
        Sentry.withScope((scope) => {
          scope.setTag('errorId', error.id);
          scope.setTag('severity', error.severity);
          scope.setLevel(this.mapSeverityToSentryLevel(error.severity));
          
          if (error.screen) {
            scope.setTag('screen', error.screen);
          }
          
          if (error.action) {
            scope.setTag('action', error.action);
          }
          
          if (error.metadata) {
            scope.setContext('metadata', error.metadata);
          }

          Sentry.captureException(new Error(error.error), {
            extra: {
              stack: error.stack,
              userAgent: error.userAgent,
              timestamp: error.timestamp
            }
          });
        });
      }
      */

    } catch (error) {
      console.error('❌ Failed to send error to service:', error);
    }
  }

  /**
   * Map our severity levels to Sentry levels - temporarily disabled
   */
  private mapSeverityToSentryLevel(severity: string): string {
    // Temporarily disabled for EAS update
    return severity;
    /*
    switch (severity) {
      case 'critical': return 'fatal';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'error';
    }
    */
  }

  /**
   * Send performance data to service
   */
  private async sendPerformanceToService(metric: PerformanceMetric) {
    try {
      if (__DEV__) {
        console.log('🔄 Would send metric to monitoring service:', metric.id);
        return;
      }

      // Implement your performance monitoring service integration
      
    } catch (error) {
      console.error('❌ Failed to send metric to service:', error);
    }
  }

  /**
   * Send events to analytics service
   */
  private async sendEventToService(event: any) {
    try {
      if (__DEV__) {
        console.log('🔄 Would send event to analytics service:', event.id);
        return;
      }

      // Implement your analytics service integration
      
    } catch (error) {
      console.error('❌ Failed to send event to service:', error);
    }
  }

  /**
   * Get stored errors
   */
  private async getStoredErrors(): Promise<ErrorReport[]> {
    try {
      const stored = await AsyncStorage.getItem('monitoring_errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get stored metrics
   */
  private async getStoredMetrics(): Promise<PerformanceMetric[]> {
    try {
      const stored = await AsyncStorage.getItem('monitoring_metrics');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get stored events
   */
  private async getStoredEvents(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem('monitoring_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Sync offline data when connection is restored
   */
  async syncOfflineData() {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) return;

      const [errors, metrics, events] = await Promise.all([
        this.getStoredErrors(),
        this.getStoredMetrics(),
        this.getStoredEvents()
      ]);

      // Send all stored data
      for (const error of errors) {
        await this.sendErrorToService(error);
      }

      for (const metric of metrics) {
        await this.sendPerformanceToService(metric);
      }

      for (const event of events) {
        await this.sendEventToService(event);
      }

      // Clear stored data after successful sync
      await AsyncStorage.multiRemove([
        'monitoring_errors',
        'monitoring_metrics', 
        'monitoring_events'
      ]);

      console.log('✅ Offline monitoring data synced successfully');

    } catch (error) {
      console.error('❌ Failed to sync offline monitoring data:', error);
    }
  }

  /**
   * Performance timing utility
   */
  createPerformanceTimer(name: string) {
    const startTime = Date.now();
    
    return {
      end: () => {
        const duration = Date.now() - startTime;
        this.trackPerformance(name, duration);
        return duration;
      }
    };
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats() {
    try {
      const [errors, metrics, events] = await Promise.all([
        this.getStoredErrors(),
        this.getStoredMetrics(),
        this.getStoredEvents()
      ]);

      return {
        totalErrors: errors.length,
        criticalErrors: errors.filter(e => e.severity === 'critical').length,
        averagePerformance: metrics.length > 0 
          ? metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length 
          : 0,
        totalEvents: events.length,
        lastSync: await AsyncStorage.getItem('last_monitoring_sync')
      };
    } catch (error) {
      console.error('❌ Failed to get monitoring stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const productionMonitoring = new ProductionMonitoring();

// Utility functions for easy use
export const trackError = (error: Error | string, context?: any) => 
  productionMonitoring.trackError(error, context);

export const trackPerformance = (name: string, value: number, context?: any) =>
  productionMonitoring.trackPerformance(name, value, context);

export const trackEvent = (name: string, properties?: any) =>
  productionMonitoring.trackEvent(name, properties);

export const createTimer = (name: string) =>
  productionMonitoring.createPerformanceTimer(name);

export default productionMonitoring;
