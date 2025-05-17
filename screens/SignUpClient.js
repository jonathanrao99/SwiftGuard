import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function SignUpClient({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [establishmentType, setEstablishmentType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [location, setLocation] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleSignUp = () => {
    // Add validation if needed
    navigation.replace('ClientDashboard');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.container}>
        <ScrollView contentContainerStyle={styles.innerContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Image source={require('../assets/logo.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.header}>Client Sign Up</Text>
          <Text style={styles.subheader}>Join us in less than 1 minute.</Text>

          {/* Shared Fields */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={16} color="#888" />
            <TextInput placeholder="Full Name" value={fullName} onChangeText={setFullName} style={styles.input} />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={16} color="#888" />
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="phone" size={16} color="#888" />
            <TextInput placeholder="Phone Number" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={16} color="#888" />
            <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={16} color="#888" />
            <TextInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} secureTextEntry />
          </View>

          {/* Client-Specific Fields */}
          <Text style={styles.sectionHeader}>Business / Organization (optional)</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="business" size={16} color="#888" />
            <TextInput placeholder="Business / Org Name" value={businessName} onChangeText={setBusinessName} style={styles.input} />
          </View>
          <Text style={styles.sectionHeader}>Type of Establishment</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="category" size={16} color="#888" />
            <TextInput placeholder="e.g. Club / Event / Private / Corporate" value={establishmentType} onChangeText={setEstablishmentType} style={styles.input} />
          </View>
          <Text style={styles.sectionHeader}>Preferred Payment Method (optional)</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="payment" size={16} color="#888" />
            <TextInput placeholder="Preferred Payment Method" value={paymentMethod} onChangeText={setPaymentMethod} style={styles.input} />
          </View>
          <Text style={styles.sectionHeader}>Location (City/Area)</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="location-on" size={16} color="#888" />
            <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={styles.input} />
          </View>
          <Text style={styles.sectionHeader}>Referral Code (optional)</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="redeem" size={16} color="#888" />
            <TextInput placeholder="Referral Code" value={referralCode} onChangeText={setReferralCode} style={styles.input} />
          </View>

          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center' },
  innerContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  logoContainer: { alignItems: 'center', marginVertical: 10 },
  logoImage: { width: 120, height: 120, resizeMode: 'contain' },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 10 },
  subheader: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  sectionHeader: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 5 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    height: 45, width: '100%', paddingHorizontal: 10,
    marginBottom: 15
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333', textAlignVertical: 'center' },
  signUpButton: {
    width: '100%', backgroundColor: '#2E88FA', height: 45,
    borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20
  },
  signUpText: { color: '#fff', fontWeight: 'bold' },
  signInContainer: { width: '100%', flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signInText: { color: '#666' },
  signInLink: { color: '#2E88FA', fontWeight: 'bold' },
}); 