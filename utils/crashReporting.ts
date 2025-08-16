import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

interface CrashReport {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    component?: string;
  };
  user: {
    id?: string;
    role?: string;
  };
  device: {
    platform: string;
    version: string;
    model?: string;
  };
  app: {
    version: string;
    buildNumber: string;
  };
  network: {
    connected: boolean;
    type?: string;
  };
  context?: {
    screen?: string;
    action?: string;
    additionalData?: any;
  };
}

export class CrashReporting {
  private static readonly STORAGE_KEY = 'crash_reports';
  private static readonly MAX_REPORTS = 50;

  /**
   * Report a crash with comprehensive context
   */
  static async reportCrash(
    error: Error,
    context?: {
      component?: string;
      screen?: string;
      action?: string;
      additionalData?: any;
    }
  ): Promise<void> {
    try {
      const networkState = await NetInfo.fetch();
      
      const report: CrashReport = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          component: context?.component,
        },
        user: await this.getUserContext(),
        device: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
        },
        app: {
          version: '1.0.0', // Should come from app config
          buildNumber: '1', // Should come from app config
        },
        network: {
          connected: networkState.isConnected ?? false,
          type: networkState.type || undefined,
        },
        context,
      };

      // Store locally first
      await this.storeReportLocally(report);

      // Try to send immediately if online
      if (networkState.isConnected) {
        await this.sendReport(report);
      }

      console.error('Crash reported:', report.id);
    } catch (reportError) {
      console.error('Failed to report crash:', reportError);
    }
  }

  /**
   * Send pending crash reports when online
   */
  static async sendPendingReports(): Promise<void> {
    try {
      const reports = await this.getStoredReports();
      const networkState = await NetInfo.fetch();

      if (!networkState.isConnected || reports.length === 0) {
        return;
      }

      for (const report of reports) {
        try {
          await this.sendReport(report);
          await this.removeStoredReport(report.id);
        } catch (error) {
          console.error('Failed to send report:', report.id, error);
        }
      }
    } catch (error) {
      console.error('Failed to send pending reports:', error);
    }
  }

  /**
   * Store crash report locally
   */
  private static async storeReportLocally(report: CrashReport): Promise<void> {
    try {
      const existingReports = await this.getStoredReports();
      const updatedReports = [report, ...existingReports].slice(0, this.MAX_REPORTS);
      
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(updatedReports)
      );
    } catch (error) {
      console.error('Failed to store crash report locally:', error);
    }
  }

  /**
   * Get stored crash reports
   */
  private static async getStoredReports(): Promise<CrashReport[]> {
    try {
      const reportsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      return reportsJson ? JSON.parse(reportsJson) : [];
    } catch (error) {
      console.error('Failed to get stored reports:', error);
      return [];
    }
  }

  /**
   * Remove a stored report
   */
  private static async removeStoredReport(id: string): Promise<void> {
    try {
      const reports = await this.getStoredReports();
      const filteredReports = reports.filter(report => report.id !== id);
      
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(filteredReports)
      );
    } catch (error) {
      console.error('Failed to remove stored report:', error);
    }
  }

  /**
   * Send report to crash reporting service
   */
  private static async sendReport(report: CrashReport): Promise<void> {
    // In production, this would send to your crash reporting service
    // For now, we'll just log it
    
    if (__DEV__) {
      console.log('📤 Sending crash report:', {
        id: report.id,
        error: report.error.message,
        context: report.context,
      });
      return;
    }

    // Production implementation would send to:
    // - Sentry
    // - Bugsnag  
    // - Custom analytics endpoint
    
    try {
      const response = await fetch('YOUR_CRASH_REPORTING_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error(`Failed to send report: ${response.status}`);
      }
    } catch (error) {
      // Store for retry later
      throw error;
    }
  }

  /**
   * Get user context for crash reports
   */
  private static async getUserContext(): Promise<{ id?: string; role?: string }> {
    try {
      // Get from your auth context or storage
      const userJson = await AsyncStorage.getItem('user_profile');
      const user = userJson ? JSON.parse(userJson) : null;
      
      return {
        id: user?.id,
        role: user?.role,
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Generate unique ID for crash reports
   */
  private static generateId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get crash statistics
   */
  static async getCrashStatistics(): Promise<{
    totalCrashes: number;
    recentCrashes: number;
    topErrors: { message: string; count: number }[];
  }> {
    try {
      const reports = await this.getStoredReports();
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentCrashes = reports.filter(
        report => new Date(report.timestamp) > last24Hours
      );

      // Count error types
      const errorCounts = reports.reduce((acc, report) => {
        const message = report.error.message;
        acc[message] = (acc[message] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topErrors = Object.entries(errorCounts)
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalCrashes: reports.length,
        recentCrashes: recentCrashes.length,
        topErrors,
      };
    } catch (error) {
      console.error('Failed to get crash statistics:', error);
      return {
        totalCrashes: 0,
        recentCrashes: 0,
        topErrors: [],
      };
    }
  }

  /**
   * Clear all crash reports (for testing or privacy)
   */
  static async clearAllReports(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear crash reports:', error);
    }
  }
}

/**
 * Initialize crash reporting
 */
export const initCrashReporting = async (): Promise<void> => {
  // Send any pending reports
  await CrashReporting.sendPendingReports();

  // Set up global error handler
  const originalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    CrashReporting.reportCrash(error, {
      component: 'Global',
      action: 'Unhandled Error',
      additionalData: { isFatal },
    });

    // Call original handler
    originalHandler(error, isFatal);
  });

  // Set up unhandled promise rejection handler
  const handleUnhandledRejection = (event: any) => {
    CrashReporting.reportCrash(
      new Error(event.reason || 'Unhandled Promise Rejection'),
      {
        component: 'Promise',
        action: 'Unhandled Rejection',
        additionalData: event,
      }
    );
  };

  // Add to global scope if available
  if (typeof global !== 'undefined') {
    global.addEventListener?.('unhandledrejection', handleUnhandledRejection);
  }
};
