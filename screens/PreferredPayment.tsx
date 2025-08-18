import React, { useState, useEffect, useContext } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  View,
  ScrollView
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import { NavigationProps } from '../types';
import { AuthContext } from '../contexts/AuthContext';
// Dynamic import for Stripe to reduce bundle size
let useStripe: any;
let initPaymentSheet: any;
let presentPaymentSheet: any;

// Load Stripe dynamically
const loadStripe = async () => {
  if (!useStripe) {
    const stripeModule = await import('@stripe/stripe-react-native');
    useStripe = stripeModule.useStripe;
    initPaymentSheet = stripeModule.initPaymentSheet;
    presentPaymentSheet = stripeModule.presentPaymentSheet;
  }
};
import { supabase } from '../supabaseClient';

interface PreferredPaymentProps {
  navigation: NavigationProps;
  route: {
    params: {
      userId: string;
    };
  };
}

export default function PreferredPayment({ navigation, route }: PreferredPaymentProps) {
  const { userId } = route.params || {};
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([]);
  const [showBenefits, setShowBenefits] = useState(true);

  useEffect(() => {
    loadStripe().then(() => {
      setStripeLoaded(true);
      const stripeHook = useStripe();
      setStripe(stripeHook);
    });
  }, []);

  useEffect(() => {
    if (stripeLoaded && stripe) {
      initializePaymentSheet();
    }
  }, [stripeLoaded, stripe]);

  async function initializePaymentSheet() {
    if (!stripe) return;
    
    setLoading(true);
    setError(null);
    // Call your Supabase Edge Function to create a SetupIntent
    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      'create-setup-intent',
      { body: { userId } }
    );
    console.log('create-setup-intent response:', fnData, fnError);
    if (fnError) {
      // Show detailed server error
      const serverMsg = fnData?.error || fnError.message;
      setError(`${fnError.message}\n${serverMsg}`);
      setLoading(false);
      return;
    }
    const clientSecret = fnData.clientSecret;
    const { error: initError } = await stripe.initPaymentSheet({
      merchantDisplayName: 'SwiftGuard',
      setupIntentClientSecret: clientSecret,
      allowsDelayedPaymentMethods: false,
      // Google Pay configuration
      googlePay: {
        merchantCountryCode: 'US',  // your country
        testEnv: true               // true for sandbox, false for production
      },
      // Apple Pay configuration (iOS only)
      applePay: {
        merchantCountryCode: 'US',            // your country
        merchantIdentifier: '<YOUR_APPLE_MERCHANT_ID>' // e.g. merchant.com.yourapp
      }
    });
    if (initError) {
      setError(`Payment Error: ${initError.message}`);
    }
    setLoading(false);
  }

  async function openPaymentSheet() {
    if (!stripe) return;
    
    try {
      setError(null);
      const { error } = await stripe.presentPaymentSheet();
      if (error) {
        setError(`Payment Error: ${error.message}`);
      } else {
        Alert.alert('Success', 'Payment method saved successfully');
        navigation.replace('Client');
      }
    } catch (err) {
      setError('Failed to process payment. Please try again.');
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner text="Setting up payment..." />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace('Client')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.header}>Set Up Your Preferred Payment Method</Text>
          <Text style={styles.subtext}>Save your payment details for faster checkout when posting security jobs</Text>

          {/* Benefits Section */}
          {showBenefits && (
            <View style={styles.benefitsContainer}>
              <TouchableOpacity 
                style={styles.benefitsHeader}
                onPress={() => setShowBenefits(!showBenefits)}
              >
                <MaterialIcons name="security" size={24} color="#2E88FA" />
                <Text style={styles.benefitsTitle}>Why save your payment method?</Text>
                <Feather 
                  name={showBenefits ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Feather name="zap" size={16} color="#2E88FA" />
                  <Text style={styles.benefitText}>Instant job posting without re-entering card details</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Feather name="shield" size={16} color="#2E88FA" />
                  <Text style={styles.benefitText}>Bank-level security with Stripe encryption</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Feather name="clock" size={16} color="#2E88FA" />
                  <Text style={styles.benefitText}>Skip payment steps during urgent security needs</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Feather name="smartphone" size={16} color="#2E88FA" />
                  <Text style={styles.benefitText}>Support for Apple Pay, Google Pay, and cards</Text>
                </View>
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Saved Payment Methods */}
          {savedPaymentMethods.length > 0 && (
            <View style={styles.savedMethodsContainer}>
              <Text style={styles.savedMethodsTitle}>Saved Payment Methods</Text>
              {savedPaymentMethods.map((method, index) => (
                <View key={index} style={styles.paymentMethodCard}>
                  <MaterialIcons name="credit-card" size={24} color="#2E88FA" />
                  <Text style={styles.paymentMethodText}>•••• {method.last4}</Text>
                  <Text style={styles.paymentMethodBrand}>{method.brand?.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={openPaymentSheet}
              disabled={loading}
            >
              <MaterialIcons name="add-card" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>
                {loading ? 'Setting up...' : 'Add Payment Method'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.replace('Client')}
            >
              <Text style={styles.secondaryButtonText}>Skip for Now</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            Your payment information is encrypted and secure. SwiftGuard does not store your card details.
          </Text>
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 60,
    paddingBottom: 30,
  },
  skipButton: {
    position: 'absolute',
    top: StatusBar.currentHeight + 10,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#2E88FA',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  benefitsContainer: {
    backgroundColor: '#f8faff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e1e8ff',
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
    flex: 1,
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  savedMethodsContainer: {
    marginBottom: 24,
  },
  savedMethodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodBrand: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  paymentOptions: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#2E88FA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#2E88FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    backgroundColor: '#888',
    shadowOpacity: 0,
    elevation: 0,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
  },
}); 