import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image, Linking, Modal } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

export default function LoginScreen({ navigation }) {
  const [isClient, setIsClient] = useState(null); // true=Client, false=Security, null=none selected
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

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
        navigation.replace(isClient === true ? 'ClientDashboard' : 'SecurityDashboard');
      }
    } catch (e) {
      console.error(e);
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
    navigation.replace(isClient === true ? 'ClientDashboard' : 'SecurityDashboard');
  };

  return (
    <>
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
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.container}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/logo.png')} style={styles.logoImage} />
            <Text style={styles.logoText}>SwiftGuard</Text>
          </View>
          <View style={styles.roleContainer}>
            <TouchableOpacity style={[styles.roleButton, isClient === true && styles.roleButtonActive]} onPress={() => setIsClient(true)}>
              <FontAwesome name="user" size={20} color={isClient === true ? '#fff' : '#2E88FA'} style={styles.roleIcon} />
              <Text style={[styles.roleText, isClient === true && styles.roleTextActive]}>Client</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, isClient === false && styles.roleButtonActive]} onPress={() => setIsClient(false)}>
              <FontAwesome name="shield" size={20} color={isClient === false ? '#fff' : '#2E88FA'} style={styles.roleIcon} />
              <Text style={[styles.roleText, isClient === false && styles.roleTextActive]}>Security</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.header}>Sign In</Text>
          <Text style={styles.subheader}>Welcome back, Please enter your account details below.</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={16} color="#888" />
            <TextInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlignVertical="center"
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={16} color="#888" />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPassword}
              textAlignVertical="center"
            />
            <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={16}
                color="#888"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.authOptionsRow}>
            <TouchableOpacity style={styles.authOption} onPress={handleBiometricAuth}>
              <Text style={styles.forgotText}>Use Face ID</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
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
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginVertical: 20 },
  logoImage: { width: 120, height: 120, resizeMode: 'contain' },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 10 },
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
  header: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 10 },
  subheader: { fontSize: 14, color: '#666', textAlign: 'center', marginVertical: 10 },
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
  passwordToggle: { padding: 5 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', backgroundColor: '#fff', borderRadius: 8, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalMessage: { fontSize: 16, color: '#333', marginBottom: 20, textAlign: 'center' },
  modalButton: { backgroundColor: '#2E88FA', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
}); 