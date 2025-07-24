// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  View
} from 'react-native';
import { initPaymentSheet, presentPaymentSheet, useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../supabaseClient';

export default function PreferredPayment({ navigation, route }) {
  const { userId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet: initializePS, presentPaymentSheet: openPS } = useStripe();

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  async function initializePaymentSheet() {
    setLoading(true);
    // Call your Supabase Edge Function to create a SetupIntent
    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      'create-setup-intent',
      { body: { userId } }
    );
    console.log('create-setup-intent response:', fnData, fnError);
    if (fnError) {
      // Show detailed server error
      const serverMsg = fnData?.error || fnError.message;
      Alert.alert('Error', `${fnError.message}\n${serverMsg}`);
      setLoading(false);
      return;
    }
    const clientSecret = fnData.clientSecret;
    const { error: initError } = await initializePS({
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
      Alert.alert('Payment Error', initError.message);
    }
    setLoading(false);
  }

  async function openPaymentSheet() {
    const { error } = await openPS();
    if (error) {
      Alert.alert('Payment Error', error.message);
    } else {
      Alert.alert('Success', 'Payment method saved successfully');
      navigation.replace('Client');
    }
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace('Client')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Set Up Your Preferred Payment Method</Text>
      <Text style={styles.subtext}>Add a credit/debit card or use Apple/Google Pay</Text>

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
    </>
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
}); 