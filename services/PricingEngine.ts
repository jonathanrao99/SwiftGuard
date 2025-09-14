/**
 * SwiftGuard Pricing Engine
 * Provides dynamic pricing based on demand signals and market conditions
 */

import { logger } from '../utils/Logger';

export interface DemandSignal {
  openJobs: number;
  availableGuards: number;
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday = 0)
  location: {
    latitude: number;
    longitude: number;
    county: string;
    state: string;
  };
  jobType: 'security' | 'event' | 'patrol' | 'emergency';
  duration: number; // hours
  urgency: 'low' | 'medium' | 'high' | 'emergency';
}

export interface PricingResult {
  basePrice: number;
  finalPrice: number;
  multiplier: number;
  explanations: string[];
  breakdown: {
    base: number;
    demandMultiplier: number;
    timeMultiplier: number;
    locationMultiplier: number;
    urgencyMultiplier: number;
    durationMultiplier: number;
  };
}

export interface PricingConfig {
  baseRates: {
    security: number;
    event: number;
    patrol: number;
    emergency: number;
  };
  multipliers: {
    demand: {
      low: number;    // 0.8
      medium: number; // 1.0
      high: number;   // 1.2
      critical: number; // 1.5
    };
    time: {
      peak: number;   // 1.3 (6-9 AM, 5-8 PM)
      normal: number; // 1.0
      off: number;    // 0.8 (10 PM - 6 AM)
    };
    location: {
      urban: number;  // 1.2
      suburban: number; // 1.0
      rural: number;  // 0.9
    };
    urgency: {
      low: number;    // 1.0
      medium: number; // 1.1
      high: number;   // 1.3
      emergency: number; // 2.0
    };
    duration: {
      short: number;  // 1.2 (< 4 hours)
      normal: number; // 1.0 (4-8 hours)
      long: number;   // 0.9 (> 8 hours)
    };
  };
  thresholds: {
    demandRatio: {
      low: number;    // < 0.5
      medium: number; // 0.5 - 1.5
      high: number;   // 1.5 - 3.0
      critical: number; // > 3.0
    };
  };
}

class PricingEngine {
  private static instance: PricingEngine;
  private config: PricingConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): PricingEngine {
    if (!PricingEngine.instance) {
      PricingEngine.instance = new PricingEngine();
    }
    return PricingEngine.instance;
  }

  /**
   * Calculate pricing for a job
   */
  public calculatePricing(demandSignal: DemandSignal): PricingResult {
    try {
      logger.info('Calculating pricing', { demandSignal });

      // Get base price for job type
      const basePrice = this.getBasePrice(demandSignal.jobType);
      
      // Calculate multipliers
      const demandMultiplier = this.calculateDemandMultiplier(demandSignal);
      const timeMultiplier = this.calculateTimeMultiplier(demandSignal);
      const locationMultiplier = this.calculateLocationMultiplier(demandSignal);
      const urgencyMultiplier = this.calculateUrgencyMultiplier(demandSignal);
      const durationMultiplier = this.calculateDurationMultiplier(demandSignal);

      // Calculate final multiplier
      const multiplier = demandMultiplier * timeMultiplier * locationMultiplier * urgencyMultiplier * durationMultiplier;

      // Calculate final price
      const finalPrice = Math.round(basePrice * multiplier * 100) / 100; // Round to 2 decimal places

      // Generate explanations
      const explanations = this.generateExplanations({
        basePrice,
        demandMultiplier,
        timeMultiplier,
        locationMultiplier,
        urgencyMultiplier,
        durationMultiplier,
        finalPrice
      });

      const result: PricingResult = {
        basePrice,
        finalPrice,
        multiplier,
        explanations,
        breakdown: {
          base: basePrice,
          demandMultiplier,
          timeMultiplier,
          locationMultiplier,
          urgencyMultiplier,
          durationMultiplier
        }
      };

      logger.info('Pricing calculated', { result });
      return result;

    } catch (error) {
      logger.error('Failed to calculate pricing', { 
        error: (error as Error).message, 
        demandSignal 
      });
      
      // Return fallback pricing
      return this.getFallbackPricing(demandSignal);
    }
  }

  /**
   * Get base price for job type
   */
  private getBasePrice(jobType: string): number {
    return this.config.baseRates[jobType as keyof typeof this.config.baseRates] || this.config.baseRates.security;
  }

  /**
   * Calculate demand multiplier
   */
  private calculateDemandMultiplier(demandSignal: DemandSignal): number {
    const demandRatio = demandSignal.openJobs / Math.max(demandSignal.availableGuards, 1);
    
    if (demandRatio < this.config.thresholds.demandRatio.low) {
      return this.config.multipliers.demand.low;
    } else if (demandRatio < this.config.thresholds.demandRatio.medium) {
      return this.config.multipliers.demand.medium;
    } else if (demandRatio < this.config.thresholds.demandRatio.high) {
      return this.config.multipliers.demand.high;
    } else {
      return this.config.multipliers.demand.critical;
    }
  }

  /**
   * Calculate time multiplier
   */
  private calculateTimeMultiplier(demandSignal: DemandSignal): number {
    const hour = demandSignal.timeOfDay;
    
    // Peak hours: 6-9 AM, 5-8 PM
    if ((hour >= 6 && hour < 9) || (hour >= 17 && hour < 20)) {
      return this.config.multipliers.time.peak;
    }
    
    // Off hours: 10 PM - 6 AM
    if (hour >= 22 || hour < 6) {
      return this.config.multipliers.time.off;
    }
    
    return this.config.multipliers.time.normal;
  }

  /**
   * Calculate location multiplier
   */
  private calculateLocationMultiplier(demandSignal: DemandSignal): number {
    // This would typically use a more sophisticated location classification
    // For now, we'll use a simple heuristic based on county/state
    
    const location = demandSignal.location;
    
    // Urban areas (simplified)
    const urbanCounties = ['Los Angeles', 'New York', 'Chicago', 'Houston', 'Phoenix'];
    if (urbanCounties.includes(location.county)) {
      return this.config.multipliers.location.urban;
    }
    
    // Rural areas (simplified)
    const ruralStates = ['Wyoming', 'Vermont', 'Alaska', 'North Dakota'];
    if (ruralStates.includes(location.state)) {
      return this.config.multipliers.location.rural;
    }
    
    return this.config.multipliers.location.suburban;
  }

  /**
   * Calculate urgency multiplier
   */
  private calculateUrgencyMultiplier(demandSignal: DemandSignal): number {
    return this.config.multipliers.urgency[demandSignal.urgency];
  }

  /**
   * Calculate duration multiplier
   */
  private calculateDurationMultiplier(demandSignal: DemandSignal): number {
    const duration = demandSignal.duration;
    
    if (duration < 4) {
      return this.config.multipliers.duration.short;
    } else if (duration > 8) {
      return this.config.multipliers.duration.long;
    }
    
    return this.config.multipliers.duration.normal;
  }

  /**
   * Generate pricing explanations
   */
  private generateExplanations(breakdown: any): string[] {
    const explanations: string[] = [];
    
    // Base price explanation
    explanations.push(`Base rate: $${breakdown.basePrice.toFixed(2)}`);
    
    // Demand explanation
    if (breakdown.demandMultiplier > 1.1) {
      explanations.push(`High demand: +${Math.round((breakdown.demandMultiplier - 1) * 100)}%`);
    } else if (breakdown.demandMultiplier < 0.9) {
      explanations.push(`Low demand: -${Math.round((1 - breakdown.demandMultiplier) * 100)}%`);
    }
    
    // Time explanation
    if (breakdown.timeMultiplier > 1.1) {
      explanations.push(`Peak hours: +${Math.round((breakdown.timeMultiplier - 1) * 100)}%`);
    } else if (breakdown.timeMultiplier < 0.9) {
      explanations.push(`Off hours: -${Math.round((1 - breakdown.timeMultiplier) * 100)}%`);
    }
    
    // Location explanation
    if (breakdown.locationMultiplier > 1.1) {
      explanations.push(`Urban area: +${Math.round((breakdown.locationMultiplier - 1) * 100)}%`);
    } else if (breakdown.locationMultiplier < 0.9) {
      explanations.push(`Rural area: -${Math.round((1 - breakdown.locationMultiplier) * 100)}%`);
    }
    
    // Urgency explanation
    if (breakdown.urgencyMultiplier > 1.1) {
      explanations.push(`High urgency: +${Math.round((breakdown.urgencyMultiplier - 1) * 100)}%`);
    }
    
    // Duration explanation
    if (breakdown.durationMultiplier > 1.1) {
      explanations.push(`Short duration: +${Math.round((breakdown.durationMultiplier - 1) * 100)}%`);
    } else if (breakdown.durationMultiplier < 0.9) {
      explanations.push(`Long duration: -${Math.round((1 - breakdown.durationMultiplier) * 100)}%`);
    }
    
    return explanations;
  }

  /**
   * Get fallback pricing when calculation fails
   */
  private getFallbackPricing(demandSignal: DemandSignal): PricingResult {
    const basePrice = this.getBasePrice(demandSignal.jobType);
    
    return {
      basePrice,
      finalPrice: basePrice,
      multiplier: 1.0,
      explanations: ['Standard pricing applied'],
      breakdown: {
        base: basePrice,
        demandMultiplier: 1.0,
        timeMultiplier: 1.0,
        locationMultiplier: 1.0,
        urgencyMultiplier: 1.0,
        durationMultiplier: 1.0
      }
    };
  }

  /**
   * Get default pricing configuration
   */
  private getDefaultConfig(): PricingConfig {
    return {
      baseRates: {
        security: 25.00,  // $25/hour
        event: 30.00,     // $30/hour
        patrol: 20.00,    // $20/hour
        emergency: 50.00  // $50/hour
      },
      multipliers: {
        demand: {
          low: 0.8,
          medium: 1.0,
          high: 1.2,
          critical: 1.5
        },
        time: {
          peak: 1.3,
          normal: 1.0,
          off: 0.8
        },
        location: {
          urban: 1.2,
          suburban: 1.0,
          rural: 0.9
        },
        urgency: {
          low: 1.0,
          medium: 1.1,
          high: 1.3,
          emergency: 2.0
        },
        duration: {
          short: 1.2,
          normal: 1.0,
          long: 0.9
        }
      },
      thresholds: {
        demandRatio: {
          low: 0.5,
          medium: 1.5,
          high: 3.0,
          critical: 5.0
        }
      }
    };
  }

  /**
   * Update pricing configuration
   */
  public updateConfig(newConfig: Partial<PricingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Pricing configuration updated', { newConfig });
  }

  /**
   * Get current pricing configuration
   */
  public getConfig(): PricingConfig {
    return { ...this.config };
  }

  /**
   * Calculate pricing for multiple job types
   */
  public calculatePricingForMultiple(demandSignals: DemandSignal[]): PricingResult[] {
    return demandSignals.map(signal => this.calculatePricing(signal));
  }

  /**
   * Get pricing estimate for a job type
   */
  public getPricingEstimate(jobType: string, duration: number): {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
  } {
    const basePrice = this.getBasePrice(jobType);
    
    // Calculate min/max based on multipliers
    const minMultiplier = 0.8 * 0.8 * 0.9 * 1.0 * 0.9; // All minimum multipliers
    const maxMultiplier = 1.5 * 1.3 * 1.2 * 2.0 * 1.2; // All maximum multipliers
    const avgMultiplier = 1.0; // Average multiplier
    
    return {
      minPrice: Math.round(basePrice * minMultiplier * duration * 100) / 100,
      maxPrice: Math.round(basePrice * maxMultiplier * duration * 100) / 100,
      avgPrice: Math.round(basePrice * avgMultiplier * duration * 100) / 100
    };
  }
}

export const pricingEngine = PricingEngine.getInstance();




