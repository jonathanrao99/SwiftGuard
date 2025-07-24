import React from 'react';

interface PerformanceMetrics {
  screenLoadTime: number;
  componentRenderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  /**
   * Start monitoring screen load performance
   */
  startScreenLoadTimer(screenName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const loadTime = Date.now() - startTime;
      this.recordMetric(screenName, 'screenLoadTime', loadTime);
      
      if (__DEV__) {
        console.log(`📊 ${screenName} loaded in ${loadTime}ms`);
      }
    };
  }

  /**
   * Start monitoring component render performance
   */
  startComponentTimer(componentName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const renderTime = Date.now() - startTime;
      this.recordMetric(componentName, 'componentRenderTime', renderTime);
      
      if (__DEV__) {
        console.log(`⚡ ${componentName} rendered in ${renderTime}ms`);
      }
    };
  }

  /**
   * Start monitoring API call performance
   */
  startApiTimer(apiName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const responseTime = Date.now() - startTime;
      this.recordMetric(apiName, 'apiResponseTime', responseTime);
      
      if (__DEV__) {
        console.log(`🌐 ${apiName} responded in ${responseTime}ms`);
      }
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(key: string, metricType: keyof PerformanceMetrics, value: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        screenLoadTime: 0,
        componentRenderTime: 0,
        apiResponseTime: 0,
        memoryUsage: 0,
      });
    }

    const metrics = this.metrics.get(key)!;
    metrics[metricType] = value;
  }

  /**
   * Get performance metrics for a specific key
   */
  getMetrics(key: string): PerformanceMetrics | undefined {
    return this.metrics.get(key);
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Get average metrics across all recorded entries
   */
  getAverageMetrics(): PerformanceMetrics {
    const entries = Array.from(this.metrics.values());
    if (entries.length === 0) {
      return {
        screenLoadTime: 0,
        componentRenderTime: 0,
        apiResponseTime: 0,
        memoryUsage: 0,
      };
    }

    return {
      screenLoadTime: entries.reduce((sum, entry) => sum + entry.screenLoadTime, 0) / entries.length,
      componentRenderTime: entries.reduce((sum, entry) => sum + entry.componentRenderTime, 0) / entries.length,
      apiResponseTime: entries.reduce((sum, entry) => sum + entry.apiResponseTime, 0) / entries.length,
      memoryUsage: entries.reduce((sum, entry) => sum + entry.memoryUsage, 0) / entries.length,
    };
  }

  /**
   * Export metrics for analytics
   */
  exportMetrics(): string {
    return JSON.stringify(Array.from(this.metrics.entries()), null, 2);
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance HOC for components
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return (props: P) => {
    const endTimer = performanceMonitor.startComponentTimer(componentName);
    
    React.useEffect(() => {
      endTimer();
    });

    return React.createElement(WrappedComponent, props);
  };
}

// Performance hook for screens
export function useScreenPerformance(screenName: string): void {
  React.useEffect(() => {
    const endTimer = performanceMonitor.startScreenLoadTimer(screenName);
    
    // End timer after component mounts
    const timer = setTimeout(endTimer, 0);
    
    return () => clearTimeout(timer);
  }, [screenName]);
}

// Performance hook for API calls
export function useApiPerformance(apiName: string) {
  return React.useCallback(() => {
    return performanceMonitor.startApiTimer(apiName);
  }, [apiName]);
} 