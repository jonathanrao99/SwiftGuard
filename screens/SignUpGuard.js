import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignUpGuard({ navigation }) {
  const [fullName, setFullName] = useState('');
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
  const [certifications, setCertifications] = useState('');
  const [availability, setAvailability] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const handleSignUp = () => {
    // Add validation if needed
    navigation.replace('SecurityDashboard');
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.container}>
        <ScrollView contentContainerStyle={styles.innerContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Image source={require('../assets/logo.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.header}>Security Sign Up</Text>
          <Text style={styles.subheader}>Join our guard community.</Text>

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

          {/* Guard-Specific Fields */}
          <Text style={styles.sectionHeader}>Date of Birth</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
            <MaterialIcons name="calendar-today" size={16} color="#888" />
            <Text style={[styles.input, dob ? {} : styles.placeholderText]}>{dob || 'Select Date of Birth'}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />
          )}

          <Text style={styles.sectionHeader}>Gender (optional)</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="wc" size={16} color="#888" />
            <TextInput placeholder="Gender" value={gender} onChangeText={setGender} style={styles.input} />
          </View>

          <Text style={styles.sectionHeader}>Experience Level</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="star" size={16} color="#888" />
            <TextInput placeholder="Entry / Certified / Elite" value={experienceLevel} onChangeText={setExperienceLevel} style={styles.input} />
          </View>

          <Text style={styles.sectionHeader}>Years of Experience</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="timer" size={16} color="#888" />
            <TextInput placeholder="Years of Experience" value={yearsExperience} onChangeText={setYearsExperience} style={styles.input} keyboardType="numeric" />
          </View>

          <Text style={styles.sectionHeader}>Certifications</Text>
          <View style={[styles.inputContainer, styles.multilineContainer]}>
            <MaterialIcons name="verified" size={16} color="#888" />
            <TextInput placeholder="List your certifications" value={certifications} onChangeText={setCertifications} style={[styles.input, { height: 60 }]} multiline />
          </View>

          <Text style={styles.sectionHeader}>Availability</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="access-time" size={16} color="#888" />
            <TextInput placeholder="e.g. Days/Nights, Weekends" value={availability} onChangeText={setAvailability} style={styles.input} />
          </View>

          <Text style={styles.sectionHeader}>Address / City</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="location-city" size={16} color="#888" />
            <TextInput placeholder="Address or City" value={address} onChangeText={setAddress} style={styles.input} />
          </View>

          <Text style={styles.sectionHeader}>Bio</Text>
          <View style={[styles.inputContainer, styles.multilineContainer]}>
            <MaterialIcons name="edit" size={16} color="#888" />
            <TextInput placeholder="Tell us about yourself" value={bio} onChangeText={setBio} style={[styles.input, { height: 60 }]} multiline />
          </View>

          <Text style={styles.sectionHeader}>Emergency Contact</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="contact-phone" size={16} color="#888" />
            <TextInput placeholder="Emergency Contact" value={emergencyContact} onChangeText={setEmergencyContact} style={styles.input} />
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
  signInLink: { color: '#2E88FA', fontWeight: 'bold' }
}); 