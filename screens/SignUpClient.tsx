import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { useAuth } from '../contexts/AuthContext';
import { NavigationProps } from '../types';
import { clientSignUpSchema, validateForm } from '../lib/validation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';

interface SignUpClientProps {
  navigation: NavigationProps;
}

export default function SignUpClient({ navigation }: SignUpClientProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [establishmentType, setEstablishmentType] = useState('');
  const [otherEstablishment, setOtherEstablishment] = useState('');
  const [location, setLocation] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate form using Zod schema
      const formData = {
        firstName,
        lastName,
        email,
        phone,
        password,
        confirmPassword,
        businessName,
        establishmentType: establishmentType === 'other' ? otherEstablishment : establishmentType,
        location,
        referralCode,
      };

      const validation = validateForm(clientSignUpSchema, formData);
      if (!validation.success) {
        setErrors(validation.errors || {});
        return;
      }

      // Create user with Supabase Auth using correct AuthContext signature
      const { error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        phone,
        business_name: businessName,
        establishment_type: establishmentType === 'other' ? otherEstablishment : establishmentType,
        location,
        referral_code: referralCode,
        role: 'client',
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Navigate to OTP verification
      navigation.navigate('OtpVerification', {
        phone,
        nextScreen: 'PreferredPayment',
        firstName,
        lastName,
        email,
        password,
        businessName,
        establishmentType: establishmentType === 'other' ? otherEstablishment : establishmentType,
        location,
        referralCode,
        role: 'client',
      });
    } catch (error) {
      console.error('Sign up error:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner text="Creating account..." />
      </View>
    );
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
          <ScrollView contentContainerStyle={styles.innerContainer} keyboardShouldPersistTaps="handled">
            
            <Text style={styles.header}>Client Sign Up</Text>
            <Text style={styles.subheader}>Join our client community.</Text>

            {error && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={20} color="#DC2626" />
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            )}

            {/* Shared Fields */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <MaterialIcons name="person" size={16} color="#888" />
                <TextInput placeholder="First Name" value={firstName} onChangeText={setFirstName} style={styles.input} />
              </View>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <MaterialIcons name="person" size={16} color="#888" />
                <TextInput placeholder="Last Name" value={lastName} onChangeText={setLastName} style={styles.input} />
              </View>
            </View>
            <View style={styles.rowContainer}>
              {errors.firstName && <Text style={[styles.errorText, styles.halfInput]}>{errors.firstName}</Text>}
              {errors.lastName && <Text style={[styles.errorText, styles.halfInput]}>{errors.lastName}</Text>}
            </View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={16} color="#888" />
              <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={16} color="#888" />
              <TextInput placeholder="Phone Number" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            <Text style={styles.sectionHeader}>Business Information</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="business" size={16} color="#888" />
              <TextInput placeholder="Business Name" value={businessName} onChangeText={setBusinessName} style={styles.input} />
            </View>
            {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}

            <Text style={styles.sectionHeader}>Type of Establishment</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="category" size={16} color="#888" />
              <Picker
                selectedValue={establishmentType}
                onValueChange={setEstablishmentType}
                style={styles.picker}
              >
                <Picker.Item label="Select Type" value="" />
                <Picker.Item label="Club" value="club" />
                <Picker.Item label="Event" value="event" />
                <Picker.Item label="Private" value="private" />
                <Picker.Item label="Corporate" value="corporate" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
            {errors.establishmentType && <Text style={styles.errorText}>{errors.establishmentType}</Text>}

            {establishmentType === 'other' && (
              <>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="edit" size={16} color="#888" />
                  <TextInput placeholder="Please specify establishment type" value={otherEstablishment} onChangeText={setOtherEstablishment} style={styles.input} />
                </View>
                {errors.otherEstablishment && <Text style={styles.errorText}>{errors.otherEstablishment}</Text>}
              </>
            )}

            <Text style={styles.sectionHeader}>Location</Text>
            <LocationAutocomplete onSelectAddress={(addr) => setLocation(addr)} />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

            <Text style={styles.sectionHeader}>Referral Code (Optional)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="redeem" size={16} color="#888" />
              <TextInput placeholder="Referral Code" value={referralCode} onChangeText={setReferralCode} style={styles.input} autoCapitalize="characters" />
            </View>

            <Text style={styles.sectionHeader}>Password</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={16} color="#888" />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry={true}
              />
            </View>
            <View style={styles.rowContainer}>
              {errors.password && <Text style={[styles.errorText, styles.halfInput]}>{errors.password}</Text>}
            </View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={16} color="#888" />
              <TextInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                secureTextEntry={!showConfirmPassword}
                onBlur={() => {
                  if (confirmPassword && confirmPassword !== password) {
                    setErrors(e => ({ ...e, confirmPassword: 'Passwords do not match' }));
                  } else {
                    setErrors(e => { const ne = { ...e }; delete ne.confirmPassword; return ne; });
                  }
                }}
                onSubmitEditing={() => {
                  if (confirmPassword && confirmPassword !== password) {
                    setErrors(e => ({ ...e, confirmPassword: 'Passwords do not match' }));
                  }
                }}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} style={styles.eyeIconButton}>
                <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={22} color="#888" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1 },
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
  placeholderText: { color: '#888', lineHeight: 45 },
  multilineContainer: { height: 60 },
  signUpButton: { width: '100%', backgroundColor: '#2E88FA', height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  signUpText: { color: '#fff', fontWeight: 'bold' },
  signInContainer: { width: '100%', flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signInText: { color: '#666' },
  signInLink: { color: '#2E88FA', fontWeight: 'bold' },
  picker: {
    width: '100%',
    height: 60,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 45,
    width: '100%',
    backgroundColor: '#fff',
  },
  autocompleteWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 15,
  },
  autocompleteInput: {
    flex: 1,
    paddingLeft: 5,
  },
  autocompleteListContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 2,
    elevation: 1,
    maxHeight: 250,
  },
  suggestionItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  eyeIconButton: {
    padding: 4,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { color: 'red', fontSize: 12, marginTop: -14, marginBottom: 4 },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  errorMessage: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
});
