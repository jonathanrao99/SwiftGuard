import { InteractionManager, PixelRatio } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class PerformanceOptimizer {
  private static metrics: Map<string, number> = new Map();

  /**
   * Optimize image loading based on screen density
   */
  static getOptimizedImageSize(width: number, height: number): { width: number; height: number } {
    const pixelRatio = PixelRatio.get();
    const scale = pixelRatio > 2 ? 0.8 : 1; // Reduce size for high-density screens
    
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    };
  }

  /**
   * Debounce expensive operations
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }

  /**
   * Cache expensive calculations
   */
  static memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map();
    
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func.apply(null, args);
      cache.set(key, result);
      
      return result;
    }) as T;
  }

  /**
   * Defer non-critical operations until after interactions
   */
  static runAfterInteractions(callback: () => void): void {
    InteractionManager.runAfterInteractions(() => {
      // Add small delay to ensure smooth UI
      setTimeout(callback, 50);
    });
  }

  /**
   * Optimize large list rendering
   */
  static getOptimalListSettings(itemCount: number) {
    return {
      windowSize: itemCount > 1000 ? 5 : 10,
      initialNumToRender: itemCount > 1000 ? 10 : 20,
      maxToRenderPerBatch: itemCount > 1000 ? 5 : 10,
      updateCellsBatchingPeriod: 50,
      getItemLayout: (data: any, index: number) => ({
        length: 80, // Estimate item height
        offset: 80 * index,
        index,
      }),
    };
  }

  /**
   * Preload critical data
   */
  static async preloadCriticalData() {
    const criticalKeys = [
      'user_profile',
      'active_jobs',
      'recent_messages'
    ];

    const promises = criticalKeys.map(key => 
      AsyncStorage.getItem(key).catch(() => null)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Monitor performance metrics
   */
  static startTimer(key: string): void {
    this.metrics.set(key, Date.now());
  }

  static endTimer(key: string): number {
    const startTime = this.metrics.get(key);
    if (!startTime) return 0;
    
    const duration = Date.now() - startTime;
    this.metrics.delete(key);
    
    // Log slow operations in development
    if (__DEV__ && duration > 1000) {
      console.warn(`Slow operation detected: ${key} took ${duration}ms`);
    }
    
    return duration;
  }

  /**
   * Optimize bundle loading
   */
  static async loadCriticalComponents() {
    // Preload critical screens
    const criticalImports = [
      import('../screens/client/home/ClientDashboard'),
      import('../screens/guard/GuardDashboard'),
      import('../screens/LoginScreen'),
    ];

    await Promise.allSettled(criticalImports);
  }

  /**
   * Memory cleanup utilities
   */
  static cleanup() {
    // Clear metrics cache
    this.metrics.clear();
    
    // Clear any large objects from memory
    if (global.gc) {
      global.gc();
    }
  }
}

/**
 * Image optimization utility
 */
export const optimizeImage = (uri: string, width: number, height: number): string => {
  const { width: optWidth, height: optHeight } = PerformanceOptimizer.getOptimizedImageSize(width, height);
  
  // If using a CDN, add resize parameters
  if (uri.includes('supabase') || uri.includes('cloudinary')) {
    return `${uri}?w=${optWidth}&h=${optHeight}&c=fill&q=auto`;
  }
  
  return uri;
};

/**
 * Network request optimization
 */
export const optimizeNetworkRequest = {
  // Batch multiple requests
  batch: <T>(requests: Promise<T>[], batchSize = 3): Promise<T[]> => {
    const batches: Promise<T>[][] = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }
    
    return batches.reduce(async (acc, batch) => {
      const results = await acc;
      const batchResults = await Promise.allSettled(batch);
      
      return [
        ...results,
        ...batchResults
          .filter((result): result is PromiseFulfilledResult<T> => result.status === 'fulfilled')
          .map(result => result.value)
      ];
    }, Promise.resolve([] as T[]));
  },

  // Add retry logic with exponential backoff
  retry: async <T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return optimizeNetworkRequest.retry(fn, retries - 1, delay * 2);
    }
  },
};
