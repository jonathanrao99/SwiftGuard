import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import PaymentService from '../../services/PaymentService';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../design-system';
import { Job, PaymentMethod } from '../../types';

interface PaymentFormProps {
  job: Job;
  guardId: string;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

interface PaymentMethodOption {
  id: string;
  type: 'card' | 'bank_account';
  displayName: string;
  last4: string;
  isDefault: boolean;
}

export default function PaymentForm({ job, guardId, onPaymentSuccess, onPaymentError }: PaymentFormProps) {
  const { user } = useAuth();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      // This would typically fetch from your payment service
      // For now, we'll use mock data
      const mockMethods: PaymentMethodOption[] = [
        {
          id: 'pm_1',
          type: 'card',
          displayName: 'Visa ending in 4242',
          last4: '4242',
          isDefault: true,
        },
        {
          id: 'pm_2',
          type: 'card',
          displayName: 'Mastercard ending in 5555',
          last4: '5555',
          isDefault: false,
        },
      ];
      
      setPaymentMethods(mockMethods);
      if (mockMethods.length > 0) {
        setSelectedPaymentMethod(mockMethods[0].id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await PaymentService.createPaymentIntent({
        jobId: job.id,
        amount: job.total_amount,
        currency: 'USD',
        clientId: user.id,
        guardId,
        description: `Payment for ${job.title}`,
      });

      if (result.success && result.data) {
        // In a real app, you would redirect to Stripe's payment flow
        // For now, we'll simulate a successful payment
        await PaymentService.confirmPayment(result.data.id, job.id);
        onPaymentSuccess();
      } else {
        onPaymentError(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const addNewPaymentMethod = () => {
    // This would typically open a modal or navigate to add payment method screen
    Alert.alert('Add Payment Method', 'This would open the add payment method flow');
  };

  const fees = PaymentService.calculateFees(job.total_amount);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Job Amount</Text>
            <Text style={styles.summaryValue}>${job.total_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fee (5%)</Text>
            <Text style={styles.summaryValue}>${fees.platformFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Processing Fee</Text>
            <Text style={styles.summaryValue}>${fees.stripeFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${fees.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {paymentMethods.length === 0 ? (
          <TouchableOpacity style={styles.addMethodButton} onPress={addNewPaymentMethod}>
            <MaterialIcons name="add-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.addMethodText}>Add Payment Method</Text>
          </TouchableOpacity>
        ) : (
          <>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodOption,
                  selectedPaymentMethod === method.id && styles.selectedMethod,
                ]}
                onPress={() => setSelectedPaymentMethod(method.id)}
              >
                <View style={styles.methodInfo}>
                  <MaterialIcons
                    name={method.type === 'card' ? 'credit-card' : 'account-balance'}
                    size={24}
                    color={COLORS.primary}
                  />
                  <View style={styles.methodDetails}>
                    <Text style={styles.methodName}>{method.displayName}</Text>
                    {method.isDefault && (
                      <Text style={styles.defaultBadge}>Default</Text>
                    )}
                  </View>
                </View>
                <View style={styles.radioButton}>
                  {selectedPaymentMethod === method.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addAnotherButton} onPress={addNewPaymentMethod}>
              <MaterialIcons name="add" size={20} color={COLORS.primary} />
              <Text style={styles.addAnotherText}>Add Another Method</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security & Protection</Text>
        <View style={styles.securityCard}>
          <View style={styles.securityItem}>
            <MaterialIcons name="security" size={20} color={COLORS.success} />
            <Text style={styles.securityText}>Funds held securely in escrow</Text>
          </View>
          <View style={styles.securityItem}>
            <MaterialIcons name="verified" size={20} color={COLORS.success} />
            <Text style={styles.securityText}>Released only after job completion</Text>
          </View>
          <View style={styles.securityItem}>
            <MaterialIcons name="support-agent" size={20} color={COLORS.success} />
            <Text style={styles.securityText}>24/7 dispute resolution support</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={isProcessing || !selectedPaymentMethod}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <MaterialIcons name="payment" size={24} color={COLORS.white} />
        )}
        <Text style={styles.payButtonText}>
          {isProcessing ? 'Processing...' : `Pay $${fees.total.toFixed(2)}`}
        </Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By proceeding, you agree to our Terms of Service and Privacy Policy
      </Text>
    </ScrollView>
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
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
  },
  totalLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '700',
  },
  totalValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: '700',
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: LAYOUT.borderRadius,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
  },
  addMethodText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selectedMethod: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  methodName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  defaultBadge: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
  },
  addAnotherText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  securityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  securityText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.white,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  termsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
});

