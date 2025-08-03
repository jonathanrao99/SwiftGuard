import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  View
} from 'react-native';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import { NavigationProps } from '../types';
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
  const [loading, setLoading] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace('Client')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Set Up Your Preferred Payment Method</Text>
      <Text style={styles.subtext}>Add a credit/debit card or use Apple/Google Pay</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.paymentOptions}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={openPaymentSheet}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Add or Select Payment Method'}</Text>
        </TouchableOpacity>
      </View>
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  skipButton: {
    position: 'absolute',
    top: StatusBar.currentHeight + 10,
    right: 20,
  },
  skipText: {
    color: '#2E88FA',
    fontSize: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 60,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 30,
  },
  paymentOptions: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#2E88FA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#888',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
}); 