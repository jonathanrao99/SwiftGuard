import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!email.includes('@') || !email.includes('.com')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.container}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="shield-key-outline" size={80} color="#2E88FA" />
        </View>
        <Text style={styles.header}>Forgot Password</Text>
        <Text style={styles.subheader}>Please enter your email address to reset your password.</Text>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don't remember your email? </Text>
          <Text style={styles.footerLink}>Contact Us at: help@swiftguard.app</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginVertical: 20 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
  subheader: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  inputContainer: { width: '100%', position: 'relative', marginBottom: 10 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingLeft: 40, height: 45 },
  inputIcon: { position: 'absolute', top: 12, left: 10 },
  errorText: { color: 'red', fontSize: 12, marginBottom: 10 },
  continueButton: { width: '100%', backgroundColor: '#2E88FA', height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  continueText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#666' },
  footerLink: { color: '#2E88FA', fontWeight: 'bold' },
}); 