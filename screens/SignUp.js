import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

export default function SignUp({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="shield-key-outline" size={80} color="#2E88FA" />
          </View>
          <Text style={styles.header}>Sign Up to SwiftGuard</Text>
          <Text style={styles.subheader}>Join us for less than 1 minute, no cost.</Text>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              placeholder="Enter your Email Address"
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
              placeholder="Enter Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              secureTextEntry
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <FontAwesome name="phone" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter #"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <MaterialCommunityIcons name="calendar-month" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                placeholder="Date of Birth"
                value={dob}
                onChangeText={setDob}
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.replace('ClientDashboard')}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  scrollContainer: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20 },
  logoContainer: { alignItems: 'center', marginVertical: 10 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 10 },
  subheader: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  inputContainer: { width: '100%', marginBottom: 15, position: 'relative' },
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  halfWidth: { width: '48%' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingLeft: 40, height: 45 },
  inputIcon: { position: 'absolute', top: 12, left: 10 },
  signUpButton: { width: '100%', backgroundColor: '#2E88FA', height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  signUpText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
}); 