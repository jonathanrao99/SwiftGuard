import { JobTemplate } from '../components/post-job/JobTemplateSelector';

export interface PricingFactors {
  baseRate: number;
  requirements: string[];
  numGuards: number;
  duration: number;
  venueType: string;
  location: string;
  date: string;
  guestCount?: number;
}

export interface PricingBreakdown {
  baseRate: number;
  requirementAdjustments: Record<string, number>;
  guardMultiplier: number;
  totalHourlyRate: number;
  totalCost: number;
  costBreakdown: {
    baseCost: number;
    requirementsCost: number;
    totalCost: number;
  };
}

export class PricingService {
  // Market rate adjustments based on location (simplified - in real app, this would come from API)
  private static getLocationMultiplier(location: string): number {
    const locationRates: Record<string, number> = {
      'New York': 1.4,
      'Los Angeles': 1.3,
      'Chicago': 1.2,
      'Miami': 1.25,
      'Las Vegas': 1.35,
      'default': 1.0
    };
    
    const city = location.split(',')[0].trim();
    return locationRates[city] || locationRates.default;
  }

  // Demand multiplier based on date (weekends, holidays, etc.)
  private static getDemandMultiplier(date: string): number {
    const jobDate = new Date(date);
    const dayOfWeek = jobDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Check if it's a holiday (simplified)
    const month = jobDate.getMonth();
    const day = jobDate.getDate();
    const isHoliday = (month === 11 && day === 31) || // New Year's Eve
                     (month === 6 && day === 4) ||     // Independence Day
                     (month === 11 && day === 24);     // Christmas Eve
    
    if (isHoliday) return 1.5;
    if (isWeekend) return 1.2;
    return 1.0;
  }

  // Risk multiplier based on venue type and guest count
  private static getRiskMultiplier(venueType: string, guestCount?: number): number {
    const venueRisk: Record<string, number> = {
      'Nightclub': 1.3,
      'Bar': 1.2,
      'Concert': 1.4,
      'Private Event': 1.1,
      'Corporate': 1.0,
      'Other': 1.1
    };

    const baseRisk = venueRisk[venueType] || 1.1;
    
    // Adjust based on guest count
    if (guestCount) {
      if (guestCount > 1000) return baseRisk * 1.3;
      if (guestCount > 500) return baseRisk * 1.2;
      if (guestCount > 100) return baseRisk * 1.1;
    }
    
    return baseRisk;
  }

  // Calculate optimal pricing based on template and factors
  static calculateOptimalPricing(
    template: JobTemplate,
    factors: PricingFactors
  ): PricingBreakdown {
    const locationMultiplier = this.getLocationMultiplier(factors.location);
    const demandMultiplier = this.getDemandMultiplier(factors.date);
    const riskMultiplier = this.getRiskMultiplier(factors.venueType, factors.guestCount);
    
    // Calculate adjusted base rate
    const adjustedBaseRate = template.pricing.baseRate * 
                            locationMultiplier * 
                            demandMultiplier * 
                            riskMultiplier;

    // Calculate requirement adjustments
    const requirementAdjustments: Record<string, number> = {};
    let totalRequirementMultiplier = 1.0;
    
    factors.requirements.forEach(req => {
      const multiplier = template.pricing.requirementMultipliers[req] || 1.0;
      requirementAdjustments[req] = adjustedBaseRate * (multiplier - 1.0);
      totalRequirementMultiplier *= multiplier;
    });

    // Calculate guard multiplier
    const guardMultiplier = template.pricing.guardMultipliers[factors.numGuards] || 1.0;

    // Calculate total hourly rate
    const totalHourlyRate = adjustedBaseRate * totalRequirementMultiplier * guardMultiplier;

    // Calculate costs
    const baseCost = adjustedBaseRate * factors.numGuards * factors.duration;
    const requirementsCost = Object.values(requirementAdjustments).reduce((sum, adj) => sum + adj, 0) * factors.numGuards * factors.duration;
    const totalCost = totalHourlyRate * factors.numGuards * factors.duration;

    return {
      baseRate: adjustedBaseRate,
      requirementAdjustments,
      guardMultiplier,
      totalHourlyRate,
      totalCost,
      costBreakdown: {
        baseCost,
        requirementsCost,
        totalCost
      }
    };
  }

  // Get recommended number of guards based on venue type and guest count
  static getRecommendedGuards(venueType: string, guestCount?: number): number {
    const baseGuards: Record<string, number> = {
      'Nightclub': 3,
      'Bar': 2,
      'Concert': 4,
      'Private Event': 2,
      'Corporate': 2,
      'Other': 1
    };

    const base = baseGuards[venueType] || 1;
    
    if (!guestCount) return base;
    
    // Adjust based on guest count
    if (guestCount > 1000) return Math.max(base, 6);
    if (guestCount > 500) return Math.max(base, 4);
    if (guestCount > 200) return Math.max(base, 3);
    if (guestCount > 50) return Math.max(base, 2);
    
    return base;
  }

  // Get market insights for a specific location and venue type
  static getMarketInsights(location: string, venueType: string): {
    averageRate: number;
    demandLevel: 'low' | 'medium' | 'high';
    availability: 'limited' | 'moderate' | 'good';
  } {
    const locationMultiplier = this.getLocationMultiplier(location);
    const baseRate = 20; // Base rate across all locations
    
    const averageRate = baseRate * locationMultiplier;
    
    // Simplified demand calculation
    const demandLevel = locationMultiplier > 1.2 ? 'high' : 
                       locationMultiplier > 1.1 ? 'medium' : 'low';
    
    // Simplified availability calculation
    const availability = locationMultiplier > 1.3 ? 'limited' : 
                        locationMultiplier > 1.1 ? 'moderate' : 'good';
    
    return {
      averageRate: Math.round(averageRate),
      demandLevel,
      availability
    };
  }

  // Format pricing for display
  static formatPricing(pricing: PricingBreakdown): {
    hourlyRate: string;
    totalCost: string;
    breakdown: string[];
  } {
    return {
      hourlyRate: `$${pricing.totalHourlyRate.toFixed(2)}/hr`,
      totalCost: `$${pricing.totalCost.toFixed(2)}`,
      breakdown: [
        `Base Rate: $${pricing.baseRate.toFixed(2)}/hr`,
        ...Object.entries(pricing.requirementAdjustments).map(([req, adj]) => 
          `${req.charAt(0).toUpperCase() + req.slice(1)}: +$${adj.toFixed(2)}/hr`
        ),
        `Guard Multiplier: ${(pricing.guardMultiplier * 100).toFixed(0)}%`
      ]
    };
  }
} 