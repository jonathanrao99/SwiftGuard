// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { supabase } from '../supabaseClient';

// Helper to derive E.164 format: strip non-digits and add +1 for US numbers
function normalizePhone(number) {
  const digits = (number || '').replace(/\D/g, '');
  // 10-digit US number
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  // 11-digit, starting with 1
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  // Already in e164 if starts with +
  if (number.startsWith('+')) {
    return number;
  }
  // Fallback to raw
  return number;
}

export default function OtpVerification({ navigation, route }) {
  const { phone, nextScreen, ...formData } = route.params;
  const normalizedPhone = normalizePhone(phone);
  console.log('↪️ Normalized phone for OTP:', normalizedPhone);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    sendOtp();
  }, []);

  async function sendOtp() {
    setErrorMsg('');
    console.log('↪️ Sending OTP to:', normalizedPhone);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: { shouldCreateUser: true }
    });
    if (error) setErrorMsg(error.message);
  }

  async function verifyOtp() {
    setLoading(true);
    setErrorMsg('');
    console.log('↪️ Calling verifyOtp for:', normalizedPhone, 'code:', code);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: code,
        type: 'sms'
      });
      console.log('↪️ verifyOtp result data:', data, 'error:', error);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      const user = data.session?.user;
      console.log('↪️ verifyOtp session user:', user);
      if (!user) {
        setErrorMsg('No user returned after OTP verification');
        return;
      }
      // Upsert into unified users table (updates existing record if present)
      const { error: userError } = await supabase.from('users').upsert(
        [{
          id: user.id,
          role: formData.role,
          email: formData.email,
          phone: formData.phone,
          first_name: formData.firstName,
          last_name: formData.lastName,
          business_name: formData.businessName,
          establishment_type: formData.establishmentType,
          location: formData.location,
          referral_code: formData.referralCode,
          gender: formData.gender,
          dob: formData.dob,
          experience_level: formData.experienceLevel,
          years_experience: formData.yearsExperience,
          bio: formData.bio,
          certifications: formData.certifications,
          emergency_contact: formData.emergencyContact,
          availability: formData.availability
        }],
        { onConflict: ['id'] }
      );
      if (userError) {
        console.log('↪️ user upsert error:', userError);
        setErrorMsg(userError.message);
        return;
      }
      // navigate to the next step
      navigation.replace(nextScreen, { userId: user.id });
    } catch (e) {
      console.log('↪️ verifyOtp threw exception:', e);
      setErrorMsg(e.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.header}>Enter Verification Code</Text>
        <Text style={styles.subtext}>Sent to {normalizedPhone}</Text>
        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="6-digit code"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
          maxLength={6}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={verifyOtp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={sendOtp} style={styles.resend}>
          <Text style={styles.resendText}>Resend Code</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtext: { fontSize: 16, color: '#555', marginBottom: 20, textAlign: 'center' },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    marginBottom: 20
  },
  button: { backgroundColor: '#2E88FA', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#888' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resend: { marginTop: 15, alignItems: 'center' },
  resendText: { color: '#2E88FA', fontSize: 16 },
  error: { color: 'red', textAlign: 'center', marginBottom: 10 }
}); 