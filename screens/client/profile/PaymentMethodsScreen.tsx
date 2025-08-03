import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../../theme';
import { NavigationProps } from '../../../types';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorBoundary from '../../../components/ErrorBoundary';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay
} from 'react-native-reanimated';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  name: string;
  last4?: string;
  brand?: string;
  isDefault: boolean;
  expiryDate?: string;
}

interface PaymentMethodsScreenProps {
  navigation: NavigationProps;
}

export default function PaymentMethodsScreen({ navigation }: PaymentMethodsScreenProps) {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const methodsOpacity = useSharedValue(0);
  const methodsTranslateY = useSharedValue(30);

  useEffect(() => {
    // Start animations when component mounts
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    contentTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
    
    methodsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    methodsTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 100 }));

    // Load payment methods from Stripe
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Call Supabase Edge Function to get payment methods from Stripe
      const { data, error } = await supabase.functions.invoke('stripe-payment-methods', {
        body: { customerId: user.id }
      });

      if (error) {
        console.error('Error loading payment methods:', error);
        setError('Failed to load payment methods. Please try again.');
        return;
      }

      if (data && Array.isArray(data)) {
        setPaymentMethods(data);
      } else if (data && data.paymentMethods) {
        // Transform Stripe payment methods to our format
        const transformedPaymentMethods: PaymentMethod[] = data.paymentMethods.map((pm: any) => ({
          id: pm.id,
          type: pm.type === 'card' ? 'card' as const : 'bank' as const,
          name: `${pm.card?.brand || 'Card'} ending in ${pm.card?.last4 || '****'}`,
          last4: pm.card?.last4,
          brand: pm.card?.brand,
          isDefault: pm.id === data.paymentMethods[0]?.id, // First card is default
          expiryDate: pm.card ? `${pm.card.exp_month.toString().padStart(2, '0')}/${pm.card.exp_year.toString().slice(-2)}` : undefined,
        }));
        
        setPaymentMethods(transformedPaymentMethods);
      } else {
        setPaymentMethods([]);
      }
      
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setError('Failed to load payment methods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  const handleDeleteMethod = (id: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(method => method.id !== id));
          }
        },
      ]
    );
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const methodsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: methodsOpacity.value,
    transform: [{ translateY: methodsTranslateY.value }],
  }));

  const getCardIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'credit-card' as const;
      case 'mastercard':
        return 'credit-card' as const;
      case 'amex':
        return 'credit-card' as const;
      default:
        return 'credit-card' as const;
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={styles.paymentCard}>
      <View style={styles.paymentCardContent}>
        <View style={styles.paymentInfo}>
          <View style={styles.paymentIconContainer}>
            <MaterialIcons 
              name={method.type === 'card' ? getCardIcon(method.brand) : 'account-balance'} 
              size={28} 
              color={method.brand === 'visa' ? '#1A1F71' : method.brand === 'mastercard' ? '#EB001B' : COLORS.primary} 
            />
          </View>
          <View style={styles.paymentDetails}>
            <Text style={styles.paymentName}>{method.name}</Text>
            <Text style={styles.paymentExpiry}>
              {method.type === 'card' ? `•••• ${method.last4}` : `**** ${method.last4}`} • Expires {method.expiryDate}
            </Text>
          </View>
        </View>
        
        <View style={styles.paymentActions}>
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleSetDefault(method.id)}
          >
            <MaterialIcons 
              name="star" 
              size={20} 
              color={method.isDefault ? COLORS.primary : COLORS.textSecondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteMethod(method.id)}
          >
            <MaterialIcons name="delete-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <LoadingSpinner text="Loading payment methods..." />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <View style={{ alignItems: 'center', padding: 20 }}>
            <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
            <Text style={{ fontSize: 18, color: COLORS.error, marginTop: 16, textAlign: 'center' }}>
              {error}
            </Text>
            <TouchableOpacity 
              style={{ marginTop: 20, padding: 12, backgroundColor: COLORS.primary, borderRadius: 8 }}
              onPress={loadPaymentMethods}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
        
        {/* Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddPaymentMethod')}>
            <MaterialIcons name="add" size={24} color="#222" />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            {/* Payment Methods List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Payment Methods</Text>
              {paymentMethods.length > 0 ? (
                paymentMethods.map(renderPaymentMethod)
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="credit-card" size={48} color={COLORS.textSecondary} />
                  <Text style={styles.emptyTitle}>No Payment Methods</Text>
                  <Text style={styles.emptySubtitle}>Add a payment method to get started</Text>
                </View>
              )}
            </View>

          {/* Add New Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add New Payment Method</Text>
            <TouchableOpacity 
              style={styles.addCardButton}
              onPress={() => navigation.navigate('AddPaymentMethod')}
            >
              <MaterialIcons name="add" size={24} color={COLORS.primary} />
              <Text style={styles.addCardText}>Add Credit/Debit Card</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addBankButton}
              onPress={() => navigation.navigate('AddBankAccount')}
            >
              <MaterialIcons name="account-balance" size={24} color={COLORS.primary} />
              <Text style={styles.addBankText}>Add Bank Account</Text>
            </TouchableOpacity>
          </View>

          {/* Payment History */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Payments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PaymentHistory')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.paymentHistoryCard}>
              <View style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>Event Security - Corporate Conference</Text>
                  <Text style={styles.historyDate}>Jan 15, 2025</Text>
                </View>
                <Text style={styles.historyAmount}>-$200.00</Text>
              </View>
              
              <View style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>VIP Protection - Business Meeting</Text>
                  <Text style={styles.historyDate}>Jan 12, 2025</Text>
                </View>
                <Text style={styles.historyAmount}>-$140.00</Text>
              </View>
            </View>
          </View>

          {/* Security Info */}
          <View style={styles.section}>
            <View style={styles.securityCard}>
              <MaterialIcons name="security" size={24} color={COLORS.success} />
              <View style={styles.securityInfo}>
                <Text style={styles.securityTitle}>Secure Payments</Text>
                <Text style={styles.securityText}>
                  All payment information is encrypted and securely stored. We never store your full card details.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  container: { 
    flex: 1, 
    backgroundColor: COLORS.backgroundLight 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.sm * 1.2 : SPACING.xl * 1.2,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: COLORS.textDark 
  },
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: SPACING.md,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentCardContent: {
    padding: SPACING.lg,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  paymentDetails: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  paymentExpiry: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  defaultBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.success,
  },
  paymentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  deleteButton: {
    backgroundColor: COLORS.errorLight,
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: SPACING.md,
  },
  addBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addBankText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: SPACING.md,
  },
  paymentHistoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  securityCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.successLight,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  securityInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  securityText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // Loading and empty states
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
}); 