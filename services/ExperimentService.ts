/**
 * SwiftGuard Experiment Service
 * Provides A/B testing and experiment management capabilities
 */

import { supabase } from '../supabaseClient';
import { logger } from '../utils/Logger';
import { AnalyticsService } from './AnalyticsService';

export interface Experiment {
  experimentKey: string;
  experimentName: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  targetAudience: 'all' | 'guards' | 'clients' | 'admins';
  trafficAllocation: number;
  variants: ExperimentVariant[];
  successMetrics: ExperimentMetric[];
  startDate?: string;
  endDate?: string;
}

export interface ExperimentVariant {
  key: string;
  name: string;
  description: string;
}

export interface ExperimentMetric {
  name: string;
  description: string;
}

export interface ExperimentAssignment {
  experimentKey: string;
  variant: string;
  assignedAt: string;
  expiresAt?: string;
}

export interface ExperimentEvent {
  experimentKey: string;
  eventName: string;
  eventProperties: Record<string, any>;
  sessionId?: string;
}

class ExperimentService {
  private static instance: ExperimentService;
  private assignments: Map<string, ExperimentAssignment> = new Map();
  private userId: string | null = null;
  private sessionId: string | null = null;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): ExperimentService {
    if (!ExperimentService.instance) {
      ExperimentService.instance = new ExperimentService();
    }
    return ExperimentService.instance;
  }

  /**
   * Initialize experiment service for a user
   */
  public async initialize(userId: string): Promise<void> {
    try {
      this.userId = userId;
      await this.loadUserAssignments();
      logger.info('Experiment service initialized', { userId });
    } catch (error) {
      logger.error('Failed to initialize experiment service', { 
        error: (error as Error).message, 
        userId 
      });
    }
  }

  /**
   * Get user's variant for an experiment
   */
  public async getVariant(experimentKey: string): Promise<string | null> {
    if (!this.userId) {
      logger.warn('Cannot get variant: user not initialized');
      return null;
    }

    try {
      // Check if user is already assigned
      const assignment = this.assignments.get(experimentKey);
      if (assignment) {
        // Check if assignment has expired
        if (assignment.expiresAt && new Date(assignment.expiresAt) < new Date()) {
          this.assignments.delete(experimentKey);
        } else {
          return assignment.variant;
        }
      }

      // Assign user to experiment
      const { data, error } = await supabase.rpc('assign_user_to_experiment', {
        p_user_id: this.userId,
        p_experiment_key: experimentKey
      });

      if (error) {
        logger.error('Failed to assign user to experiment', { 
          error: error.message, 
          experimentKey, 
          userId: this.userId 
        });
        return null;
      }

      if (!data || data.length === 0) {
        logger.info('User not assigned to experiment', { 
          experimentKey, 
          userId: this.userId 
        });
        return null;
      }

      const result = data[0];
      if (result.assigned && result.variant) {
        // Cache the assignment
        this.assignments.set(experimentKey, {
          experimentKey,
          variant: result.variant,
          assignedAt: new Date().toISOString()
        });

        // Track assignment event
        await this.trackEvent({
          experimentKey,
          eventName: 'experiment_assigned',
          eventProperties: {
            variant: result.variant,
            assigned: true
          }
        });

        logger.info('User assigned to experiment', { 
          experimentKey, 
          variant: result.variant, 
          userId: this.userId 
        });

        return result.variant;
      }

      return null;

    } catch (error) {
      logger.error('Failed to get experiment variant', { 
        error: (error as Error).message, 
        experimentKey, 
        userId: this.userId 
      });
      return null;
    }
  }

  /**
   * Track an experiment event
   */
  public async trackEvent(event: ExperimentEvent): Promise<boolean> {
    if (!this.userId) {
      logger.warn('Cannot track experiment event: user not initialized');
      return false;
    }

    try {
      const { error } = await supabase.rpc('track_experiment_event', {
        p_user_id: this.userId,
        p_experiment_key: event.experimentKey,
        p_event_name: event.eventName,
        p_event_properties: event.eventProperties,
        p_session_id: event.sessionId || this.sessionId
      });

      if (error) {
        logger.error('Failed to track experiment event', { 
          error: error.message, 
          experimentKey: event.experimentKey, 
          eventName: event.eventName,
          userId: this.userId 
        });
        return false;
      }

      // Also track in analytics
      await AnalyticsService.trackEvent(event.eventName, {
        ...event.eventProperties,
        experiment_key: event.experimentKey,
        session_id: event.sessionId || this.sessionId
      });

      logger.info('Experiment event tracked', { 
        experimentKey: event.experimentKey, 
        eventName: event.eventName,
        userId: this.userId 
      });

      return true;

    } catch (error) {
      logger.error('Failed to track experiment event', { 
        error: (error as Error).message, 
        experimentKey: event.experimentKey, 
        eventName: event.eventName,
        userId: this.userId 
      });
      return false;
    }
  }

  /**
   * Track conversion event for experiment
   */
  public async trackConversion(experimentKey: string, conversionName: string, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackEvent({
      experimentKey,
      eventName: conversionName,
      eventProperties: properties
    });
  }

  /**
   * Track funnel step for experiment
   */
  public async trackFunnelStep(experimentKey: string, stepName: string, stepNumber: number, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackEvent({
      experimentKey,
      eventName: 'funnel_step',
      eventProperties: {
        step_name: stepName,
        step_number: stepNumber,
        ...properties
      }
    });
  }

  /**
   * Get user's experiment assignments
   */
  public async getUserAssignments(): Promise<ExperimentAssignment[]> {
    if (!this.userId) {
      logger.warn('Cannot get user assignments: user not initialized');
      return [];
    }

    try {
      const { data, error } = await supabase.rpc('get_user_experiment_assignments', {
        p_user_id: this.userId
      });

      if (error) {
        logger.error('Failed to get user experiment assignments', { 
          error: error.message, 
          userId: this.userId 
        });
        return [];
      }

      if (!data) return [];

      const assignments: ExperimentAssignment[] = data.map((assignment: any) => ({
        experimentKey: assignment.experiment_key,
        variant: assignment.variant,
        assignedAt: assignment.assigned_at,
        expiresAt: assignment.expires_at
      }));

      // Update local cache
      this.assignments.clear();
      assignments.forEach(assignment => {
        this.assignments.set(assignment.experimentKey, assignment);
      });

      return assignments;

    } catch (error) {
      logger.error('Failed to get user experiment assignments', { 
        error: (error as Error).message, 
        userId: this.userId 
      });
      return [];
    }
  }

  /**
   * Load user assignments from server
   */
  private async loadUserAssignments(): Promise<void> {
    if (!this.userId) return;

    try {
      const assignments = await this.getUserAssignments();
      logger.info('User experiment assignments loaded', { 
        count: assignments.length, 
        userId: this.userId 
      });
    } catch (error) {
      logger.error('Failed to load user experiment assignments', { 
        error: (error as Error).message, 
        userId: this.userId 
      });
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.assignments.clear();
  }

  /**
   * Get experiment assignment status
   */
  public getAssignmentStatus(experimentKey: string): {
    isAssigned: boolean;
    variant: string | null;
    assignedAt: string | null;
    expiresAt: string | null;
  } {
    const assignment = this.assignments.get(experimentKey);
    
    if (!assignment) {
      return {
        isAssigned: false,
        variant: null,
        assignedAt: null,
        expiresAt: null
      };
    }

    // Check if assignment has expired
    if (assignment.expiresAt && new Date(assignment.expiresAt) < new Date()) {
      this.assignments.delete(experimentKey);
      return {
        isAssigned: false,
        variant: null,
        assignedAt: null,
        expiresAt: null
      };
    }

    return {
      isAssigned: true,
      variant: assignment.variant,
      assignedAt: assignment.assignedAt,
      expiresAt: assignment.expiresAt || null
    };
  }

  /**
   * Get all active assignments
   */
  public getActiveAssignments(): ExperimentAssignment[] {
    const now = new Date();
    return Array.from(this.assignments.values()).filter(assignment => 
      !assignment.expiresAt || new Date(assignment.expiresAt) > now
    );
  }

  /**
   * Check if user is in experiment
   */
  public isInExperiment(experimentKey: string): boolean {
    const status = this.getAssignmentStatus(experimentKey);
    return status.isAssigned;
  }

  /**
   * Get experiment variant for user
   */
  public getExperimentVariant(experimentKey: string): string | null {
    const status = this.getAssignmentStatus(experimentKey);
    return status.variant;
  }
}

export const experimentService = ExperimentService.getInstance();




