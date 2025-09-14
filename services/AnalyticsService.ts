import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../supabaseClient';

interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  sessionId?: string;
  userId?: string;
  timestamp: number;
}

interface QueuedEvent extends AnalyticsEvent {
  id: string;
  retryCount: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private eventQueue: QueuedEvent[] = [];
  private sessionId: string;
  private isOnline: boolean = true;
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly MAX_RETRY_COUNT = 3;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly BATCH_SIZE = 10;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeNetworkListener();
    this.startFlushTimer();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // If we just came back online, flush the queue
      if (wasOffline && this.isOnline) {
        this.flushQueue();
      }
    });
  }

  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      if (this.isOnline && this.eventQueue.length > 0) {
        this.flushQueue();
      }
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Track an analytics event
   */
  public async track(
    eventName: string,
    properties?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        eventName,
        properties: this.sanitizeProperties(properties),
        sessionId: this.sessionId,
        userId,
        timestamp: Date.now()
      };

      // Add to queue
      await this.addToQueue(event);

      // If online and queue is getting large, flush immediately
      if (this.isOnline && this.eventQueue.length >= this.BATCH_SIZE) {
        this.flushQueue();
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Track critical business events with immediate flush
   */
  public async trackCritical(
    eventName: string,
    properties?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    try {
      await this.track(eventName, properties, userId);
      
      // Force immediate flush for critical events
      if (this.isOnline) {
        await this.flushQueue();
      }
    } catch (error) {
      console.error('Critical analytics tracking error:', error);
    }
  }

  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> {
    if (!properties) return {};

    const sanitized = { ...properties };

    // Remove PII and sensitive data
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'ssn', 'creditCard',
      'email', 'phone', 'address', 'ipAddress'
    ];

    sensitiveFields.forEach(field => {
      delete sanitized[field];
    });

    // Limit string lengths
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '...';
      }
    });

    return sanitized;
  }

  private async addToQueue(event: AnalyticsEvent): Promise<void> {
    const queuedEvent: QueuedEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0
    };

    this.eventQueue.push(queuedEvent);

    // Prevent queue from growing too large
    if (this.eventQueue.length > this.MAX_QUEUE_SIZE) {
      this.eventQueue = this.eventQueue.slice(-this.MAX_QUEUE_SIZE);
    }

    // Store in local storage for persistence
    await this.persistQueue();
  }

  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('analytics_queue', JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Failed to persist analytics queue:', error);
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('analytics_queue');
      if (stored) {
        this.eventQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load analytics queue:', error);
      this.eventQueue = [];
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.isOnline) {
      return;
    }

    const eventsToFlush = this.eventQueue.splice(0, this.BATCH_SIZE);
    const successfulEvents: string[] = [];
    const failedEvents: QueuedEvent[] = [];

    // Send events in batch
    for (const event of eventsToFlush) {
      try {
        await this.sendEvent(event);
        successfulEvents.push(event.id);
      } catch (error) {
        console.error('Failed to send analytics event:', error);
        
        // Retry logic
        if (event.retryCount < this.MAX_RETRY_COUNT) {
          event.retryCount++;
          failedEvents.push(event);
        }
      }
    }

    // Add failed events back to queue
    this.eventQueue.unshift(...failedEvents);

    // Update persistent storage
    await this.persistQueue();

    if (successfulEvents.length > 0) {
      console.log(`Analytics: Successfully sent ${successfulEvents.length} events`);
    }
  }

  private async sendEvent(event: QueuedEvent): Promise<void> {
    const { data, error } = await supabase.functions.invoke('track-event', {
      body: {
        eventName: event.eventName,
        properties: event.properties,
        sessionId: event.sessionId,
        userId: event.userId
      }
    });

    if (error) {
      throw new Error(`Analytics API error: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error('Analytics API returned unsuccessful response');
    }
  }

  /**
   * Initialize analytics service
   */
  public async initialize(): Promise<void> {
    await this.loadQueue();
    
    // Track app initialization
    await this.track('app_open', {
      platform: 'react-native',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track user authentication
   */
  public async trackAuth(userId: string, success: boolean): Promise<void> {
    await this.trackCritical(
      success ? 'auth_success' : 'auth_failed',
      { userId, timestamp: new Date().toISOString() },
      userId
    );
  }

  /**
   * Track job creation flow
   */
  public async trackJobCreation(userId: string, step: 'started' | 'completed' | 'failed', properties?: Record<string, any>): Promise<void> {
    await this.trackCritical(
      `job_create_${step}`,
      { ...properties, timestamp: new Date().toISOString() },
      userId
    );
  }

  /**
   * Track payment events
   */
  public async trackPayment(userId: string, status: 'started' | 'succeeded' | 'failed', properties?: Record<string, any>): Promise<void> {
    await this.trackCritical(
      `payment_${status}`,
      { ...properties, timestamp: new Date().toISOString() },
      userId
    );
  }

  /**
   * Track emergency events
   */
  public async trackEmergency(userId: string, action: 'triggered' | 'resolved', properties?: Record<string, any>): Promise<void> {
    await this.trackCritical(
      `panic_${action}`,
      { ...properties, timestamp: new Date().toISOString() },
      userId
    );
  }

  /**
   * Get analytics queue status
   */
  public getQueueStatus(): { queueSize: number; isOnline: boolean; sessionId: string } {
    return {
      queueSize: this.eventQueue.length,
      isOnline: this.isOnline,
      sessionId: this.sessionId
    };
  }

  /**
   * Force flush all queued events
   */
  public async forceFlush(): Promise<void> {
    await this.flushQueue();
  }

  /**
   * Clear analytics queue (use with caution)
   */
  public async clearQueue(): Promise<void> {
    this.eventQueue = [];
    await AsyncStorage.removeItem('analytics_queue');
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();

// Export class for testing
export { AnalyticsService };

// Convenience functions
export const trackEvent = (eventName: string, properties?: Record<string, any>, userId?: string) =>
  analytics.track(eventName, properties, userId);

export const trackCritical = (eventName: string, properties?: Record<string, any>, userId?: string) =>
  analytics.trackCritical(eventName, properties, userId);

export default analytics;

