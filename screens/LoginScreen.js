import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

export default function LoginScreen({ navigation }) {
  const [isClient, setIsClient] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleBiometricAuth = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) {
        Alert.alert('Biometric not supported', 'Your device does not support Face ID or no biometrics are enrolled.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Login with Face ID' });
      if (result.success) {
        navigation.replace(isClient ? 'ClientDashboard' : 'SecurityDashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.container}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="shield-key-outline" size={120} color="#2E88FA" />
          <Text style={styles.logoText}>SwiftGuard</Text>
        </View>
        <View style={styles.segmentContainer}>
          <TouchableOpacity style={[styles.segment, isClient && styles.segmentActive]} onPress={() => setIsClient(true)}>
            <Text style={[styles.segmentText, isClient && styles.segmentTextActive]}>Client</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segment, !isClient && styles.segmentActive]} onPress={() => setIsClient(false)}>
            <Text style={[styles.segmentText, !isClient && styles.segmentTextActive]}>Security</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.header}>Sign In</Text>
        <Text style={styles.subheader}>Welcome back, Please enter your account details below.</Text>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>
        {/* Biometric and Forgot Password links under password field */}
        <View style={styles.authOptionsRow}>
          <TouchableOpacity style={styles.authOption} onPress={handleBiometricAuth}>
            <MaterialCommunityIcons name="face-recognition" size={16} color="#2E88FA" style={styles.authIcon} />
            <Text style={styles.forgotText}>Use Face ID</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot Password</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.signInButton} onPress={() => navigation.replace(isClient ? 'ClientDashboard' : 'SecurityDashboard')}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>
        <TouchableOpacity style={styles.socialButton} onPress={() => {}}>
          <FontAwesome name="google" size={20} color="#DB4437" style={styles.socialIcon} />
          <Text style={styles.socialText}>Sign in with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={() => {}}>
          <FontAwesome name="apple" size={20} color="#000" style={styles.socialIcon} />
          <Text style={styles.socialText}>Sign in with Apple</Text>
        </TouchableOpacity>
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginVertical: 20 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 10 },
  segmentContainer: { flexDirection: 'row', alignSelf: 'center', marginVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 25 },
  segment: { paddingVertical: 8, paddingHorizontal: 25, borderRadius: 25 },
  segmentActive: { backgroundColor: '#2E88FA' },
  segmentText: { fontSize: 14, color: '#666' },
  segmentTextActive: { color: '#fff' },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 10 },
  subheader: { fontSize: 14, color: '#666', textAlign: 'center', marginVertical: 10 },
  inputContainer: { width: '100%', marginTop: 15 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingLeft: 40, height: 45 },
  inputIcon: { position: 'absolute', top: 12, left: 10 },
  passwordToggle: { position: 'absolute', right: 10, top: 12 },
  authOptionsRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 10 },
  authOption: { flexDirection: 'row', alignItems: 'center' },
  authIcon: { marginRight: 6 },
  signInButton: { width: '100%', backgroundColor: '#2E88FA', height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  signInText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
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
}); 