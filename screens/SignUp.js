import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, Modal } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignUp({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isClient, setIsClient] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [dobError, setDobError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const formatDate = (d) => {
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const validateEmail = (value) => {
    setEmail(value);
    if (!value.includes('@') || !value.includes('.com')) {
      setEmailError('Must include @ and .com');
    } else {
      setEmailError('');
    }
  };

  const validatePhone = (value) => {
    setPhone(value);
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 10) {
      setPhoneError('Must be 10 digits');
    } else {
      setPhoneError('');
    }
  };

  const validateDobDate = (d) => {
    setDate(d);
    const dobStr = formatDate(d);
    setDob(dobStr);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    if (age < 16) setDobError('Must be at least 16 yrs old'); else setDobError('');
  };

  const validateConfirm = (value) => {
    setConfirmPassword(value);
    if (value !== password) setConfirmError('Passwords do not match'); else setConfirmError('');
  };

  const handleSignUp = () => {
    if (isClient === null) {
      setErrorModalMessage('Please select a role to continue.');
      setErrorModalVisible(true);
      return;
    }
    let valid = true;
    if (!email.includes('@') || !email.includes('.com')) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setPhoneError('Must be 10 digits');
      valid = false;
    } else {
      setPhoneError('');
    }
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    if (age < 16) {
      setDobError('Must be at least 16 yrs old');
      valid = false;
    } else {
      setDobError('');
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    } else {
      setConfirmError('');
    }
    if (valid) {
      navigation.replace(isClient ? 'ClientDashboard' : 'SecurityDashboard');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.container}
      >
        <View style={styles.innerContainer}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/logo.png')} style={styles.logoImage} />
          </View>
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
          <Text style={styles.header}>Sign Up</Text>
          <Text style={styles.subheader}>Join us in less than 1 minute, no cost.</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={16} color="#888" />
            <TextInput
              placeholder="Enter your Email Address"
              value={email}
              onChangeText={(value) => { setEmail(value); if (emailError) setEmailError(''); }}
              onBlur={() => validateEmail(email)}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <MaterialIcons name="phone" size={16} color="#888" />
              <TextInput
                placeholder="Enter #"
                value={phone}
                onChangeText={(value) => { setPhone(value); if (phoneError) setPhoneError(''); }}
                onBlur={() => validatePhone(phone)}
                style={styles.input}
                keyboardType="phone-pad"
              />
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <MaterialIcons name="calendar-today" size={16} color="#888" />
              <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.inputText, dob ? {} : styles.placeholderText]}>
                  {dob || 'Date of Birth'}
                </Text>
              </TouchableOpacity>
              {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={16} color="#888" />
            <TextInput
              placeholder="Enter Password"
              value={password}
              onChangeText={(text) => { setPassword(text); if (confirmPassword) validateConfirm(confirmPassword); }}
              style={styles.input}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={16} color="#888" />
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={validateConfirm}
              style={styles.input}
              secureTextEntry
            />
          </View>
          {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
          
          <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                validateDobDate(selectedDate);
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorText: { color: 'red', fontSize: 12, marginTop: 4 },
  inputText: { fontSize: 16, color: '#000', lineHeight: 45 },
  placeholderText: { color: '#888' },
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  innerContainer: { width: '100%' },
  logoContainer: { alignItems: 'center', marginVertical: 10 },
  logoImage: { width: 120, height: 120, resizeMode: 'contain' },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 10 },
  subheader: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    height: 45, width: '100%', paddingHorizontal: 10,
    marginBottom: 15
  },
  input: {
    flex: 1, marginLeft: 10,
    fontSize: 16, color: '#333',
    textAlignVertical: 'center'
  },
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  halfWidth: { width: '48%' },
  signUpButton: { width: '100%', backgroundColor: '#2E88FA', height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  signInContainer: { width: '100%', flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signInText: { color: '#666' },
  signInLink: { color: '#2E88FA', fontWeight: 'bold' },
  signUpText: { color: '#fff', fontWeight: 'bold' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', backgroundColor: '#fff', borderRadius: 8, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalMessage: { fontSize: 16, color: '#333', marginBottom: 20, textAlign: 'center' },
  modalButton: { backgroundColor: '#2E88FA', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
}); 