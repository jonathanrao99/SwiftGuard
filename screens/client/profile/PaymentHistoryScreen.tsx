import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import PaymentService from '../../../services/PaymentService';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../../design-system';
import { Payment, Escrow } from '../../../types';
import ErrorBoundary from '../../../components/ErrorBoundary';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface PaymentHistoryItem {
  payment: Payment;
  escrow?: Escrow;
  jobTitle: string;
  guardName: string;
}

export default function PaymentHistoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed' | 'disputed'>('all');

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const result = await PaymentService.getPaymentHistory(user.id, 'client');
      
      if (result.success && result.data) {
        // Transform the data to include job and guard information
        const transformedPayments: PaymentHistoryItem[] = result.data.map((payment: any) => ({
          payment,
          escrow: payment.escrow,
          jobTitle: payment.jobs?.title || 'Unknown Job',
          guardName: payment.guard_name || 'Unknown Guard',
        }));
        
        setPayments(transformedPayments);
      } else {
        console.error('Failed to load payment history:', result.error);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
      Alert.alert('Error', 'Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadPaymentHistory();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'confirmed':
      case 'completed':
        return COLORS.success;
      case 'failed':
      case 'canceled':
        return COLORS.error;
      case 'disputed':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'confirmed':
        return 'check-circle';
      case 'completed':
        return 'verified';
      case 'failed':
        return 'error';
      case 'canceled':
        return 'cancel';
      case 'disputed':
        return 'gavel';
      default:
        return 'help';
    }
  };

  const getEscrowStatusText = (escrow?: Escrow) => {
    if (!escrow) return 'No escrow';
    
    switch (escrow.status) {
      case 'pending':
        return 'Pending escrow';
      case 'held':
        return 'Funds held in escrow';
      case 'released':
        return 'Funds released to guard';
      case 'refunded':
        return 'Funds refunded';
      case 'disputed':
        return 'Payment disputed';
      default:
        return 'Unknown status';
    }
  };

  const filteredPayments = payments.filter(item => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return item.payment.status === 'pending';
    if (selectedFilter === 'completed') return item.payment.status === 'confirmed';
    if (selectedFilter === 'disputed') return item.escrow?.status === 'disputed';
    return true;
  });

  const renderPaymentItem = ({ item }: { item: PaymentHistoryItem }) => (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => navigation.navigate('PaymentDetails', { paymentId: item.payment.id })}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.jobTitle}
          </Text>
          <Text style={styles.guardName} numberOfLines={1}>
            Guard: {item.guardName}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>${item.payment.amount.toFixed(2)}</Text>
          <Text style={styles.currency}>{item.payment.currency}</Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.statusRow}>
          <MaterialIcons
            name={getStatusIcon(item.payment.status) as any}
            size={16}
            color={getStatusColor(item.payment.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.payment.status) }]}>
            {item.payment.status.charAt(0).toUpperCase() + item.payment.status.slice(1)}
          </Text>
        </View>

        <Text style={styles.escrowStatus}>
          {getEscrowStatusText(item.escrow)}
        </Text>

        <Text style={styles.date}>
          {new Date(item.payment.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('JobDetails', { jobId: item.payment.job_id })}
        >
          <MaterialIcons name="work" size={16} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>View Job</Text>
        </TouchableOpacity>

        {item.escrow?.status === 'disputed' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('DisputeDetails', { disputeId: item.escrow?.id })}
          >
            <MaterialIcons name="gavel" size={16} color={COLORS.error} />
            <Text style={[styles.actionButtonText, { color: COLORS.error }]}>View Dispute</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filter: typeof selectedFilter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Loading payment history..." />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment History</Text>
          <Text style={styles.subtitle}>
            Track all your payments and escrow status
          </Text>
        </View>

        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('pending', 'Pending')}
          {renderFilterButton('completed', 'Completed')}
          {renderFilterButton('disputed', 'Disputed')}
        </View>

        <FlatList
          data={filteredPayments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.payment.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt-long" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>No payments found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'all'
                  ? 'You haven\'t made any payments yet'
                  : `No ${selectedFilter} payments found`}
              </Text>
            </View>
          }
        />

        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Payments:</Text>
            <Text style={styles.summaryValue}>{filteredPayments.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>
              ${filteredPayments
                .reduce((sum, item) => sum + item.payment.amount, 0)
                .toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: SPACING.lg,
  },
  paymentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  jobInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  jobTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  guardName: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: '700',
  },
  currency: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  paymentDetails: {
    marginBottom: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statusText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  escrowStatus: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  date: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  actionButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.xl * 2,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '700',
  },
});

