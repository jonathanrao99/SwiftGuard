/**
 * SwiftGuard Pricing Admin Screen
 * Allows admins to configure pricing multipliers and view pricing analytics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pricingEngine, PricingConfig, DemandSignal, PricingResult } from '../../services/PricingEngine';
import { logger } from '../../utils/Logger';

export default function PricingAdminScreen() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [testDemandSignal, setTestDemandSignal] = useState<Partial<DemandSignal>>({
    openJobs: 10,
    availableGuards: 5,
    timeOfDay: 14,
    dayOfWeek: 1,
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      county: 'New York',
      state: 'NY'
    },
    jobType: 'security',
    duration: 4,
    urgency: 'medium'
  });

  useEffect(() => {
    loadPricingConfig();
  }, []);

  const loadPricingConfig = () => {
    try {
      const currentConfig = pricingEngine.getConfig();
      setConfig(currentConfig);
    } catch (error) {
      logger.error('Failed to load pricing config', { error: (error as Error).message });
      Alert.alert('Error', 'Failed to load pricing configuration');
    }
  };

  const testPricing = () => {
    try {
      const signal: DemandSignal = {
        openJobs: testDemandSignal.openJobs || 10,
        availableGuards: testDemandSignal.availableGuards || 5,
        timeOfDay: testDemandSignal.timeOfDay || 14,
        dayOfWeek: testDemandSignal.dayOfWeek || 1,
        location: testDemandSignal.location || {
          latitude: 40.7128,
          longitude: -74.0060,
          county: 'New York',
          state: 'NY'
        },
        jobType: testDemandSignal.jobType || 'security',
        duration: testDemandSignal.duration || 4,
        urgency: testDemandSignal.urgency || 'medium'
      };

      const result = pricingEngine.calculatePricing(signal);
      setPricingResult(result);
    } catch (error) {
      logger.error('Failed to test pricing', { error: (error as Error).message });
      Alert.alert('Error', 'Failed to calculate pricing');
    }
  };

  const updateConfig = (updates: Partial<PricingConfig>) => {
    if (!config) return;

    try {
      const newConfig = { ...config, ...updates };
      pricingEngine.updateConfig(updates);
      setConfig(newConfig);
      Alert.alert('Success', 'Pricing configuration updated');
    } catch (error) {
      logger.error('Failed to update pricing config', { error: (error as Error).message });
      Alert.alert('Error', 'Failed to update pricing configuration');
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Configuration',
      'Are you sure you want to reset the pricing configuration to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            loadPricingConfig();
            Alert.alert('Success', 'Configuration reset to defaults');
          }
        }
      ]
    );
  };

  if (!config) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading pricing configuration...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Pricing Administration</Text>
          <Text style={styles.subtitle}>
            Configure dynamic pricing multipliers and test pricing calculations
          </Text>
        </View>

        {/* Base Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Base Rates (per hour)</Text>
          
          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Security</Text>
            <TextInput
              style={styles.rateInput}
              value={config.baseRates.security.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                updateConfig({
                  baseRates: { ...config.baseRates, security: value }
                });
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Event</Text>
            <TextInput
              style={styles.rateInput}
              value={config.baseRates.event.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                updateConfig({
                  baseRates: { ...config.baseRates, event: value }
                });
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Patrol</Text>
            <TextInput
              style={styles.rateInput}
              value={config.baseRates.patrol.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                updateConfig({
                  baseRates: { ...config.baseRates, patrol: value }
                });
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Emergency</Text>
            <TextInput
              style={styles.rateInput}
              value={config.baseRates.emergency.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                updateConfig({
                  baseRates: { ...config.baseRates, emergency: value }
                });
              }}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Demand Multipliers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demand Multipliers</Text>
          
          <View style={styles.multiplierItem}>
            <Text style={styles.multiplierLabel}>Low Demand</Text>
            <TextInput
              style={styles.multiplierInput}
              value={config.multipliers.demand.low.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                updateConfig({
                  multipliers: {
                    ...config.multipliers,
                    demand: { ...config.multipliers.demand, low: value }
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.multiplierItem}>
            <Text style={styles.multiplierLabel}>Medium Demand</Text>
            <TextInput
              style={styles.multiplierInput}
              value={config.multipliers.demand.medium.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                updateConfig({
                  multipliers: {
                    ...config.multipliers,
                    demand: { ...config.multipliers.demand, medium: value }
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.multiplierItem}>
            <Text style={styles.multiplierLabel}>High Demand</Text>
            <TextInput
              style={styles.multiplierInput}
              value={config.multipliers.demand.high.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                updateConfig({
                  multipliers: {
                    ...config.multipliers,
                    demand: { ...config.multipliers.demand, high: value }
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.multiplierItem}>
            <Text style={styles.multiplierLabel}>Critical Demand</Text>
            <TextInput
              style={styles.multiplierInput}
              value={config.multipliers.demand.critical.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                updateConfig({
                  multipliers: {
                    ...config.multipliers,
                    demand: { ...config.multipliers.demand, critical: value }
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Time Multipliers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Multipliers</Text>
          
          <View style={styles.multiplierItem}>
            <Text style={styles.multiplierLabel}>Peak Hours</Text>
            <TextInput
              style={styles.multiplierInput}
              value={config.multipliers.time.peak.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                updateConfig({
                  multipliers: {
                    ...config.multipliers,
                    time: { ...config.multipliers.time, peak: value }
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.multiplierItem}>
            <Text style={styles.multiplierLabel}>Normal Hours</Text>
            <TextInput
              style={styles.multiplierInput}
              value={config.multipliers.time.normal.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                updateConfig({
                  multipliers: {
                    ...config.multipliers,
                    time: { ...config.multipliers.time, normal: value }
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.multiplierItem}>
            <Text style={styles.multiplierLabel}>Off Hours</Text>
            <TextInput
              style={styles.multiplierInput}
              value={config.multipliers.time.off.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                updateConfig({
                  multipliers: {
                    ...config.multipliers,
                    time: { ...config.multipliers.time, off: value }
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Pricing Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Test</Text>
          
          <View style={styles.testItem}>
            <Text style={styles.testLabel}>Open Jobs</Text>
            <TextInput
              style={styles.testInput}
              value={testDemandSignal.openJobs?.toString() || ''}
              onChangeText={(text) => setTestDemandSignal({
                ...testDemandSignal,
                openJobs: parseInt(text) || 0
              })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.testItem}>
            <Text style={styles.testLabel}>Available Guards</Text>
            <TextInput
              style={styles.testInput}
              value={testDemandSignal.availableGuards?.toString() || ''}
              onChangeText={(text) => setTestDemandSignal({
                ...testDemandSignal,
                availableGuards: parseInt(text) || 0
              })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.testItem}>
            <Text style={styles.testLabel}>Time of Day (0-23)</Text>
            <TextInput
              style={styles.testInput}
              value={testDemandSignal.timeOfDay?.toString() || ''}
              onChangeText={(text) => setTestDemandSignal({
                ...testDemandSignal,
                timeOfDay: parseInt(text) || 0
              })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.testItem}>
            <Text style={styles.testLabel}>Duration (hours)</Text>
            <TextInput
              style={styles.testInput}
              value={testDemandSignal.duration?.toString() || ''}
              onChangeText={(text) => setTestDemandSignal({
                ...testDemandSignal,
                duration: parseInt(text) || 0
              })}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.testButton} onPress={testPricing}>
            <Text style={styles.testButtonText}>Test Pricing</Text>
          </TouchableOpacity>
        </View>

        {/* Pricing Result */}
        {pricingResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing Result</Text>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Base Price</Text>
              <Text style={styles.resultValue}>${pricingResult.basePrice.toFixed(2)}</Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Final Price</Text>
              <Text style={styles.resultValue}>${pricingResult.finalPrice.toFixed(2)}</Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Multiplier</Text>
              <Text style={styles.resultValue}>{pricingResult.multiplier.toFixed(2)}x</Text>
            </View>

            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>Breakdown</Text>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Demand</Text>
                <Text style={styles.breakdownValue}>{pricingResult.breakdown.demandMultiplier.toFixed(2)}x</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Time</Text>
                <Text style={styles.breakdownValue}>{pricingResult.breakdown.timeMultiplier.toFixed(2)}x</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Location</Text>
                <Text style={styles.breakdownValue}>{pricingResult.breakdown.locationMultiplier.toFixed(2)}x</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Urgency</Text>
                <Text style={styles.breakdownValue}>{pricingResult.breakdown.urgencyMultiplier.toFixed(2)}x</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Duration</Text>
                <Text style={styles.breakdownValue}>{pricingResult.breakdown.durationMultiplier.toFixed(2)}x</Text>
              </View>
            </View>

            <View style={styles.explanationsContainer}>
              <Text style={styles.explanationsTitle}>Explanations</Text>
              {pricingResult.explanations.map((explanation, index) => (
                <Text key={index} style={styles.explanationText}>• {explanation}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  rateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rateLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  rateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 100,
    textAlign: 'center',
  },
  multiplierItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  multiplierLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  multiplierInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  testItem: {
    marginBottom: 16,
  },
  testLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  testInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 16,
    color: '#374151',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  breakdownContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  explanationsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  explanationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  resetButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});




