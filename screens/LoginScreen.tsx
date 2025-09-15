import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Modal, StatusBar, ActivityIndicator } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../contexts/AuthContext';
import { NavigationProps } from '../types';
import ErrorBoundary from '../components/ErrorBoundary';

interface LoginScreenProps {
  navigation: NavigationProps;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn } = useAuth();
  const [isClient, setIsClient] = useState<boolean | null>(null); // true=Client, false=Guard, null=none selected
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBiometricAuth = async () => {
    if (isClient === null) {
      setErrorModalMessage('Please select a role to continue.');
      setErrorModalVisible(true);
      return;
    }

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) {
        Alert.alert('Biometric not supported', 'Your device does not support Face ID or no biometrics are enrolled.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Login with Face ID' });
      if (result.success) {
        // For biometric auth, we'll need to store credentials securely
        // For now, redirect to appropriate dashboard
        navigation.replace(isClient ? 'Client' : 'GuardTabs');
      }
    } catch (e) {
      console.error('Biometric auth error:', e);
      Alert.alert('Error', 'Biometric authentication failed. Please try again.');
    }
  };

  const handleSignIn = async () => {
    if (isClient === null) {
      setErrorModalMessage('Please select a role to continue.');
      setErrorModalVisible(true);
      return;
    }
    
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter email and password.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Basic password validation
    if (password.length < 8) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const role = isClient ? 'client' : 'guard';
      const { error } = await signIn(email, password, role);

      if (error) {
        Alert.alert('Login Failed', error.message || 'Invalid email or password. Please try again.');
      } else {
        // Navigation will be handled by AuthContext
        navigation.replace(isClient ? 'Client' : 'GuardTabs');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('UserTypeSelection');
  };

  return (
    <ErrorBoundary>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Modal transparent visible={errorModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Role</Text>
            <Text style={styles.modalMessage}>{errorModalMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setErrorModalVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
          <Text style={styles.header}>Welcome back,</Text>
          <Text style={styles.subheader}>Please enter your account details below.</Text>

          {/* Role selection moved below welcome text */}
          <View style={styles.roleContainer}>
            <TouchableOpacity 
              style={[styles.roleButton, isClient === true && styles.roleButtonActive]} 
              onPress={() => setIsClient(true)}
              disabled={isLoading}
            >
              <FontAwesome name="user" size={20} color={isClient === true ? '#fff' : '#2E88FA'} style={styles.roleIcon} />
              <Text style={[styles.roleText, isClient === true && styles.roleTextActive]}>Client</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleButton, isClient === false && styles.roleButtonActive]} 
              onPress={() => setIsClient(false)}
              disabled={isLoading}
            >
              <FontAwesome name="shield" size={20} color={isClient === false ? '#fff' : '#2E88FA'} style={styles.roleIcon} />
              <Text style={[styles.roleText, isClient === false && styles.roleTextActive]}>Guard</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={16} color="#888" />
            <TextInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, isLoading && styles.inputDisabled]}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlignVertical="center"
              editable={!isLoading}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={16} color="#888" />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              style={[styles.input, isLoading && styles.inputDisabled]}
              secureTextEntry={!showPassword}
              textAlignVertical="center"
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={styles.passwordToggle} 
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signInButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.biometricButton, isLoading && styles.buttonDisabled]}
            onPress={handleBiometricAuth}
            disabled={isLoading}
          >
            <MaterialIcons name="fingerprint" size={24} color="#2E88FA" />
            <Text style={styles.biometricButtonText}>Sign in with Face ID</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: 10 },
  roleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 8, borderWidth: 1, borderColor: '#2E88FA', backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2,
    width: '48%'
  },
  roleButtonActive: { backgroundColor: '#2E88FA' },
  roleIcon: { marginRight: 8 },
  roleText: { fontSize: 16, color: '#2E88FA' },
  roleTextActive: { color: '#fff', fontWeight: 'bold' },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
  subheader: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 10 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    height: 45, width: '100%', paddingHorizontal: 10,
    marginTop: 15
  },
  input: {
    flex: 1, marginLeft: 10,
    fontSize: 16, color: '#333',
    textAlignVertical: 'center'
  },
  inputDisabled: {
    opacity: 0.7,
  },
  passwordToggle: { padding: 5 },
  authOptionsRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 10 },
  authOption: { flexDirection: 'row', alignItems: 'center' },
  authIcon: { marginRight: 6 },
  signInButton: { width: '100%', backgroundColor: '#2E88FA', height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  signInButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonDisabled: {
    opacity: 0.7,
  },
  biometricButton: {
    width: '100%',
    flexDirection: 'row',
    height: 45,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E88FA',
    marginTop: 10,
    marginBottom: 10,
  },
  biometricButtonText: {
    color: '#2E88FA',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { marginHorizontal: 10, color: '#666' },
  socialButton: { width: '100%', flexDirection: 'row', height: 45, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ccc', marginBottom: 10 },
  socialIcon: { marginRight: 10 },
  socialText: { fontSize: 14, color: '#333' },
  signUpContainer: { width: '100%', flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  signUpText: { color: '#666' },
  signUpLink: { color: '#2E88FA', fontWeight: 'bold' },
  forgotText: { fontSize: 12, color: '#2E88FA' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', backgroundColor: '#fff', borderRadius: 8, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalMessage: { fontSize: 16, color: '#333', marginBottom: 20, textAlign: 'center' },
  modalButton: { backgroundColor: '#2E88FA', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
  },
});
