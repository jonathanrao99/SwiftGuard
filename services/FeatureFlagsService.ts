/**
 * SwiftGuard Feature Flags Service
 * Provides client-side feature flag management with caching and sticky assignment
 */

import { supabase } from '../supabaseClient';
import { logger } from '../utils/Logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeatureFlag {
  flagKey: string;
  flagName: string;
  isEnabled: boolean;
  metadata: Record<string, any>;
}

export interface FeatureFlagAssignment {
  flagKey: string;
  isEnabled: boolean;
  assignedAt: string;
  expiresAt?: string;
}

class FeatureFlagsService {
  private static instance: FeatureFlagsService;
  private cache: Map<string, FeatureFlag> = new Map();
  private assignments: Map<string, FeatureFlagAssignment> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly STORAGE_KEY = 'swiftguard_feature_flags';
  private readonly ASSIGNMENTS_KEY = 'swiftguard_feature_assignments';
  private cacheTimestamp: number = 0;
  private userId: string | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): FeatureFlagsService {
    if (!FeatureFlagsService.instance) {
      FeatureFlagsService.instance = new FeatureFlagsService();
    }
    return FeatureFlagsService.instance;
  }

  /**
   * Initialize feature flags for a user
   */
  public async initialize(userId: string): Promise<void> {
    try {
      this.userId = userId;
      await this.loadFeatureFlags();
      await this.loadUserAssignments();
      logger.info('Feature flags initialized', { userId });
    } catch (error) {
      logger.error('Failed to initialize feature flags', { 
        error: (error as Error).message, 
        userId 
      });
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  public isEnabled(flagKey: string): boolean {
    // Check user-specific assignment first
    const assignment = this.assignments.get(flagKey);
    if (assignment) {
      // Check if assignment has expired
      if (assignment.expiresAt && new Date(assignment.expiresAt) < new Date()) {
        this.assignments.delete(flagKey);
        this.saveAssignmentsToStorage();
      } else {
        return assignment.isEnabled;
      }
    }

    // Check cached flag
    const flag = this.cache.get(flagKey);
    if (flag) {
      return flag.isEnabled;
    }

    // Default to false if flag not found
    return false;
  }

  /**
   * Get feature flag metadata
   */
  public getMetadata(flagKey: string): Record<string, any> {
    const flag = this.cache.get(flagKey);
    return flag?.metadata || {};
  }

  /**
   * Get all feature flags
   */
  public getAllFlags(): FeatureFlag[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get enabled feature flags
   */
  public getEnabledFlags(): FeatureFlag[] {
    return this.getAllFlags().filter(flag => this.isEnabled(flag.flagKey));
  }

  /**
   * Refresh feature flags from server
   */
  public async refresh(): Promise<void> {
    if (!this.userId) {
      logger.warn('Cannot refresh feature flags: user not initialized');
      return;
    }

    try {
      await this.loadFeatureFlags();
      await this.loadUserAssignments();
      logger.info('Feature flags refreshed', { userId: this.userId });
    } catch (error) {
      logger.error('Failed to refresh feature flags', { 
        error: (error as Error).message, 
        userId: this.userId 
      });
    }
  }

  /**
   * Load feature flags from server
   */
  private async loadFeatureFlags(): Promise<void> {
    try {
      const environment = process.env.EXPO_PUBLIC_ENVIRONMENT || 'production';
      
      const { data, error } = await supabase.rpc('get_user_feature_flags', {
        p_user_id: this.userId,
        p_environment: environment
      });

      if (error) {
        logger.error('Failed to load feature flags', { error: error.message });
        return;
      }

      if (!data) {
        logger.warn('No feature flags data received');
        return;
      }

      // Update cache
      this.cache.clear();
      data.forEach((flag: any) => {
        this.cache.set(flag.flag_key, {
          flagKey: flag.flag_key,
          flagName: flag.flag_name,
          isEnabled: flag.is_enabled,
          metadata: flag.metadata || {}
        });
      });

      this.cacheTimestamp = Date.now();
      await this.saveToStorage();

      logger.info('Feature flags loaded', { 
        count: data.length, 
        userId: this.userId 
      });

    } catch (error) {
      logger.error('Failed to load feature flags', { 
        error: (error as Error).message, 
        userId: this.userId 
      });
    }
  }

  /**
   * Load user-specific feature flag assignments
   */
  private async loadUserAssignments(): Promise<void> {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .from('feature_flag_assignments')
        .select('*')
        .eq('user_id', this.userId)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) {
        logger.error('Failed to load feature flag assignments', { error: error.message });
        return;
      }

      if (!data) return;

      // Update assignments cache
      this.assignments.clear();
      data.forEach((assignment: any) => {
        this.assignments.set(assignment.flag_key, {
          flagKey: assignment.flag_key,
          isEnabled: assignment.is_enabled,
          assignedAt: assignment.assigned_at,
          expiresAt: assignment.expires_at
        });
      });

      await this.saveAssignmentsToStorage();

      logger.info('Feature flag assignments loaded', { 
        count: data.length, 
        userId: this.userId 
      });

    } catch (error) {
      logger.error('Failed to load feature flag assignments', { 
        error: (error as Error).message, 
        userId: this.userId 
      });
    }
  }

  /**
   * Save feature flags to local storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      const data = {
        flags: Array.from(this.cache.entries()),
        timestamp: this.cacheTimestamp
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save feature flags to storage', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Load feature flags from local storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) return;

      const parsed = JSON.parse(data);
      const { flags, timestamp } = parsed;

      // Check if cache is still valid
      if (Date.now() - timestamp < this.CACHE_TTL) {
        this.cache = new Map(flags);
        this.cacheTimestamp = timestamp;
        logger.info('Feature flags loaded from cache', { count: flags.length });
      }

      // Load assignments
      await this.loadAssignmentsFromStorage();

    } catch (error) {
      logger.error('Failed to load feature flags from storage', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Save feature flag assignments to local storage
   */
  private async saveAssignmentsToStorage(): Promise<void> {
    try {
      const data = Array.from(this.assignments.entries());
      await AsyncStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save feature flag assignments to storage', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Load feature flag assignments from local storage
   */
  private async loadAssignmentsFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.ASSIGNMENTS_KEY);
      if (!data) return;

      const assignments = JSON.parse(data);
      this.assignments = new Map(assignments);
      
      logger.info('Feature flag assignments loaded from cache', { 
        count: assignments.length 
      });

    } catch (error) {
      logger.error('Failed to load feature flag assignments from storage', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Clear all cached data
   */
  public async clearCache(): Promise<void> {
    this.cache.clear();
    this.assignments.clear();
    this.cacheTimestamp = 0;
    
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem(this.ASSIGNMENTS_KEY);
    } catch (error) {
      logger.error('Failed to clear feature flags cache', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Get feature flag status for analytics
   */
  public getFlagStatus(flagKey: string): {
    isEnabled: boolean;
    source: 'assignment' | 'cache' | 'default';
    metadata: Record<string, any>;
  } {
    const assignment = this.assignments.get(flagKey);
    if (assignment) {
      return {
        isEnabled: assignment.isEnabled,
        source: 'assignment',
        metadata: this.getMetadata(flagKey)
      };
    }

    const flag = this.cache.get(flagKey);
    if (flag) {
      return {
        isEnabled: flag.isEnabled,
        source: 'cache',
        metadata: flag.metadata
      };
    }

    return {
      isEnabled: false,
      source: 'default',
      metadata: {}
    };
  }

  /**
   * Check if cache is stale
   */
  public isCacheStale(): boolean {
    return Date.now() - this.cacheTimestamp > this.CACHE_TTL;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    flagCount: number;
    assignmentCount: number;
    cacheAge: number;
    isStale: boolean;
  } {
    return {
      flagCount: this.cache.size,
      assignmentCount: this.assignments.size,
      cacheAge: Date.now() - this.cacheTimestamp,
      isStale: this.isCacheStale()
    };
  }
}

export const featureFlagsService = FeatureFlagsService.getInstance();





