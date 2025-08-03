import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Dimensions,
  LayoutAnimation,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { COLORS, SPACING } from '../../../theme';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LocationAutocomplete } from '../../../components/LocationAutocomplete';
import { DateTimePair } from '../../../components/DateTimePair';
import { CounterInput } from '../../../components/CounterInput';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
// Removed Calendar import - using DatePicker instead
// Removed DropDownPicker import - using native Picker instead
import { Picker } from '@react-native-picker/picker';
import { EventDetailsSection } from '../../../components/post-job/EventDetailsSection';
import { PayAndRequirementsSection } from '../../../components/post-job/PayAndRequirementsSection';
import { ContactReviewSection } from '../../../components/post-job/ContactReviewSection';
import { StepIndicator } from '../../../components/post-job/StepIndicator';
import Toast from 'react-native-toast-message';
import { getEventDetailsSummary } from '../../../components/post-job/EventDetailsSection';
import { getPayAndRequirementsSummary } from '../../../components/post-job/PayAndRequirementsSection';
import { getContactReviewSummary } from '../../../components/post-job/ContactReviewSection';
import BottomSheetStepper, { BottomSheetStepperRef, StepComponentProps } from 'bottom-sheet-stepper';
// Dynamic import for Stripe to reduce bundle size
let useStripe: any;

// Load Stripe dynamically
const loadStripe = async () => {
  if (!useStripe) {
    const stripeModule = await import('@stripe/stripe-react-native');
    useStripe = stripeModule.useStripe;
  }
};
import { supabase } from '../../../supabaseClient';
import { JobService, JobData } from '../../../services/JobService';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorBoundary from '../../../components/ErrorBoundary';

// Types
interface PostJobFormData {
  title: string;
  description: string;
  location: string;
  venue: string;
  hourlyPay: string;
  numGuards: number;
  genderPref: string;
  uniform: string;
  equipment: string;
  managerName: string;
  managerPhone: string;
  customVenueType?: string;
  otherRequirement?: string;
  numWeeks?: number; // New field for recurring weekly
  numMonths?: number; // New field for recurring monthly
  guestCount?: number; // Estimated guest count
}

interface PostJobProps {
  navigation: any;
}

const requirementsList = [
  { key: 'licensed', label: 'Licensed Security Guard' },
  { key: 'firstAid', label: 'First Aid Certified' },
  { key: 'firearms', label: 'Firearms License Required', tooltip: 'Requires guards to possess a valid firearms license and be authorized to carry on duty.' },
  { key: 'training', label: 'Security Training Completed' },
  { key: 'other', label: 'Other (Specify below)' },
];

const venueTypes = [
  'Nightclub', 'Bar', 'Private Event', 'Concert', 'Corporate', 'Other'
];

const genderPrefs = [
  'No Preference', 'Male', 'Female', 'Other'
];

const venueTypeIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  'Nightclub': 'nightlife',
  'Bar': 'local-bar',
  'Private Event': 'event',
  'Concert': 'music-note',
  'Corporate': 'business',
  'Other': 'more-horiz',
};

const weekdays = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const PostJob: React.FC<PostJobProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    // Load Stripe dynamically
    loadStripe().then(() => {
      setStripeLoaded(true);
      const stripeHook = useStripe();
      setStripe(stripeHook);
    });
  }, []);

  const { control, handleSubmit, formState: { errors, isDirty }, watch, setValue, trigger } = useForm<PostJobFormData>({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      venue: '',
      hourlyPay: '',
      numGuards: 1,
      genderPref: 'No Preference',
      uniform: '',
      equipment: '',
      managerName: '',
      managerPhone: '',
      customVenueType: '',
      otherRequirement: '',
      numWeeks: 1, // Default for new counter
      numMonths: 1, // Default for new counter
      guestCount: 500, // Default for guest count
    }
  });

  const watchedHourlyPay = watch('hourlyPay');
  const watchedNumGuards = watch('numGuards');
  const watchedDescription = watch('description');
  const watchedCustomVenueType = watch('customVenueType') ?? '';
  const watchedOtherRequirement = watch('otherRequirement') ?? '';
  const watchedNumWeeks = watch('numWeeks') ?? 1;
  const watchedNumMonths = watch('numMonths') ?? 1;
  const watchedGuestCount = watch('guestCount') ?? 500;

  const [showTooltip, setShowTooltip] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [duration, setDuration] = useState<string>('0.00');
  const [venueType, setVenueType] = useState<string>('');
  const [recurringMode, setRecurringMode] = useState<string>('One-time'); // 'One-time', 'Multiple Days', 'Recurring'
  const [selectedDates, setSelectedDates] = useState<string[]>([]); // For 'Multiple Days' (YYYY-MM-DD)
  // Note: calendar-kit's Calendar doesn't have native "period" marking or minDate/disableAllTouchEventsForDisabledDays like react-native-calendars.
  // We'll handle individual date selection and basic validation.
  const [selectedWeekdays, setSelectedWeekdays] = useState<Record<string, boolean>>({}); // For 'Recurring' - Weekly (e.g., {mon: true, wed: false})
  const [selectedMonthlyDates, setSelectedMonthlyDates] = useState<number[]>([]); // For 'Recurring' - Monthly (e.g., [1, 15, 30]) - will be removed in monthly view
  const [recurringPatternType, setRecurringPatternType] = useState<string>('weekly'); // 'weekly' or 'monthly' for Recurring
  const [requirements, setRequirements] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [step1Submitted, setStep1Submitted] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Helper to pad month/day
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  // Today and current month tracking for calendar navigation
  const today = new Date();
  const todayMonthString = `${today.getFullYear()}-${pad(today.getMonth()+1)}-01`;
  const [currentMonth, setCurrentMonth] = useState<string>(todayMonthString);

  // Mark selected dates for react-native-calendars
  const markSelectedDates: Record<string, { selected: boolean; selectedColor: string }> =
    selectedDates.reduce((acc, dateString) => ({
      ...acc,
      [dateString]: { selected: true, selectedColor: COLORS.primary }
    }), {} as Record<string, { selected: boolean; selectedColor: string }>);

  useEffect(() => {
    if (startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60; // Handle overnight shifts
      setDuration((diff / 60).toFixed(2));
    } else {
      setDuration('0.00');
    }
  }, [startTime, endTime]);

  const hours = Number(duration) || 0;
  const guards = Number(watchedNumGuards) || 0;
  const rate = Number(watchedHourlyPay) || 0;

  // Calculate extra hourly fee based on requirements
  const extraHourlyFee = (
    (requirements.licensed ? 5 : 0) +
    (requirements.firstAid ? 5 : 0) +
    (requirements.firearms ? 10 : 0) +
    (requirements.other ? 10 : 0)
  );
  const totalHourlyRate = rate + extraHourlyFee;
  const estimatedCost = `$${(hours * guards * totalHourlyRate).toFixed(2)}`;

  const handleRequirementToggle = (key: string) => {
    setRequirements((prev) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      return { ...prev, [key]: !prev[key] };
    });
  };

  const handleInvalidPress = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  const handleToggleWeekday = (key: string) => {
    setSelectedWeekdays((prev) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      return { ...prev, [key]: !prev[key] };
    });
  };

  const handleToggleMonthlyDate = (day: number) => {
    // This function will remain for selection, but the visual grid will be removed
    setSelectedMonthlyDates((prev) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      return prev.includes(day)
        ? prev.filter((d) => d !== day).sort((a, b) => a - b)
        : [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleRemoveDateChip = (dateToRemove: string) => {
    setSelectedDates(prev => prev.filter(d => d !== dateToRemove));
  };

  // Toggle date selection in multi-date calendar
  const handleDayPress = (day: { dateString: string }) => {
    const dateString = day.dateString;
    setSelectedDates(prev =>
      prev.includes(dateString)
        ? prev.filter(d => d !== dateString)
        : [...prev, dateString].sort()
    );
  };

  const handleCalendarKitDayPress = (date: any) => {
    // legacy stub; no longer used
  };

  const onNextStep = async () => {
    if (currentStep < 3) {
      if (currentStep === 1) {
        setStep1Submitted(true);
        const result = await trigger();
        if (
          result &&
          startTime &&
          endTime &&
          (
            (recurringMode === 'One-time' && selectedDates.length > 0) ||
            (recurringMode === 'Recurring' && recurringPatternType === 'weekly' && Object.values(selectedWeekdays).some(val => val) && (watchedNumWeeks ?? 1) >= 1) ||
            (recurringMode === 'Recurring' && recurringPatternType === 'monthly' && (watchedNumMonths ?? 1) >= 1)
          ) &&
          (venueType !== 'Other' || (venueType === 'Other' && watchedCustomVenueType)) &&
          (!requirements.other || (requirements.other && watchedOtherRequirement))
        ) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setCurrentStep(2);
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else {
          handleInvalidPress();
          Alert.alert('Missing Information', 'Please ensure all required fields are filled and valid before proceeding.');
        }
      } else {
        // Step 2: validate only form fields for this step
        const result = await trigger();
        if (result) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setCurrentStep(3);
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else {
          handleInvalidPress();
          Alert.alert('Missing Information', 'Please ensure all required fields are filled and valid before proceeding.');
        }
      }
    } else {
      // Last step, open confirmation modal
      openConfirmation();
    }
  };

  const onPrevStep = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);

  const onSubmit = async (data: PostJobFormData) => {
    setIsSubmitting(true);
    try {
      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      // Build the job payload
      const jobPayload: JobData = {
        title: data.title || (venueType !== 'Other' ? venueType : data.customVenueType || 'Custom Security Job'),
        description: data.description || '',
        location: data.location || '',
        pay: parseFloat(data.hourlyPay),
        start_time: startTime,
        end_time: endTime,
        num_guards: data.numGuards,
        client_id: user?.id, // Make sure user is available from context/auth
      };

      // Create job using JobService
      const job = await JobService.createJob(jobPayload);
      if (!job) throw new Error('Failed to create job.');

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Job Posted Successfully!',
        position: 'bottom',
        visibilityTime: 2500,
      });
      navigation.navigate('Client');
    } catch (error: any) {
      console.error('Error posting job:', error);
      Alert.alert('Error', error.message || 'Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmationModal(false);
    }
  };

  const openConfirmation = async () => {
    const result = await trigger();

    if (result && startTime && endTime && (
        recurringMode === 'One-time' ||
        (recurringMode === 'Recurring' && recurringPatternType === 'weekly' && Object.values(selectedWeekdays).some(val => val) && (watchedNumWeeks ?? 1) >= 1) ||
        (recurringMode === 'Recurring' && recurringPatternType === 'monthly' && (watchedNumMonths ?? 1) >= 1) // Only check numMonths
    ) && (venueType !== 'Other' || (venueType === 'Other' && watchedCustomVenueType)) &&
        (!requirements.other || (requirements.other && watchedOtherRequirement))
    ) {
      setShowConfirmationModal(true);
    } else {
      handleInvalidPress();
      Alert.alert('Missing Information', 'Please ensure all required fields are filled and valid before posting.');
    }
  };

  const confirmAndSubmit = () => {
    handleSubmit(onSubmit)();
  };

  // Calendar-kit theme configuration for selected dates
  const calendarTheme = {
    backgroundColor: COLORS.white,
    calendarBackground: COLORS.white,
    textSectionTitleColor: COLORS.textSecondary,
    selectedDayBackgroundColor: COLORS.primary,
    selectedDayTextColor: COLORS.white,
    todayTextColor: COLORS.primary,
    dayTextColor: COLORS.textDark,
    textDisabledColor: COLORS.border,
    dotColor: COLORS.primary,
    selectedDotColor: COLORS.white,
    arrowColor: COLORS.primary,
    monthTextColor: COLORS.textDark,
    indicatorColor: 'blue',
    textDayFontFamily: 'System',
    textMonthFontFamily: 'System',
    textDayHeaderFontFamily: 'System',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 13,
    // Customization for selected days (requires renderDay for more complex visuals)
    'stylesheet.day.basic': {
      selectedDot: {
        backgroundColor: COLORS.primary,
      },
      selected: {
        borderRadius: 16, // Assuming circular selection
      },
    },
  };

  // Marked dates for Calendar-kit: it expects an array of DateObjects
  const calendarKitMarkedDates: any[] = selectedDates
    .filter(ds => !!ds)
    .map(dateString => ({
    dateString: dateString,
    day: parseInt(dateString.split('-')[2]),
    month: parseInt(dateString.split('-')[1]),
    year: parseInt(dateString.split('-')[0]),
    timestamp: new Date(dateString).getTime(),
    date: new Date(dateString), // Add the actual Date object
  }));

  // Event Type state (using native Picker)
  const [eventTypeValue, setEventTypeValue] = useState<string>(venueType || '');
  useEffect(() => {
    setEventTypeValue(venueType || '');
  }, [venueType]);
  useEffect(() => {
    if (eventTypeValue !== venueType) setVenueType(eventTypeValue);
  }, [eventTypeValue]);

  // Track bottom sheet open state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

  // Sheet stepper ref
  const sheetRef = useRef<BottomSheetStepperRef>(null);

  // Define Step 1: Price Breakdown
  const StepPriceBreakdown = ({ onNextPress }: StepComponentProps) => (
    <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: SPACING.md }}>Review Price Breakdown</Text>
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Base Hourly Rate</Text>
        <Text style={styles.breakdownValue}>${rate}</Text>
      </View>
      {extraHourlyFee > 0 && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Requirements Fee</Text>
          <Text style={styles.breakdownValue}>+${extraHourlyFee}/hr</Text>
        </View>
      )}
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Platform Fee</Text>
        <Text style={styles.breakdownValue}>+${(rate * 0.1).toFixed(2)}/hr</Text>
      </View>
      <View style={[styles.breakdownRow, { marginTop: SPACING.md }]}>  
        <Text style={styles.breakdownLabel}>Total Hourly Rate</Text>
        <Text style={styles.breakdownValue}>${(totalHourlyRate + rate * 0.1).toFixed(2)}/hr</Text>
      </View>
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Estimated Cost</Text>
        <Text style={styles.breakdownValue}>{estimatedCost}</Text>
      </View>
      <TouchableOpacity style={[styles.nextButton, { marginTop: SPACING.lg, marginBottom: SPACING.xs }]} onPress={onNextPress}>
        <LinearGradient colors={["#2563eb", "#6366f1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
          <Text style={styles.buttonText}>Proceed to Pay</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  // Payment related state
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Initialize payment sheet
  const initializePaymentSheet = async () => {
    if (!stripe) return;
    
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            userId: user.id,
            amount: parseFloat(estimatedCost.replace('$', '')),
            jobDetails: {
              title: watch('title'),
              location: watch('location')
            }
          }
        }
      );

      if (fnError) throw fnError;
      
      setPaymentIntentId(fnData.paymentIntentId);

      const { error } = await stripe.initPaymentSheet({
        merchantDisplayName: 'SwiftGuard',
        paymentIntentClientSecret: fnData.clientSecret,
        allowsDelayedPaymentMethods: false,
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: true
        },
        applePay: {
          merchantCountryCode: 'US'
        }
      });

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!stripe) return;
    
    try {
      const { error } = await stripe.presentPaymentSheet();
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        await handleSubmit(submitJobWithPayment)();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Payment failed');
    }
  };

  // Submit job with payment
  const submitJobWithPayment = async (data: PostJobFormData) => {
    const finalValidation = await trigger();
    if (!finalValidation) {
      handleInvalidPress();
      Alert.alert('Validation Error', 'Please ensure all required fields are filled correctly.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      const payload = {
        client_id: user.id,
        payment_intent_id: paymentIntentId,
        ...data,
        startTime,
        endTime,
        duration,
        numGuards: watchedNumGuards,
        venueType: venueType === 'Other' ? data.customVenueType : venueType,
        recurringMode,
        eventDates: recurringMode === 'One-time' ? selectedDates :
                  recurringMode === 'Recurring' && recurringPatternType === 'weekly' ? selectedWeekdays :
                  recurringMode === 'Recurring' && recurringPatternType === 'monthly' ? {} : [],
        recurringPatternType: recurringMode === 'Recurring' ? recurringPatternType : undefined,
        numWeeks: recurringMode === 'Recurring' && recurringPatternType === 'weekly' ? watchedNumWeeks : undefined,
        numMonths: recurringMode === 'Recurring' && recurringPatternType === 'monthly' ? watchedNumMonths : undefined,
        requirements: Object.keys(requirements).filter(key => requirements[key]),
        otherRequirement: requirements.other ? data.otherRequirement : undefined,
        totalAmount: parseFloat(estimatedCost.replace('$', '')),
        status: 'paid'
      };

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert([payload])
        .select()
        .single();

      if (jobError) throw jobError;

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Job Posted Successfully!',
        position: 'bottom',
        visibilityTime: 2500,
      });
      
      navigation.navigate('Client');
    } catch (error: any) {
      console.error('Error posting job:', error);
      Alert.alert('Error', error.message || 'Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmationModal(false);
    }
  };

  // Define Step 2: Payment
  const StepPayment = ({ onNextPress }: StepComponentProps) => (
    <View style={{ padding: SPACING.lg }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: SPACING.md }}>Payment</Text>
      <Text style={{ marginBottom: SPACING.lg }}>Total Amount: {estimatedCost}</Text>
      
      <TouchableOpacity
        style={[styles.paymentButton, loading && styles.buttonDisabled]}
        onPress={handlePayment}
        disabled={loading}
      >
        <Text style={styles.paymentButtonText}>
          {loading ? 'Loading...' : 'Proceed to Pay'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <LoadingSpinner text="Processing..." />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.95)']}
        style={styles.gradientContainer}
      >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Status bar shadow when sheet is open */}
        {isSheetOpen && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: statusBarHeight + 4,
            backgroundColor: '#000',
            opacity: 0.1,
            zIndex: 20,
          }} />
        )}
        <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (currentStep === 1 && isDirty) {
              setShowUnsavedModal(true);
            } else if (currentStep > 1) {
              onPrevStep();
            } else {
              navigation.navigate('Client');
            }
          }}>
            <Feather name="arrow-left" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post New Job</Text>
          <View style={{ width: 24 }} />
        </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Sticky step indicator */}
        <StepIndicator currentStep={currentStep} />

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {showTooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>Please fill out all required fields.</Text>
            </View>
          )}

          {/* Step Content */}
          {currentStep === 1 && <EventDetailsSection {...{ control, errors, step1Submitted, startDate, setStartDate, startTime, setStartTime, endTime, setEndTime, duration, setDuration, recurringMode, setRecurringMode, selectedDates, setSelectedDates, selectedWeekdays, setSelectedWeekdays, recurringPatternType, setRecurringPatternType, watchedNumWeeks, watchedNumMonths, venueType, setVenueType, watchedCustomVenueType }} />}
          {currentStep === 2 && <PayAndRequirementsSection {...{ control, errors, requirements, handleRequirementToggle, watchedOtherRequirement }} />}
          {currentStep === 3 && <ContactReviewSection {...{ control, errors, estimatedCost }} />}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Unified bottom button */}
      {!isSheetOpen && (currentStep === 1 || currentStep === 2 || currentStep === 3) && (
        <View style={styles.footerBar}>
          <TouchableOpacity
            style={[styles.nextButton, styles.fullWidth]}
            onPress={() => {
              if (currentStep === 3) {
                setIsSheetOpen(true);
                sheetRef.current?.present();
              } else {
                onNextStep();
              }
            }}
            disabled={isSubmitting}
          >
            <LinearGradient colors={["#2563eb", "#6366f1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
              <Text style={styles.buttonText}>{currentStep === 3 ? 'Review' : 'Next'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Sheet Stepper */}
      <BottomSheetStepper
        ref={sheetRef}
        steps={[StepPriceBreakdown, StepPayment]}
        horizontalInset={16}
        bottomInset={24}
        style={{
          paddingTop: SPACING.xs,
          paddingBottom: SPACING.sm,
          paddingHorizontal: SPACING.md,
          borderRadius: 12,
        }}
      />

        {/* Confirmation Modal */}
        <Modal
          visible={showConfirmationModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowConfirmationModal(false)}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Review Job Details</Text>
            <View style={styles.modalDivider} />

            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Job Title:</Text>
              <Text style={styles.reviewValue}>{watch('title')}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Description:</Text>
              <Text style={styles.reviewValue}>
                {watch('description') || 'No description provided'}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Location:</Text>
              <Text style={styles.reviewValue}>{watch('location')}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Frequency:</Text>
              <Text style={styles.reviewValue}>{recurringMode}</Text>
            </View>
            {recurringMode === 'One-time' && selectedDates.length > 0 && (
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Date:</Text>
                <Text style={styles.reviewValue}>
                  {selectedDates.map(d => new Date(d).toLocaleDateString()).join(', ')}
                </Text>
              </View>
            )}
            {recurringMode === 'Multiple Days' && selectedDates.length > 0 && (
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Selected Dates:</Text>
                <Text style={styles.reviewValue}>
                  {selectedDates.map(d => new Date(d).toLocaleDateString()).join(', ')}
                </Text>
              </View>
            )}
            {recurringMode === 'Recurring' && recurringPatternType === 'weekly' && Object.values(selectedWeekdays).some(val => val) && (
              <>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Weekly Pattern:</Text>
                  <Text style={styles.reviewValue}>
                    {weekdays.filter(day => selectedWeekdays[day.key]).map(day => day.label).join(', ')}
                  </Text>
                </View>
                <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>No. of Weeks:</Text>
                    <Text style={styles.reviewValue}>{watchedNumWeeks ?? 1}</Text>
                </View>
              </>
            )}
            {recurringMode === 'Recurring' && recurringPatternType === 'monthly' && (watchedNumMonths ?? 1) >= 1 && (
              <>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Monthly Recurrence:</Text>
                  <Text style={styles.reviewValue}>Every month for {watchedNumMonths ?? 1} months.</Text>
                </View>
                {/* Removed specific monthly dates from review as they are no longer selected via grid */}
              </>
            )}
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Time:</Text>
              <Text style={styles.reviewValue}>{`${startTime} - ${endTime}`}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Duration:</Text>
              <Text style={styles.reviewValue}>{`${duration} hours`}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Event Type:</Text>
              <Text style={styles.reviewValue}>{venueType === 'Other' ? watchedCustomVenueType : venueType}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Number of Guards:</Text>
              <Text style={styles.reviewValue}>{watchedNumGuards}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Hourly Pay:</Text>
              <Text style={styles.reviewValue}>${watchedHourlyPay}</Text>
            </View>
            {extraHourlyFee > 0 && (
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Extra Fee (Requirements):</Text>
                <Text style={styles.reviewValue}>+${extraHourlyFee} /hr</Text>
              </View>
            )}
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Gender Preference:</Text>
              <Text style={styles.reviewValue}>
                {watch('genderPref') || 'No Preference'}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Requirements:</Text>
              <Text style={styles.reviewValue}>
                {Object.keys(requirements).filter(key => requirements[key])
                  .map(key => key === 'other' ? watchedOtherRequirement : requirementsList.find(r => r.key === key)?.label)
                  .filter(Boolean)
                  .join(', ') || 'None specified'}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Uniform/Dress Code:</Text>
              <Text style={styles.reviewValue}>{watch('uniform')}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Equipment:</Text>
              <Text style={styles.reviewValue}>{watch('equipment') || 'None specified'}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Manager Name:</Text>
              <Text style={styles.reviewValue}>{watch('managerName')}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Manager Phone:</Text>
              <Text style={styles.reviewValue}>{watch('managerPhone')}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Estimated Guest Count:</Text>
              <Text style={styles.reviewValue}>{watchedGuestCount}</Text>
            </View>
            <View style={[styles.estimateBox, { marginTop: SPACING.md }]}>
              <Text style={styles.estimateLabel}>Total Estimated Cost:</Text>
              <Text style={styles.estimateValue}>{estimatedCost}</Text>
            </View>

            <TouchableOpacity
              style={styles.postBtn}
              onPress={confirmAndSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={["#2563eb", "#6366f1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.postBtnText}>Confirm & Post Job</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirmationModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Unsaved Changes Modal for Step 1 */}
      <Modal
        visible={showUnsavedModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowUnsavedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: 32 }]}> 
            <TouchableOpacity style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }} onPress={() => setShowUnsavedModal(false)}>
              <Feather name="x" size={24} color="#222" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>All changes will be lost</Text>
            <Text style={{ textAlign: 'center', color: COLORS.textSecondary, marginBottom: 24 }}>Are you sure you want to go back? Your progress on this job post will not be saved.</Text>
            <TouchableOpacity style={[styles.nextButton, { marginTop: 0 }]} onPress={() => { setShowUnsavedModal(false); navigation.goBack(); }}>
              <LinearGradient colors={['#2563eb','#6366f1']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.gradientButton}>
                <Text style={styles.buttonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </LinearGradient>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl * 3,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textDark },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    fontSize: 15,
    marginBottom: SPACING.xs,
  },
  inputError: { borderColor: COLORS.error },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  dropdownWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.white,
    position: 'relative',
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  picker: {
    width: '100%',
    height: '100%',
    paddingLeft: 32,
  },
  pickerIcon: {
    position: 'absolute',
    left: SPACING.sm,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.xs },
  pickerBtn: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginRight: SPACING.sm, marginBottom: SPACING.sm },
  pickerBtnActive: { backgroundColor: COLORS.primary },
  pickerBtnText: { color: COLORS.textDark, fontWeight: '500' },
  pickerBtnTextActive: { color: COLORS.white },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.white, marginRight: SPACING.sm, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxLabel: { fontSize: 14, color: COLORS.textDark },
  estimateBox: { backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: SPACING.lg, alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.lg },
  estimateLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  estimateValue: { color: COLORS.primary, fontSize: 28, fontWeight: '700', marginTop: SPACING.xs },
  estimateSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: SPACING.xs },
  postBtn: { borderRadius: 10, alignItems: 'center', marginTop: SPACING.md, shadowColor: COLORS.primary, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, width: '100%' },
  postBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: SPACING.xs, marginBottom: SPACING.xs },
  descriptionInput: { minHeight: 80, textAlignVertical: 'top', paddingTop: SPACING.sm },
  tooltip: { backgroundColor: COLORS.error, padding: SPACING.sm, borderRadius: 8, alignItems: 'center', marginBottom: SPACING.md },
  tooltipText: { color: COLORS.white, fontWeight: 'bold' },
  sectionCard: { backgroundColor: 'transparent', borderWidth: 0, marginBottom: 0, padding: 0, shadowOpacity: 0, elevation: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: SPACING.md },
  charCountText: { alignSelf: 'flex-end', fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xs, marginRight: SPACING.xs },
  helperText: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xs, marginBottom: SPACING.md },
  selectedDatesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm, marginBottom: SPACING.sm },
  dateChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 16, marginRight: SPACING.sm, marginBottom: SPACING.sm },
  dateChipText: { color: COLORS.white, fontSize: 12, marginRight: SPACING.xs },
  calendarContainer: {
    height: 350, // Fixed height for CalendarList to contain its own scrolling
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden', // Ensures content stays within bounds
  },
  calendar: {
    flex: 1, // Calendar takes up all available space in its fixed-height container
  },
  payInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, backgroundColor: COLORS.white, marginBottom: SPACING.xs },
  currencySymbol: { fontSize: 15, color: COLORS.textDark, paddingLeft: SPACING.md },
  payInput: { flex: 1, paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm, paddingRight: SPACING.md, paddingLeft: SPACING.xs, fontSize: 15, },
  gradientButton: { paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: 10, width: '100%' },
  nextButton: { marginTop: SPACING.sm, width: '100%', marginBottom: SPACING.xl },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 22, letterSpacing: 0.5 },
  backButton: { alignSelf: 'center', marginTop: SPACING.md, marginBottom: SPACING.lg },
  backButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },

  // Step Indicator Styles
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: COLORS.white, // Active step number is white
  },
  stepText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  stepTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  stepLine: {
    position: 'absolute',
    top: 15,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: COLORS.border,
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    flex: 1,
  },
  reviewValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  cancelButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  // Styles for Recurring Patterns
  weekdaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  weekdayBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
    width: (Dimensions.get('window').width - (SPACING.md * 2) - (SPACING.sm * 6) - 2) / 7, // Adjusted for spacing and border
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
  },
  weekdayBtnActive: {
    backgroundColor: COLORS.primary,
  },
  weekdayBtnText: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  weekdayBtnTextActive: {
    color: COLORS.white,
  },
  monthlyDatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  monthlyDateBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    width: (Dimensions.get('window').width - (SPACING.md * 2) - (SPACING.sm * 5) - 2) / 7,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
  },
  monthlyDateBtnActive: {
    backgroundColor: COLORS.primary,
  },
  monthlyDateBtnText: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  monthlyDateBtnTextActive: {
    color: COLORS.white,
  },
  dropdownContainer: {
    zIndex: 1000,
    elevation: 1000,
    width: '100%',
    marginTop: SPACING.md
  },
  dropdown: {
    marginTop: SPACING.md,
    zIndex: 1000,
    elevation: 1000
  },
  dropdownTextStyle: {
    fontSize: 16
  },
  navButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    // No border/background for floating look
    zIndex: 10,
  },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    zIndex: 10,
  },
  fullWidth: {
    width: '100%',
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  breakdownLabel: { fontSize: 14, color: COLORS.textDark },
  breakdownValue: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  paymentButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  paymentButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PostJob;