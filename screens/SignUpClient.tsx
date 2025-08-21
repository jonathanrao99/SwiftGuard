import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { useAuth } from '../contexts/AuthContext';
import { NavigationProps } from '../types';
import { clientSignUpSchema, validateForm } from '../lib/validation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import { COLORS, SPACING, LAYOUT } from '../theme';

const { width, height } = Dimensions.get('window');

interface SignUpClientProps {
  navigation: NavigationProps;
}

type ErrorMap = Record<string, string>;

export default function SignUpClient({ navigation }: SignUpClientProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [establishmentType, setEstablishmentType] = useState('');
  const [otherEstablishment, setOtherEstablishment] = useState('');
  const [location, setLocation] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [errors, setErrors] = useState<ErrorMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const { signUp } = useAuth();

  const handleSignUp = async () => {
    try {
      setIsLoading(true);
      setErrorBanner(null);
      setErrors({});

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
        setErrorBanner(error.message);
        return;
      }

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
    } catch (e) {
      console.error('Sign up error:', e);
      setErrorBanner('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputHasError = (k: string) => Boolean(errors?.[k]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark || '#1E40AF']}
          style={styles.loadingGradient}
        >
          <LoadingSpinner text="Creating your account..." />
        </LinearGradient>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark || '#1E40AF']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Join SwiftGuard</Text>
            <Text style={styles.headerSubtitle}>Secure your business with professional security</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          {errorBanner && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color={COLORS.error} />
              <Text style={styles.errorMessage}>{errorBanner}</Text>
            </View>
          )}

          {/* Personal Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <MaterialIcons name="person" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputWrapper, inputHasError('firstName') && styles.inputError]}>
                <MaterialIcons name="person-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  placeholder="First Name"
                  placeholderTextColor={COLORS.textSecondary}
                  value={firstName}
                  onChangeText={setFirstName}
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputWrapper, inputHasError('lastName') && styles.inputError]}>
                <MaterialIcons name="person-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  placeholder="Last Name"
                  placeholderTextColor={COLORS.textSecondary}
                  value={lastName}
                  onChangeText={setLastName}
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>
            </View>
            <View style={styles.errorRow}>
              {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : <View />}
              {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : <View />}
            </View>

            <View style={[styles.inputWrapper, inputHasError('email') && styles.inputError]}>
              <MaterialIcons name="email" size={20} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor={COLORS.textSecondary}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <View style={[styles.inputWrapper, inputHasError('phone') && styles.inputError]}>
              <MaterialIcons name="phone" size={20} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor={COLORS.textSecondary}
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Security Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <MaterialIcons name="security" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>Security</Text>
            </View>

            <View style={[styles.inputWrapper, inputHasError('password') && styles.inputError]}>
              <MaterialIcons name="lock" size={20} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Password"
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
              />
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <View style={[styles.inputWrapper, inputHasError('confirmPassword') && styles.inputError]}>
              <MaterialIcons name="lock" size={20} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor={COLORS.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <MaterialIcons
                  name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                  size={22}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          {/* Business Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <MaterialIcons name="business" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>Business Details</Text>
            </View>

            <View style={[styles.inputWrapper, inputHasError('businessName') && styles.inputError]}>
              <MaterialIcons name="store" size={20} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Business Name"
                placeholderTextColor={COLORS.textSecondary}
                value={businessName}
                onChangeText={setBusinessName}
                style={styles.input}
              />
            </View>
            {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}

            <View style={[styles.inputWrapper, inputHasError('establishmentType') && styles.inputError]}>
              <MaterialIcons name="category" size={20} color={COLORS.textSecondary} />
              <Picker
                selectedValue={establishmentType}
                onValueChange={setEstablishmentType}
                style={styles.picker}
                dropdownIconColor={COLORS.textSecondary}
              >
                <Picker.Item label="Select Establishment Type" value="" />
                <Picker.Item label="Nightclub" value="nightclub" />
                <Picker.Item label="Event Venue" value="event" />
                <Picker.Item label="Private Party" value="private" />
                <Picker.Item label="Corporate Event" value="corporate" />
                <Picker.Item label="Wedding" value="wedding" />
                <Picker.Item label="Concert" value="concert" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
            {errors.establishmentType && <Text style={styles.errorText}>{errors.establishmentType}</Text>}

            {establishmentType === 'other' && (
              <>
                <View style={[styles.inputWrapper, inputHasError('otherEstablishment') && styles.inputError]}>
                  <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
                  <TextInput
                    placeholder="Please specify establishment type"
                    placeholderTextColor={COLORS.textSecondary}
                    value={otherEstablishment}
                    onChangeText={setOtherEstablishment}
                    style={styles.input}
                  />
                </View>
                {errors.otherEstablishment && <Text style={styles.errorText}>{errors.otherEstablishment}</Text>}
              </>
            )}

            <View style={styles.locationContainer}>
              <Text style={styles.locationLabel}>Location</Text>
              <LocationAutocomplete onSelectAddress={(address) => setLocation(address)} />
            </View>
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

            <View style={[styles.inputWrapper]}>
              <MaterialIcons name="card-giftcard" size={20} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Referral Code (Optional)"
                placeholderTextColor={COLORS.textSecondary}
                value={referralCode}
                onChangeText={setReferralCode}
                style={styles.input}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark || '#1E40AF']}
              style={styles.buttonGradient}
            >
              <Text style={styles.signUpText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Why Choose SwiftGuard?</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <MaterialIcons name="verified-user" size={20} color={COLORS.primary} />
                <Text style={styles.benefitText}>Background-checked security professionals</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialIcons name="schedule" size={20} color={COLORS.primary} />
                <Text style={styles.benefitText}>24/7 availability and instant booking</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialIcons name="security" size={20} color={COLORS.primary} />
                <Text style={styles.benefitText}>Licensed and insured guards</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
         paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight || '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 8,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  picker: {
    flex: 1,
    marginLeft: 12,
    color: COLORS.textDark,
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
    marginLeft: 4,
  },
  errorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    marginBottom: 8,
  },
  signUpButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  signUpText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  signInText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  signInLink: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  benefitsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorMessage: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
}); 