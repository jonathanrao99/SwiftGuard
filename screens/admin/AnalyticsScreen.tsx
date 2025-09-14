import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from 'react-native-chart-kit';
import { supabase } from '../../supabaseClient';
import { COLORS, SPACING, TYPOGRAPHY } from '../../design-system';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundary from '../../components/ErrorBoundary';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - SPACING.xl * 2;

interface AnalyticsData {
  daily_active_users: Array<{
    date: string;
    active_users: number;
    active_sessions: number;
    total_events: number;
  }>;
  booking_funnel: Array<{
    date: string;
    app_opens: number;
    job_create_started: number;
    job_posted: number;
    guard_accepted: number;
    payment_succeeded: number;
    conversion_rates: {
      step1_to_2: number;
      step2_to_3: number;
      step3_to_4: number;
      step4_to_5: number;
    };
  }>;
  revenue: Array<{
    date: string;
    total_payments: number;
    total_revenue: number;
    avg_payment_amount: number;
    success_rate: number;
  }>;
  guard_acceptance: Array<{
    date: string;
    total_offers: number;
    accepted_offers: number;
    acceptance_rate: number;
    avg_response_time_minutes: number;
    median_response_time_minutes: number;
  }>;
}

const chartConfig = {
  backgroundColor: COLORS.background,
  backgroundGradientFrom: COLORS.background,
  backgroundGradientTo: COLORS.background,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: COLORS.primary,
  },
};

export default function AnalyticsScreen() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setError(null);
      
      const { data, error } = await supabase.rpc('get_analytics_summary', {
        p_days: selectedPeriod
      });

      if (error) {
        throw new Error(`Failed to load analytics: ${error.message}`);
      }

      setAnalyticsData(data);
    } catch (err) {
      console.error('Analytics loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalyticsData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner text="Loading analytics..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Analytics Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analyticsData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No analytics data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Prepare chart data
  const dauData = {
    labels: analyticsData.daily_active_users.slice(0, 7).map(d => formatDate(d.date)),
    datasets: [{
      data: analyticsData.daily_active_users.slice(0, 7).map(d => d.active_users),
      color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
      strokeWidth: 2
    }]
  };

  const revenueData = {
    labels: analyticsData.revenue.slice(0, 7).map(d => formatDate(d.date)),
    datasets: [{
      data: analyticsData.revenue.slice(0, 7).map(d => d.total_revenue),
      color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
      strokeWidth: 2
    }]
  };

  const funnelData = analyticsData.booking_funnel[0];
  const conversionData = {
    labels: ['App Opens', 'Job Started', 'Job Posted', 'Guard Accepted', 'Payment Success'],
    data: [
      funnelData?.app_opens || 0,
      funnelData?.job_create_started || 0,
      funnelData?.job_posted || 0,
      funnelData?.guard_accepted || 0,
      funnelData?.payment_succeeded || 0
    ]
  };

  const guardAcceptanceData = analyticsData.guard_acceptance[0];
  const acceptanceRate = guardAcceptanceData?.acceptance_rate || 0;

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Analytics Dashboard</Text>
            <Text style={styles.subtitle}>Last {selectedPeriod} days</Text>
          </View>

          {/* Daily Active Users Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Daily Active Users</Text>
            <LineChart
              data={dauData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Revenue Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Daily Revenue</Text>
            <BarChart
              data={revenueData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>

          {/* Key Metrics Cards */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <MaterialIcons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.metricValue}>
                {analyticsData.daily_active_users[0]?.active_users || 0}
              </Text>
              <Text style={styles.metricLabel}>Active Users Today</Text>
            </View>

            <View style={styles.metricCard}>
              <MaterialIcons name="attach-money" size={24} color={COLORS.success} />
              <Text style={styles.metricValue}>
                {formatCurrency(analyticsData.revenue[0]?.total_revenue || 0)}
              </Text>
              <Text style={styles.metricLabel}>Revenue Today</Text>
            </View>

            <View style={styles.metricCard}>
              <MaterialIcons name="check-circle" size={24} color={COLORS.warning} />
              <Text style={styles.metricValue}>
                {acceptanceRate.toFixed(1)}%
              </Text>
              <Text style={styles.metricLabel}>Guard Acceptance Rate</Text>
            </View>

            <View style={styles.metricCard}>
              <MaterialIcons name="schedule" size={24} color={COLORS.info} />
              <Text style={styles.metricValue}>
                {guardAcceptanceData?.median_response_time_minutes?.toFixed(0) || 0}m
              </Text>
              <Text style={styles.metricLabel}>Avg Response Time</Text>
            </View>
          </View>

          {/* Conversion Funnel */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Booking Funnel</Text>
            <View style={styles.funnelContainer}>
              {conversionData.labels.map((label, index) => {
                const value = conversionData.data[index];
                const percentage = funnelData?.app_opens 
                  ? (value / funnelData.app_opens * 100).toFixed(1)
                  : '0';
                
                return (
                  <View key={index} style={styles.funnelStep}>
                    <View style={styles.funnelBar}>
                      <View 
                        style={[
                          styles.funnelFill, 
                          { width: `${Math.min(percentage, 100)}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.funnelLabel}>{label}</Text>
                    <Text style={styles.funnelValue}>
                      {value} ({percentage}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Guard Acceptance Rate Progress */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Guard Acceptance Rate</Text>
            <ProgressChart
              data={{
                labels: ['Acceptance Rate'],
                data: [acceptanceRate / 100]
              }}
              width={chartWidth}
              height={220}
              strokeWidth={16}
              radius={32}
              chartConfig={chartConfig}
              hideLegend={false}
              style={styles.chart}
            />
          </View>

          {/* Recent Activity Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Recent Activity Summary</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Events Today:</Text>
              <Text style={styles.summaryValue}>
                {analyticsData.daily_active_users[0]?.total_events || 0}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Successful Payments:</Text>
              <Text style={styles.summaryValue}>
                {analyticsData.revenue[0]?.successful_payments || 0}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Average Payment:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(analyticsData.revenue[0]?.avg_payment_amount || 0)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  chartContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  metricCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '48%',
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  funnelContainer: {
    marginTop: SPACING.md,
  },
  funnelStep: {
    marginBottom: SPACING.md,
  },
  funnelBar: {
    height: 20,
    backgroundColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  funnelFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  funnelLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  funnelValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  summaryContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

