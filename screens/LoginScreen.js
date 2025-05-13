import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [isClient, setIsClient] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.container}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="shield-key-outline" size={64} color="#2E88FA" />
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
        <Text style={styles.header}>Sign In to SwiftGuard</Text>
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
            secureTextEntry
          />
          <TouchableOpacity style={styles.forgotButton} onPress={() => navigation.navigate('ForgotPassword')}>
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
          <Text style={styles.socialText}>Sign up with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={() => {}}>
          <FontAwesome name="apple" size={20} color="#000" style={styles.socialIcon} />
          <Text style={styles.socialText}>Sign up with Apple</Text>
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
  container: { flex: 1, padding: 20 },
  logoContainer: { alignItems: 'center', marginVertical: 20 },
  logoText: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 10 },
  segmentContainer: { flexDirection: 'row', alignSelf: 'center', marginVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 25 },
  segment: { paddingVertical: 8, paddingHorizontal: 25, borderRadius: 25 },
  segmentActive: { backgroundColor: '#2E88FA' },
  segmentText: { fontSize: 14, color: '#666' },
  segmentTextActive: { color: '#fff' },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 10 },
  subheader: { fontSize: 14, color: '#666', textAlign: 'center', marginVertical: 10 },
  inputContainer: { marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingLeft: 40, height: 45 },
  inputIcon: { position: 'absolute', top: 12, left: 10 },
  forgotButton: { position: 'absolute', right: 10, top: 12 },
  forgotText: { fontSize: 12, color: '#2E88FA' },
  signInButton: { backgroundColor: '#2E88FA', height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  signInText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { marginHorizontal: 10, color: '#666' },
  socialButton: { flexDirection: 'row', height: 45, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ccc', marginBottom: 10 },
  socialIcon: { marginRight: 10 },
  socialText: { fontSize: 14, color: '#333' },
  signUpContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  signUpText: { color: '#666' },
  signUpLink: { color: '#2E88FA', fontWeight: 'bold' },
}); 