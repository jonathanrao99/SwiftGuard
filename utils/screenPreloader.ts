/**
 * Screen Preloader Utility
 * Preloads screens in the background to eliminate bundling delays
 */

import { InteractionManager } from 'react-native';
import { bundleOptimizer } from './bundleOptimizer';

interface ScreenModule {
  default: React.ComponentType<any>;
}

class ScreenPreloader {
  private preloadedScreens = new Map<string, Promise<ScreenModule>>();
  private preloadQueue: Array<() => Promise<ScreenModule>> = [];

  /**
   * Preload a screen module
   */
  preloadScreen(name: string, importFn: () => Promise<ScreenModule>): void {
    if (this.preloadedScreens.has(name)) {
      return; // Already preloaded
    }

    const promise = importFn();
    this.preloadedScreens.set(name, promise);
    
    // Cache the module when loaded
    promise.then(module => {
      console.log(`✅ Preloaded screen: ${name}`);
    }).catch(error => {
      console.warn(`❌ Failed to preload screen ${name}:`, error);
      this.preloadedScreens.delete(name);
    });
  }

  /**
   * Get a preloaded screen module
   */
  async getPreloadedScreen(name: string): Promise<ScreenModule | null> {
    const promise = this.preloadedScreens.get(name);
    if (!promise) {
      return null;
    }

    try {
      return await promise;
    } catch (error) {
      console.warn(`Failed to get preloaded screen ${name}:`, error);
      this.preloadedScreens.delete(name);
      return null;
    }
  }

  /**
   * Preload multiple screens in the background
   */
  preloadScreens(screens: Array<{ name: string; importFn: () => Promise<ScreenModule> }>): void {
    // Use InteractionManager to preload after UI interactions are complete
    InteractionManager.runAfterInteractions(() => {
      screens.forEach(({ name, importFn }) => {
        this.preloadScreen(name, importFn);
      });
    });
  }

  /**
   * Queue screens for preloading
   */
  queueForPreload(importFn: () => Promise<ScreenModule>): void {
    this.preloadQueue.push(importFn);
  }

  /**
   * Process preload queue
   */
  processPreloadQueue(): void {
    if (this.preloadQueue.length === 0) return;

    InteractionManager.runAfterInteractions(() => {
      this.preloadQueue.forEach((importFn, index) => {
        this.preloadScreen(`queued_${index}`, importFn);
      });
      this.preloadQueue = [];
    });
  }

  /**
   * Get preload statistics
   */
  getStats(): { preloadedCount: number; queueLength: number } {
    return {
      preloadedCount: this.preloadedScreens.size,
      queueLength: this.preloadQueue.length,
    };
  }

  /**
   * Clear preloaded screens
   */
  clear(): void {
    this.preloadedScreens.clear();
    this.preloadQueue = [];
  }
}

// Export singleton instance
export const screenPreloader = new ScreenPreloader();

/**
 * Preload critical screens immediately
 */
export const preloadCriticalScreens = () => {
  const criticalScreens = [
    {
      name: 'ForgotPassword',
      importFn: () => import('../screens/ForgotPassword'),
    },
    {
      name: 'WelcomeScreen',
      importFn: () => import('../screens/onboarding/WelcomeScreen'),
    },
    {
      name: 'SignUpClient',
      importFn: () => import('../screens/SignUpClient'),
    },
    {
      name: 'SignUpGuard',
      importFn: () => import('../screens/SignUpGuard'),
    },
    {
      name: 'PreferredPayment',
      importFn: () => import('../screens/PreferredPayment'),
    },
    {
      name: 'OtpVerification',
      importFn: () => import('../screens/OtpVerification'),
    },
    {
      name: 'GuardTabs',
      importFn: () => import('../screens/guard/GuardTabs'),
    },
    {
      name: 'JobsScreen',
      importFn: () => import('../screens/client/jobs/JobsScreen'),
    },
    {
      name: 'JobDetailsScreen',
      importFn: () => import('../screens/client/jobs/JobDetailsScreen'),
    },
  ];

  screenPreloader.preloadScreens(criticalScreens);
};

/**
 * Preload secondary screens
 */
export const preloadSecondaryScreens = () => {
  const secondaryScreens = [
    {
      name: 'PostJobSpecialized',
      importFn: () => import('../screens/client/home/PostJobSpecialized'),
    },
    {
      name: 'FindGuardsScreen',
      importFn: () => import('../screens/client/home/FindGuardsScreen'),
    },
    {
      name: 'ReportsScreen',
      importFn: () => import('../screens/client/home/ReportsScreen'),
    },
    {
      name: 'GuardMode',
      importFn: () => import('../screens/guard/GuardMode'),
    },
    {
      name: 'GuardJobDetailsScreen',
      importFn: () => import('../screens/guard/GuardJobDetailsScreen'),
    },
  ];

  screenPreloader.preloadScreens(secondaryScreens);
};

/**
 * Create optimized lazy component with preloading
 */
export const createOptimizedLazyComponent = (
  name: string,
  importFn: () => Promise<ScreenModule>
) => {
  // Preload the screen
  screenPreloader.preloadScreen(name, importFn);
  
  // Return lazy component
  return importFn;
};
