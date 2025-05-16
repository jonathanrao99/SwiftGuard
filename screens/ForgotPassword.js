import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Linking, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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
          <Image source={require('../assets/logo.png')} style={styles.logoImage} />
        </View>
        <Text style={styles.header}>Forgot Password</Text>
        <Text style={styles.subheader}>Please enter your email address to reset your password.</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={16} color="#888" />
          <TextInput
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlignVertical="center"
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don't remember your email?</Text>
        </View>
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Contact Us at: </Text>
          <Text style={styles.footerLink} onPress={() => Linking.openURL('mailto:help@swiftguard.app')}>
            help@swiftguard.app
          </Text>
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
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    height: 45, width: '100%', paddingHorizontal: 10,
    marginBottom: 10
  },
  input: {
    flex: 1, marginLeft: 10,
    fontSize: 16, color: '#333',
    textAlignVertical: 'center'
  },
  errorText: { color: 'red', fontSize: 12, marginBottom: 10 },
  continueButton: { width: '100%', backgroundColor: '#2E88FA', height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  continueText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#666' },
  footerLink: { color: '#2E88FA', fontWeight: 'bold' },
  logoImage: { width: 120, height: 120, resizeMode: 'contain' },
}); 