/**
 * SwiftGuard Preflight Service
 * Performs startup checks for app version, kill switch, and feature flags
 */

import { supabase } from '../supabaseClient';
import { logger } from '../utils/Logger';
import Constants from 'expo-constants';

export interface PreflightCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  action?: 'block' | 'warn' | 'continue';
}

export interface AppVersionInfo {
  platform: string;
  currentVersion: string;
  minSupportedVersion: string;
  minRecommendedVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  updateMessage?: string;
  updateUrl?: string;
}

export interface KillSwitchStatus {
  isEnabled: boolean;
  message?: string;
  retryAfter?: number;
}

export interface FeatureFlag {
  flagKey: string;
  flagName: string;
  isEnabled: boolean;
  metadata: Record<string, any>;
}

export interface PreflightResult {
  success: boolean;
  checks: PreflightCheck[];
  appVersion?: AppVersionInfo;
  killSwitch?: KillSwitchStatus;
  featureFlags?: FeatureFlag[];
  runtimeConfig?: Record<string, any>;
}

class PreflightService {
  private static instance: PreflightService;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): PreflightService {
    if (!PreflightService.instance) {
      PreflightService.instance = new PreflightService();
    }
    return PreflightService.instance;
  }

  /**
   * Perform all preflight checks
   */
  public async performPreflightChecks(userId?: string): Promise<PreflightResult> {
    const checks: PreflightCheck[] = [];
    let success = true;

    try {
      logger.info('Starting preflight checks', { userId });

      // Check 1: App version support
      const versionCheck = await this.checkAppVersion();
      checks.push(versionCheck);
      if (versionCheck.status === 'fail') {
        success = false;
      }

      // Check 2: Kill switch status
      const killSwitchCheck = await this.checkKillSwitch();
      checks.push(killSwitchCheck);
      if (killSwitchCheck.status === 'fail') {
        success = false;
      }

      // Check 3: Runtime configuration
      const runtimeConfigCheck = await this.checkRuntimeConfiguration();
      checks.push(runtimeConfigCheck);
      if (runtimeConfigCheck.status === 'fail') {
        success = false;
      }

      // Check 4: Feature flags (if user is authenticated)
      if (userId) {
        const featureFlagsCheck = await this.checkFeatureFlags(userId);
        checks.push(featureFlagsCheck);
        if (featureFlagsCheck.status === 'fail') {
          success = false;
        }
      }

      // Check 5: Network connectivity
      const networkCheck = await this.checkNetworkConnectivity();
      checks.push(networkCheck);
      if (networkCheck.status === 'fail') {
        success = false;
      }

      // Check 6: Database connectivity
      const databaseCheck = await this.checkDatabaseConnectivity();
      checks.push(databaseCheck);
      if (databaseCheck.status === 'fail') {
        success = false;
      }

      const result: PreflightResult = {
        success,
        checks,
        appVersion: await this.getAppVersionInfo(),
        killSwitch: await this.getKillSwitchStatus(),
        featureFlags: userId ? await this.getFeatureFlags(userId) : undefined,
        runtimeConfig: await this.getRuntimeConfiguration(),
      };

      logger.info('Preflight checks completed', { 
        success, 
        checksCount: checks.length,
        failedChecks: checks.filter(c => c.status === 'fail').length
      });

      return result;

    } catch (error) {
      logger.error('Preflight checks failed', { error: (error as Error).message });
      
      checks.push({
        name: 'Preflight System',
        status: 'fail',
        message: 'Preflight system error',
        action: 'block'
      });

      return {
        success: false,
        checks,
      };
    }
  }

  /**
   * Check app version support
   */
  private async checkAppVersion(): Promise<PreflightCheck> {
    try {
      const platform = Constants.platform?.ios ? 'ios' : 'android';
      const currentVersion = Constants.expoConfig?.version || '1.0.0';

      const { data, error } = await supabase.rpc('check_app_version_support', {
        p_platform: platform,
        p_current_version: currentVersion
      });

      if (error) {
        logger.error('Failed to check app version', { error: error.message });
        return {
          name: 'App Version',
          status: 'fail',
          message: 'Unable to verify app version',
          action: 'block'
        };
      }

      if (!data || data.length === 0) {
        return {
          name: 'App Version',
          status: 'pass',
          message: 'App version check passed'
        };
      }

      const versionInfo = data[0];

      if (!versionInfo.is_supported) {
        return {
          name: 'App Version',
          status: 'fail',
          message: 'App version is no longer supported',
          action: 'block'
        };
      }

      if (!versionInfo.is_recommended) {
        return {
          name: 'App Version',
          status: 'warning',
          message: 'App version is outdated',
          action: 'warn'
        };
      }

      return {
        name: 'App Version',
        status: 'pass',
        message: 'App version is supported and up to date'
      };

    } catch (error) {
      logger.error('App version check failed', { error: (error as Error).message });
      return {
        name: 'App Version',
        status: 'fail',
        message: 'App version check failed',
        action: 'block'
      };
    }
  }

  /**
   * Check kill switch status
   */
  private async checkKillSwitch(): Promise<PreflightCheck> {
    try {
      const { data, error } = await supabase.rpc('get_kill_switch_status');

      if (error) {
        logger.error('Failed to check kill switch', { error: error.message });
        return {
          name: 'Kill Switch',
          status: 'fail',
          message: 'Unable to check kill switch status',
          action: 'block'
        };
      }

      if (!data || data.length === 0) {
        return {
          name: 'Kill Switch',
          status: 'pass',
          message: 'Kill switch check passed'
        };
      }

      const killSwitch = data[0];

      if (killSwitch.is_enabled) {
        return {
          name: 'Kill Switch',
          status: 'fail',
          message: killSwitch.message || 'App is temporarily unavailable',
          action: 'block'
        };
      }

      return {
        name: 'Kill Switch',
        status: 'pass',
        message: 'Kill switch check passed'
      };

    } catch (error) {
      logger.error('Kill switch check failed', { error: (error as Error).message });
      return {
        name: 'Kill Switch',
        status: 'fail',
        message: 'Kill switch check failed',
        action: 'block'
      };
    }
  }

  /**
   * Check runtime configuration
   */
  private async checkRuntimeConfiguration(): Promise<PreflightCheck> {
    try {
      const environment = Constants.expoConfig?.extra?.environment || 'production';
      
      const { data, error } = await supabase.rpc('get_runtime_config', {
        p_environment: environment
      });

      if (error) {
        logger.error('Failed to check runtime configuration', { error: error.message });
        return {
          name: 'Runtime Configuration',
          status: 'fail',
          message: 'Unable to load runtime configuration',
          action: 'block'
        };
      }

      if (!data || data.length === 0) {
        return {
          name: 'Runtime Configuration',
          status: 'pass',
          message: 'Runtime configuration loaded'
        };
      }

      // Check for critical configuration issues
      const criticalConfigs = data.filter((config: any) => {
        const value = config.value;
        return value && typeof value === 'object' && value.enabled === false;
      });

      if (criticalConfigs.length > 0) {
        const disabledConfigs = criticalConfigs.map((config: any) => config.key).join(', ');
        return {
          name: 'Runtime Configuration',
          status: 'warning',
          message: `Some features are disabled: ${disabledConfigs}`,
          action: 'warn'
        };
      }

      return {
        name: 'Runtime Configuration',
        status: 'pass',
        message: 'Runtime configuration loaded successfully'
      };

    } catch (error) {
      logger.error('Runtime configuration check failed', { error: (error as Error).message });
      return {
        name: 'Runtime Configuration',
        status: 'fail',
        message: 'Runtime configuration check failed',
        action: 'block'
      };
    }
  }

  /**
   * Check feature flags
   */
  private async checkFeatureFlags(userId: string): Promise<PreflightCheck> {
    try {
      const environment = Constants.expoConfig?.extra?.environment || 'production';
      
      const { data, error } = await supabase.rpc('get_user_feature_flags', {
        p_user_id: userId,
        p_environment: environment
      });

      if (error) {
        logger.error('Failed to check feature flags', { error: error.message });
        return {
          name: 'Feature Flags',
          status: 'fail',
          message: 'Unable to load feature flags',
          action: 'block'
        };
      }

      if (!data || data.length === 0) {
        return {
          name: 'Feature Flags',
          status: 'pass',
          message: 'Feature flags loaded'
        };
      }

      return {
        name: 'Feature Flags',
        status: 'pass',
        message: `Loaded ${data.length} feature flags`
      };

    } catch (error) {
      logger.error('Feature flags check failed', { error: (error as Error).message });
      return {
        name: 'Feature Flags',
        status: 'fail',
        message: 'Feature flags check failed',
        action: 'block'
      };
    }
  }

  /**
   * Check network connectivity
   */
  private async checkNetworkConnectivity(): Promise<PreflightCheck> {
    try {
      // Simple network check by pinging a reliable endpoint
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        return {
          name: 'Network Connectivity',
          status: 'pass',
          message: 'Network connection is available'
        };
      } else {
        return {
          name: 'Network Connectivity',
          status: 'fail',
          message: 'Network connection is unstable',
          action: 'warn'
        };
      }

    } catch (error) {
      logger.error('Network connectivity check failed', { error: (error as Error).message });
      return {
        name: 'Network Connectivity',
        status: 'fail',
        message: 'No network connection available',
        action: 'warn'
      };
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabaseConnectivity(): Promise<PreflightCheck> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        logger.error('Database connectivity check failed', { error: error.message });
        return {
          name: 'Database Connectivity',
          status: 'fail',
          message: 'Database connection failed',
          action: 'block'
        };
      }

      return {
        name: 'Database Connectivity',
        status: 'pass',
        message: 'Database connection is available'
      };

    } catch (error) {
      logger.error('Database connectivity check failed', { error: (error as Error).message });
      return {
        name: 'Database Connectivity',
        status: 'fail',
        message: 'Database connection failed',
        action: 'block'
      };
    }
  }

  /**
   * Get app version information
   */
  public async getAppVersionInfo(): Promise<AppVersionInfo | undefined> {
    try {
      const platform = Constants.platform?.ios ? 'ios' : 'android';
      const currentVersion = Constants.expoConfig?.version || '1.0.0';

      const { data, error } = await supabase.rpc('get_app_version_requirements', {
        p_platform: platform
      });

      if (error || !data || data.length === 0) {
        return undefined;
      }

      const versionInfo = data[0];
      return {
        platform,
        currentVersion,
        minSupportedVersion: versionInfo.min_supported_version,
        minRecommendedVersion: versionInfo.min_recommended_version,
        latestVersion: versionInfo.latest_version,
        forceUpdate: versionInfo.force_update,
        updateMessage: versionInfo.update_message,
        updateUrl: versionInfo.update_url
      };

    } catch (error) {
      logger.error('Failed to get app version info', { error: (error as Error).message });
      return undefined;
    }
  }

  /**
   * Get kill switch status
   */
  public async getKillSwitchStatus(): Promise<KillSwitchStatus | undefined> {
    try {
      const { data, error } = await supabase.rpc('get_kill_switch_status');

      if (error || !data || data.length === 0) {
        return undefined;
      }

      const killSwitch = data[0];
      return {
        isEnabled: killSwitch.is_enabled,
        message: killSwitch.message,
        retryAfter: killSwitch.retry_after
      };

    } catch (error) {
      logger.error('Failed to get kill switch status', { error: (error as Error).message });
      return undefined;
    }
  }

  /**
   * Get feature flags for user
   */
  public async getFeatureFlags(userId: string): Promise<FeatureFlag[]> {
    try {
      const environment = Constants.expoConfig?.extra?.environment || 'production';
      
      const { data, error } = await supabase.rpc('get_user_feature_flags', {
        p_user_id: userId,
        p_environment: environment
      });

      if (error || !data) {
        return [];
      }

      return data.map((flag: any) => ({
        flagKey: flag.flag_key,
        flagName: flag.flag_name,
        isEnabled: flag.is_enabled,
        metadata: flag.metadata || {}
      }));

    } catch (error) {
      logger.error('Failed to get feature flags', { error: (error as Error).message });
      return [];
    }
  }

  /**
   * Get runtime configuration
   */
  public async getRuntimeConfiguration(): Promise<Record<string, any>> {
    try {
      const environment = Constants.expoConfig?.extra?.environment || 'production';
      
      const { data, error } = await supabase.rpc('get_runtime_config', {
        p_environment: environment
      });

      if (error || !data) {
        return {};
      }

      const config: Record<string, any> = {};
      data.forEach((item: any) => {
        config[item.key] = item.value;
      });

      return config;

    } catch (error) {
      logger.error('Failed to get runtime configuration', { error: (error as Error).message });
      return {};
    }
  }

  /**
   * Check if feature flag is enabled for user
   */
  public async isFeatureEnabled(userId: string, flagKey: string): Promise<boolean> {
    try {
      const featureFlags = await this.getFeatureFlags(userId);
      const flag = featureFlags.find(f => f.flagKey === flagKey);
      return flag?.isEnabled || false;
    } catch (error) {
      logger.error('Failed to check feature flag', { error: (error as Error).message, flagKey });
      return false;
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export const preflightService = PreflightService.getInstance();




