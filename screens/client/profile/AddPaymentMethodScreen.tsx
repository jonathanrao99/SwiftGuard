import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../theme';
import { NavigationProps } from '../../../types';
import { supabase } from '../../../supabaseClient';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorBoundary from '../../../components/ErrorBoundary';

interface AddPaymentMethodScreenProps {
  navigation: NavigationProps;
}

export default function AddPaymentMethodScreen({ navigation }: AddPaymentMethodScreenProps) {
  const [paymentType, setPaymentType] = useState<'card' | 'bank'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPaymentMethod = async () => {
    if (paymentType === 'card') {
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        setError('Please fill in all card details');
        return;
      }
    } else {
      if (!routingNumber || !accountNumber || !accountHolderName) {
        setError('Please fill in all bank account details');
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      // Extract card brand from card number (simplified logic)
      const cardBrand = cardNumber.startsWith('4') ? 'visa' : 
                       cardNumber.startsWith('5') ? 'mastercard' : 
                       cardNumber.startsWith('3') ? 'amex' : 'visa';

      const paymentMethodData = {
        type: paymentType,
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryDate,
        cvv,
        cardholderName,
        brand: cardBrand,
        last4: cardNumber.replace(/\s/g, '').slice(-4),
        routingNumber,
        accountNumber,
        accountHolderName,
        email: 'admin@swiftguard.com' // In real app, get from user context
      };

      // Call Supabase Edge Function to add payment method to Stripe
      const { data, error } = await supabase.functions.invoke('stripe-add-payment-method', {
        body: { 
          customerId: 'cus_SlusInVaUZRN6K', // In real app, get from user context
          paymentMethodData 
        }
      });

      if (error) {
        console.error('Error adding payment method:', error);
        setError('Failed to add payment method. Please try again.');
        return;
      }

      Alert.alert('Success', 'Payment method added successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding payment method:', error);
      setError('Failed to add payment method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner text="Adding payment method..." />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Payment Method</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {/* Payment Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  paymentType === 'card' && styles.typeButtonActive,
                ]}
                onPress={() => setPaymentType('card')}
              >
                <MaterialIcons
                  name="credit-card"
                  size={24}
                  color={paymentType === 'card' ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    paymentType === 'card' && styles.typeButtonTextActive,
                  ]}
                >
                  Credit/Debit Card
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  paymentType === 'bank' && styles.typeButtonActive,
                ]}
                onPress={() => setPaymentType('bank')}
              >
                <MaterialIcons
                  name="account-balance"
                  size={24}
                  color={paymentType === 'bank' ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    paymentType === 'bank' && styles.typeButtonTextActive,
                  ]}
                >
                  Bank Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card Details */}
          {paymentType === 'card' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Card Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  placeholder="1234 5678 9012 3456"
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: SPACING.sm }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                    placeholder="MM/YY"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    value={cvv}
                    onChangeText={setCvv}
                    placeholder="123"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput
                  style={styles.input}
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  placeholder="John Doe"
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {/* Bank Account Details */}
          {paymentType === 'bank' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bank Account Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.input}
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                  placeholder="John Doe"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Routing Number</Text>
                <TextInput
                  style={styles.input}
                  value={routingNumber}
                  onChangeText={setRoutingNumber}
                  placeholder="123456789"
                  keyboardType="numeric"
                  maxLength={9}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="1234567890"
                  keyboardType="numeric"
                  maxLength={17}
                />
              </View>
            </View>
          )}

          {/* Security Notice */}
          <View style={styles.securityCard}>
            <MaterialIcons name="security" size={24} color={COLORS.success} />
            <View style={styles.securityInfo}>
              <Text style={styles.securityTitle}>Secure & Encrypted</Text>
              <Text style={styles.securityText}>
                Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Add Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddPaymentMethod}>
            <Text style={styles.addButtonText}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: COLORS.background,
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
    color: COLORS.textDark,
  },
  content: {
    flex: 1,
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
  typeContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  typeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  row: {
    flexDirection: 'row',
  },
  securityCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.successLight,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'flex-start',
    marginTop: SPACING.lg,
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
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    flex: 1,
  },
}); 