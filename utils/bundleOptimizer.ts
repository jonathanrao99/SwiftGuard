/**
 * Advanced Bundle Optimization Utility
 * Implements intelligent code splitting and preloading strategies
 */

import { InteractionManager } from 'react-native';

interface BundleChunk {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
  size?: number;
  preloadDelay?: number;
}

interface PreloadStrategy {
  immediate: string[];
  delayed: string[];
  onDemand: string[];
}

class BundleOptimizer {
  private chunks = new Map<string, BundleChunk>();
  private preloadedChunks = new Set<string>();
  private preloadQueue: string[] = [];
  private isPreloading = false;

  /**
   * Register a bundle chunk with its metadata
   */
  registerChunk(chunk: BundleChunk): void {
    this.chunks.set(chunk.name, chunk);
  }

  /**
   * Get optimal preload strategy based on current context
   */
  getPreloadStrategy(userRole: 'client' | 'guard' | 'admin'): PreloadStrategy {
    const strategy: PreloadStrategy = {
      immediate: [],
      delayed: [],
      onDemand: [],
    };

    // Critical chunks that should be preloaded immediately
    strategy.immediate = [
      'LoadingScreen',
      'LoginScreen',
      'UserTypeSelection',
    ];

    // Role-specific high priority chunks
    if (userRole === 'client') {
      strategy.immediate.push('ClientDashboard', 'ProfileScreen');
      strategy.delayed.push('JobsScreen', 'JobDetailsScreen', 'FindGuardsScreen');
      strategy.onDemand.push('PostJob', 'PostJobSpecialized', 'ReportsScreen');
    } else if (userRole === 'guard') {
      strategy.delayed.push('GuardTabs', 'GuardJobsScreen', 'GuardProfileScreen');
      strategy.onDemand.push('GuardJobDetailsScreen', 'GuardChatScreen', 'ReportIncidentScreen');
    }

    // Common delayed chunks
    strategy.delayed.push(
      'ForgotPassword',
      'SignUpClient',
      'SignUpGuard',
      'OtpVerification',
      'PreferredPayment'
    );

    // On-demand chunks (loaded when needed)
    strategy.onDemand.push(
      'WelcomeScreen',
      'OnboardingScreen',
      'JobTemplateSelector',
      'GuardProfileScreen',
      'AllReviewsScreen',
      'LeaveReviewScreen'
    );

    return strategy;
  }

  /**
   * Preload chunks with intelligent timing
   */
  async preloadChunks(chunkNames: string[], priority: 'immediate' | 'delayed' = 'delayed'): Promise<void> {
    if (this.isPreloading) {
      this.preloadQueue.push(...chunkNames);
      return;
    }

    this.isPreloading = true;

    try {
      const delay = priority === 'immediate' ? 0 : 1000;

      for (const chunkName of chunkNames) {
        if (this.preloadedChunks.has(chunkName)) {
          continue;
        }

        const chunk = this.chunks.get(chunkName);
        if (!chunk) {
          console.warn(`Chunk ${chunkName} not registered`);
          continue;
        }

        // Wait for delay before preloading
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Wait for interactions to complete
        await InteractionManager.runAfterInteractions();

        try {
          await this.preloadChunk(chunk);
          this.preloadedChunks.add(chunkName);
          console.log(`✅ Preloaded chunk: ${chunkName}`);
        } catch (error) {
          console.warn(`❌ Failed to preload chunk ${chunkName}:`, error);
        }
      }

      // Process queued chunks
      if (this.preloadQueue.length > 0) {
        const queuedChunks = [...this.preloadQueue];
        this.preloadQueue = [];
        await this.preloadChunks(queuedChunks, 'delayed');
      }
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Preload a single chunk
   */
  private async preloadChunk(chunk: BundleChunk): Promise<void> {
    // This would integrate with the actual import functions
    // For now, we'll simulate the preloading
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, chunk.preloadDelay || 100);
    });
  }

  /**
   * Get bundle analytics
   */
  getBundleAnalytics(): {
    totalChunks: number;
    preloadedChunks: number;
    pendingChunks: number;
    estimatedSize: number;
  } {
    const totalChunks = this.chunks.size;
    const preloadedChunks = this.preloadedChunks.size;
    const pendingChunks = this.preloadQueue.length;
    
    let estimatedSize = 0;
    this.chunks.forEach(chunk => {
      estimatedSize += chunk.size || 0;
    });

    return {
      totalChunks,
      preloadedChunks,
      pendingChunks,
      estimatedSize,
    };
  }

  /**
   * Clear preload cache (useful for memory management)
   */
  clearCache(): void {
    this.preloadedChunks.clear();
    this.preloadQueue = [];
    this.isPreloading = false;
  }
}

export const bundleOptimizer = new BundleOptimizer();

// Register common chunks
bundleOptimizer.registerChunk({
  name: 'LoadingScreen',
  priority: 'critical',
  dependencies: [],
  preloadDelay: 0,
});

bundleOptimizer.registerChunk({
  name: 'LoginScreen',
  priority: 'critical',
  dependencies: ['LoadingScreen'],
  preloadDelay: 0,
});

bundleOptimizer.registerChunk({
  name: 'ClientDashboard',
  priority: 'high',
  dependencies: ['LoginScreen'],
  preloadDelay: 500,
});

bundleOptimizer.registerChunk({
  name: 'GuardTabs',
  priority: 'high',
  dependencies: ['LoginScreen'],
  preloadDelay: 800,
});

bundleOptimizer.registerChunk({
  name: 'JobsScreen',
  priority: 'medium',
  dependencies: ['ClientDashboard'],
  preloadDelay: 1000,
});

bundleOptimizer.registerChunk({
  name: 'PostJob',
  priority: 'low',
  dependencies: ['ClientDashboard'],
  preloadDelay: 1500,
});

export default bundleOptimizer;

