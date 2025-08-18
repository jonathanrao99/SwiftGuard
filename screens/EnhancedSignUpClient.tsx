import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { useAuth } from '../contexts/AuthContext';
import { NavigationProps } from '../types';
import { clientSignUpSchema, validateForm } from '../lib/validation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import { EnhancedInput } from '../components/ui/enhanced-input';
import { StepIndicator } from '../components/ui/step-indicator';
import { useToast } from '../components/ui/toast';
import { supabase } from '../supabaseClient';

interface EnhancedSignUpClientProps {
  navigation: NavigationProps;
}

const steps = [
  { id: 'personal', title: 'Personal', description: 'Basic info' },
  { id: 'business', title: 'Business', description: 'Company details' },
  { id: 'verification', title: 'Verify', description: 'Confirm account' },
];

export default function EnhancedSignUpClient({ navigation }: EnhancedSignUpClientProps) {
  // Form data state
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

  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldValidation, setFieldValidation] = useState<any>({});

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { signUp } = useAuth();
  const { width } = Dimensions.get('window');
  const toast = useToast();

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const validation: any = {};
    
    switch (field) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        validation.email = emailRegex.test(value) ? 'success' : (value ? 'error' : '');
        break;
      case 'phone':
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        validation.phone = phoneRegex.test(value) && value.length >= 10 ? 'success' : (value ? 'error' : '');
        break;
      case 'password':
        validation.password = value.length >= 8 ? 'success' : (value ? 'error' : '');
        break;
      case 'confirmPassword':
        validation.confirmPassword = value === password && value.length > 0 ? 'success' : (value ? 'error' : '');
        break;
      case 'firstName':
        validation.firstName = value.length >= 2 ? 'success' : (value ? 'error' : '');
        break;
      case 'lastName':
        validation.lastName = value.length >= 2 ? 'success' : (value ? 'error' : '');
        break;
      case 'businessName':
        validation.businessName = value.length >= 2 ? 'success' : (value ? 'error' : '');
        break;
    }

    setFieldValidation(prev => ({ ...prev, ...validation }));
  };

  // Step animation
  const animateToStep = (step: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -step * width,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(step);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const checkDuplicateUser = async (email: string, businessName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, business_name')
        .eq('email', email.toLowerCase())
        .eq('business_name', businessName.trim())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking duplicate user:', error);
        return false;
      }

      return !!data; // Returns true if user exists
    } catch (error) {
      console.error('Error in checkDuplicateUser:', error);
      return false;
    }
  };

  const nextStep = async () => {
    if (validateCurrentStep()) {
      // Check for duplicate user before proceeding to final step
      if (currentStep === 1 && email && businessName) {
        const isDuplicate = await checkDuplicateUser(email, businessName);
        if (isDuplicate) {
          toast.show({
            type: 'error',
            title: 'User Already Registered',
            description: `An account with email "${email}" and business "${businessName}" already exists. Please sign in instead.`,
            duration: 6000,
          });
          return;
        }
      }

      if (currentStep < steps.length - 1) {
        animateToStep(currentStep + 1);
      } else {
        handleSignUp();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      animateToStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    const newErrors: any = {};

    if (currentStep === 0) {
      if (!firstName.trim()) newErrors.firstName = 'First name is required';
      if (!lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!email.trim()) newErrors.email = 'Email is required';
      if (!phone.trim()) newErrors.phone = 'Phone is required';
      if (!password) newErrors.password = 'Password is required';
      if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    } else if (currentStep === 1) {
      if (!businessName.trim()) newErrors.businessName = 'Business name is required';
      if (!establishmentType) newErrors.establishmentType = 'Please select establishment type';
      if (establishmentType === 'other' && !otherEstablishment.trim()) {
        newErrors.otherEstablishment = 'Please specify establishment type';
      }
      if (!location.trim()) newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    try {
      setIsLoading(true);
      setError(null);

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
        animateToStep(0); // Go back to first step if validation fails
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
        setError(error.message);
        animateToStep(0); // Go back to first step on error
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
    } catch (error) {
      console.error('Sign up error:', error);
      setError('Failed to create account. Please try again.');
      animateToStep(0);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner text="Creating your account..." />
      </View>
    );
  }

  const renderPersonalInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Let's get to know you</Text>
      <Text style={styles.stepSubtitle}>Enter your personal information to get started</Text>

      <View style={styles.rowContainer}>
        <EnhancedInput
          label="First Name"
          value={firstName}
          onChangeText={(text) => {
            setFirstName(text);
            validateField('firstName', text);
          }}
          leftIcon="person"
          error={errors.firstName}
          success={fieldValidation.firstName === 'success'}
          isRequired
          variant="outlined"
          style={styles.halfInput}
        />
        <EnhancedInput
          label="Last Name"
          value={lastName}
          onChangeText={(text) => {
            setLastName(text);
            validateField('lastName', text);
          }}
          leftIcon="person"
          error={errors.lastName}
          success={fieldValidation.lastName === 'success'}
          isRequired
          variant="outlined"
          style={styles.halfInput}
        />
      </View>

      <EnhancedInput
        label="Email Address"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          validateField('email', text);
        }}
        leftIcon="email"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
        success={fieldValidation.email === 'success'}
        helperText="We'll use this for account verification"
        isRequired
        variant="outlined"
      />

      <EnhancedInput
        label="Phone Number"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          validateField('phone', text);
        }}
        leftIcon="phone"
        keyboardType="phone-pad"
        error={errors.phone}
        success={fieldValidation.phone === 'success'}
        helperText="Required for SMS verification"
        isRequired
        variant="outlined"
      />

      <EnhancedInput
        label="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          validateField('password', text);
        }}
        leftIcon="lock"
        rightIcon={showPassword ? 'visibility-off' : 'visibility'}
        onRightIconPress={() => setShowPassword(!showPassword)}
        secureTextEntry={!showPassword}
        error={errors.password}
        success={fieldValidation.password === 'success'}
        helperText="Minimum 8 characters"
        isRequired
        variant="outlined"
      />

      <EnhancedInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          validateField('confirmPassword', text);
        }}
        leftIcon="lock"
        rightIcon={showConfirmPassword ? 'visibility-off' : 'visibility'}
        onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
        secureTextEntry={!showConfirmPassword}
        error={errors.confirmPassword}
        success={fieldValidation.confirmPassword === 'success'}
        isRequired
        variant="outlined"
      />
    </View>
  );

  const renderBusinessInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell us about your business</Text>
      <Text style={styles.stepSubtitle}>This helps us provide better security services</Text>

      <EnhancedInput
        label="Business/Organization Name"
        value={businessName}
        onChangeText={(text) => {
          setBusinessName(text);
          validateField('businessName', text);
        }}
        leftIcon="business"
        error={errors.businessName}
        success={fieldValidation.businessName === 'success'}
        isRequired
        variant="outlined"
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>
          Type of Establishment <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.pickerWrapper, errors.establishmentType && styles.pickerError]}>
          <MaterialIcons name="category" size={20} color="#666" style={styles.pickerIcon} />
          <Picker
            selectedValue={establishmentType}
            onValueChange={(value) => setEstablishmentType(value)}
            style={styles.picker}
          >
            <Picker.Item label="Select type..." value="" />
            <Picker.Item label="🏢 Club/Bar" value="club" />
            <Picker.Item label="🎉 Event Venue" value="event" />
            <Picker.Item label="🏠 Private Property" value="private" />
            <Picker.Item label="🏢 Corporate Office" value="corporate" />
            <Picker.Item label="🏪 Retail Store" value="retail" />
            <Picker.Item label="🏥 Healthcare Facility" value="healthcare" />
            <Picker.Item label="🎓 Educational Institution" value="education" />
            <Picker.Item label="✨ Other" value="other" />
          </Picker>
        </View>
        {errors.establishmentType && (
          <Text style={styles.errorText}>{errors.establishmentType}</Text>
        )}
      </View>

      {establishmentType === 'other' && (
        <EnhancedInput
          label="Please specify"
          value={otherEstablishment}
          onChangeText={setOtherEstablishment}
          leftIcon="edit"
          error={errors.otherEstablishment}
          isRequired
          variant="outlined"
        />
      )}

      <View style={styles.locationContainer}>
        <Text style={styles.inputLabel}>
          Business Location <Text style={styles.required}>*</Text>
        </Text>
        <LocationAutocomplete onSelectAddress={(address) => setLocation(address)} />
        {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
      </View>

      <EnhancedInput
        label="Referral Code (Optional)"
        value={referralCode}
        onChangeText={setReferralCode}
        leftIcon="redeem"
        helperText="Have a referral code? Enter it here for benefits"
        variant="outlined"
      />
    </View>
  );

  const renderVerificationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <MaterialIcons name="security" size={80} color="#2E88FA" />
        <Text style={styles.successTitle}>Almost Ready!</Text>
        <Text style={styles.successSubtitle}>
          We'll send a verification code to{' '}
          <Text style={styles.highlightText}>{phone}</Text>
        </Text>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Feather name="user" size={16} color="#666" />
            <Text style={styles.summaryText}>{firstName} {lastName}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Feather name="mail" size={16} color="#666" />
            <Text style={styles.summaryText}>{email}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Feather name="briefcase" size={16} color="#666" />
            <Text style={styles.summaryText}>{businessName}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Feather name="map-pin" size={16} color="#666" />
            <Text style={styles.summaryText} numberOfLines={2}>{location}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ErrorBoundary>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => currentStep > 0 ? prevStep() : navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Step Indicator */}
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            showLabels={true}
            orientation="horizontal"
          />

          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color="#ef4444" />
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          )}

          {/* Content */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.stepsContainer,
                {
                  transform: [{ translateX: slideAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={[styles.step, { width }]}>
                {renderPersonalInfoStep()}
              </View>
              <View style={[styles.step, { width }]}>
                {renderBusinessInfoStep()}
              </View>
              <View style={[styles.step, { width }]}>
                {renderVerificationStep()}
              </View>
            </Animated.View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                (currentStep === 0 && (!firstName || !lastName || !email || !phone || !password || password !== confirmPassword)) ||
                (currentStep === 1 && (!businessName || !establishmentType || !location)) ?
                styles.disabledButton : null
              ]}
              onPress={nextStep}
              disabled={isLoading}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === steps.length - 1 ? 'Create Account' : 'Continue'}
              </Text>
              <MaterialIcons
                name={currentStep === steps.length - 1 ? 'check' : 'arrow-forward'}
                size={20}
                color="#fff"
                style={styles.buttonIcon}
              />
            </TouchableOpacity>

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  stepsContainer: {
    flexDirection: 'row',
    width: '300%',
  },
  step: {
    paddingHorizontal: 24,
    backgroundColor: '#fafafa',
  },
  stepContainer: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 40,
    lineHeight: 24,
    fontWeight: '400',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  pickerContainer: {
    marginBottom: 24,
  },
  pickerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  pickerError: {
    borderColor: '#ef4444',
    borderWidth: 1.5,
  },
  pickerIcon: {
    marginLeft: 16,
  },
  picker: {
    flex: 1,
    height: 56,
    fontSize: 16,
  },
  locationContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  required: {
    color: '#ef4444',
    fontSize: 14,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 8,
    fontWeight: '500',
    marginLeft: 4,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.8,
  },
  successSubtitle: {
    fontSize: 17,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
    fontWeight: '400',
  },
  highlightText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  summaryText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 16,
    flex: 1,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 24,
    backgroundColor: '#fff',
  },
  nextButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signInText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '400',
  },
  signInLink: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    padding: 16,
    marginHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorMessage: {
    color: '#dc2626',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
});
