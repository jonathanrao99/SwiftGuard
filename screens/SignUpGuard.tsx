import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { useAuth } from '../contexts/AuthContext';
import { NavigationProps } from '../types';
import { guardSignUpSchema, validateForm } from '../lib/validation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';

interface SignUpGuardProps {
  navigation: NavigationProps;
}

export default function SignUpGuard({ navigation }: SignUpGuardProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [dob, setDob] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [gender, setGender] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [certifications, setCertifications] = useState([]);
  const [availability, setAvailability] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

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
      dob,
      gender,
      experienceLevel,
      yearsExperience,
      availability,
      address,
      bio,
      emergencyContact,
    };

    const validation = validateForm(guardSignUpSchema, formData);
    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    try {
      // Create user with Supabase Auth
      const { data, error } = await signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            gender,
            dob,
            experience_level: experienceLevel,
            years_experience: yearsExperience,
            certifications,
            availability,
            address,
            bio,
            emergency_contact: emergencyContact,
            role: 'guard',
          },
        },
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
        gender,
        dob,
        experienceLevel,
        yearsExperience,
        certifications,
        availability,
        address,
        bio,
        emergencyContact,
        role: 'guard',
      });
    } catch (error) {
      console.error('Sign up error:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickCertifications = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: false,
      });
      if (!result.canceled) {
        setCertifications((prev) => [...prev, ...result.assets]);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      const year = selectedDate.getFullYear();
      setDob(`${month}/${day}/${year}`);
    }
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
    <View style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.container}>
        <ScrollView contentContainerStyle={styles.innerContainer} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.header}>Security Sign Up</Text>
          <Text style={styles.subheader}>Join our guard community.</Text>

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
          

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <MaterialIcons name="wc" size={16} color="#888" />
              <Picker
                selectedValue={gender}
                onValueChange={setGender}
                style={styles.picker}
              >
                <Picker.Item label="Gender" value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Non-binary" value="nonbinary" />
                <Picker.Item label="Prefer not to say" value="prefer_not_to_say" />
              </Picker>
            </View>
            <TouchableOpacity style={[styles.inputContainer, styles.halfInput]} onPress={() => setShowDatePicker(true)}>
              <MaterialIcons name="calendar-today" size={16} color="#888" />
              <Text style={[styles.input, dob ? {} : styles.placeholderText]}>{dob || 'Date of Birth'}</Text>
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />
          )}
          <View style={styles.rowContainer}>
            {errors.gender && <Text style={[styles.errorText, styles.halfInput]}>{errors.gender}</Text>}
            {errors.dob && <Text style={[styles.errorText, styles.halfInput]}>{errors.dob}</Text>}
          </View>

          <Text style={styles.sectionHeader}>Experience Level</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="star" size={16} color="#888" />
            <Picker
              selectedValue={experienceLevel}
              onValueChange={setExperienceLevel}
              style={styles.picker}
            >
              <Picker.Item label="Select Level" value="" />
              <Picker.Item label="Entry" value="entry" />
              <Picker.Item label="Certified" value="certified" />
              <Picker.Item label="Elite" value="elite" />
            </Picker>
          </View>
          {errors.experienceLevel && <Text style={styles.errorText}>{errors.experienceLevel}</Text>}

          <Text style={styles.sectionHeader}>Years of Experience</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="timer" size={16} color="#888" />
            <TextInput placeholder="Years of Experience" value={yearsExperience} onChangeText={setYearsExperience} style={styles.input} keyboardType="numeric" />
          </View>
          {errors.yearsExperience && <Text style={styles.errorText}>{errors.yearsExperience}</Text>}

          <Text style={styles.sectionHeader}>Certifications</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="verified" size={16} color="#888" />
            <Text style={styles.certPlaceholder}>Certifications</Text>
            <TouchableOpacity style={styles.uploadIconButton} onPress={handlePickCertifications}>
              <MaterialIcons name="file-upload" size={22} color="#2E88FA" />
            </TouchableOpacity>
          </View>
          {certifications.length > 0 && (
            <View style={styles.certList}>
              {certifications.map((file, idx) => (
                <View key={file.uri || idx} style={styles.certFileRow}>
                  <Text style={styles.certFile}>{file.name}</Text>
                  <TouchableOpacity onPress={() => {
                    setCertifications(certifications.filter((_, i) => i !== idx));
                  }} style={styles.removeCertButton}>
                    <MaterialIcons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {errors.certifications && <Text style={styles.errorText}>{errors.certifications}</Text>}

          <Text style={styles.sectionHeader}>Address</Text>
          <LocationAutocomplete onSelectAddress={(addr) => setAddress(addr)} />
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

          <Text style={styles.sectionHeader}>Bio</Text>
          <View style={styles.bioContainer}>
            <MaterialIcons name="edit" size={18} color="#888" style={styles.bioIcon} />
            <View style={styles.bioInputWrapper}>
              {bio.length === 0 && (
                <Text style={styles.bioPlaceholder}>Tell us about yourself</Text>
              )}
              <TextInput
                value={bio}
                onChangeText={text => text.length <= 500 && setBio(text)}
                style={styles.bioInput}
                multiline
                maxLength={500}
                placeholder=""
              />
              <Text style={styles.bioCounter}>{bio.length}/500</Text>
            </View>
          </View>
          {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}

          <Text style={styles.sectionHeader}>Emergency Contact</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="contact-phone" size={16} color="#888" />
            <TextInput placeholder="Emergency Contact" value={emergencyContact} onChangeText={setEmergencyContact} style={styles.input} keyboardType="numeric" />
          </View>
          {errors.emergencyContact && <Text style={styles.errorText}>{errors.emergencyContact}</Text>}

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
  certPlaceholder: {
    flex: 1,
    color: '#888',
    fontSize: 16,
    marginLeft: 10,
  },
  uploadIconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#eaf3fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  certList: {
    marginTop: 5,
    marginBottom: 10,
    paddingLeft: 10,
  },
  certFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  certFile: {
    color: '#333',
    fontSize: 14,
  },
  removeCertButton: {
    marginLeft: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bioContainer: {
    width: '100%',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  bioIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bioInputWrapper: {
    flex: 1,
    position: 'relative',
    minHeight: 70,
    justifyContent: 'flex-start',
  },
  bioPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    color: '#888',
    fontSize: 15,
    zIndex: 1,
    paddingTop: 2,
    paddingLeft: 2,
  },
  bioInput: {
    minHeight: 70,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  bioCounter: {
    position: 'absolute',
    right: 16,
    bottom: -30,
    color: '#888',
    fontSize: 12,
    zIndex: 3,
    backgroundColor: 'transparent',
    padding: 0,
  },
  eyeIconButton: {
    padding: 4,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { color: 'red', fontSize: 12, marginTop: -14, marginBottom: 4 },
}); 