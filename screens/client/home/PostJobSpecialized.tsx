import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { COLORS, SPACING } from '../../../theme';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';

// Types
import { JobTemplate } from '../../../components/post-job/JobTemplateSelector';
import { LocationAutocomplete } from '../../../components/LocationAutocomplete';
import { DateSelector } from '../../../components/DateSelector';
import { TimeSelector } from '../../../components/TimeSelector';
import { DaySelector } from '../../../components/DaySelector';

interface PostJobSpecializedFormData {
  title: string;
  location: string;
  venue: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  hourlyPay: string;
  numGuards: number;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  specialInstructions: string;
  guestCount?: number;
}

interface PostJobSpecializedProps {
  navigation: any;
  route: {
    params: {
      selectedTemplate: JobTemplate;
    };
  };
}

const PostJobSpecialized: React.FC<PostJobSpecializedProps> = ({ navigation, route }) => {
  const { selectedTemplate } = route.params;
  const { user } = useAuth();
  
  // Handle case where selectedTemplate is null (when navigating from JobDetailsScreen)
  const template = selectedTemplate || {
    id: 'custom',
    title: 'Edit Job',
    subtext: 'Modify job details',
    icon: 'edit',
    color: '#2563eb',
    defaultSettings: {
      title: '',
      description: '',
      location: '',
      venue: '',
      startDate: '',
      startTime: '',
      endTime: '',
      hourlyPay: '',
      numGuards: 1,
      managerName: '',
      managerPhone: '',
      managerEmail: '',
      specialInstructions: '',
      guestCount: 0,
    }
  };
  const { control, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<PostJobSpecializedFormData>();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurringMode, setRecurringMode] = useState<string>('One-time');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Form watchers
  const watchedLocation = watch('location');
  const watchedNumGuards = watch('numGuards');
  const watchedHourlyPay = watch('hourlyPay');
  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');

  // Initialize form with template defaults
  useEffect(() => {
    setValue('title', template.defaultSettings.title);
    setValue('venue', template.defaultSettings.venue || '');
    setValue('hourlyPay', template.defaultSettings.hourlyPay.toString());
    setValue('numGuards', template.defaultSettings.numGuards);
    setValue('specialInstructions', template.defaultSettings.specialInstructions || '');
    
    // Set default values based on template
    if (template.id === 'concert-security') {
      setValue('guestCount', 1000);
    } else if (template.id === 'nightclub-security') {
      setValue('guestCount', 500);
    } else {
      setValue('guestCount', 200);
    }
  }, [template, setValue]);

  // Navigation handlers
  const handleBack = () => {
    navigation.goBack();
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const formatSelectedDays = () => {
    if (selectedDays.length === 0) return '';
    
    const dayLabels = {
      monday: 'Mon',
      tuesday: 'Tue', 
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };
    
    return selectedDays.map(day => dayLabels[day as keyof typeof dayLabels]).join(', ');
  };

  const getSelectedDaysBetweenDates = () => {
    if (!watchedStartDate || !watchedEndDate || selectedDays.length === 0) return [];
    
    const startDate = new Date(watchedStartDate);
    const endDate = new Date(watchedEndDate);
    const selectedDaysSet = new Set(selectedDays);
    const dates: string[] = [];
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayName = dayNames[d.getDay()];
      if (selectedDaysSet.has(dayName)) {
        const formattedDate = d.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short'
        });
        dates.push(formattedDate);
      }
    }
    
    return dates;
  };

  const submitJob = async (data: PostJobSpecializedFormData) => {
    try {
      setIsSubmitting(true);

      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        return;
      }

      // Calculate start and end timestamps
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      let endDateTime = new Date(`${data.startDate}T${data.endTime}`);
      
      // If end time is earlier than start time, assume it's the next day
      if (endDateTime <= startDateTime) {
        endDateTime = new Date(`${data.startDate}T${data.endTime}`);
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const jobData = {
        client_id: user.id,
        title: data.title,
        description: template.defaultSettings.description,
        location: data.location,
        venue: data.venue,
        pay: parseFloat(data.hourlyPay),
        num_guards: data.numGuards,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'open',
        manager_name: data.managerName,
        manager_phone: data.managerPhone,
        manager_email: data.managerEmail,
        guest_count: data.guestCount,
        special_instructions: data.specialInstructions,
        recurring_mode: recurringMode,
        recurring_days: recurringMode === 'Recurring' ? selectedDays : [],
        start_date: data.startDate,
        end_date: data.endDate || data.startDate,
      };

      const { data: job, error } = await supabase
        .from('jobs')
        .insert([jobData])
        .select()
        .single();

      if (error) {
        console.error('Error posting job:', error);
        Alert.alert('Error', error.message || 'Failed to post job. Please try again.');
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Job Posted Successfully!',
        text2: 'Your security job has been posted and is now visible to guards.',
      });

      navigation.navigate('JobPostedSuccess', {
        jobDetails: {
          title: data.title,
          location: data.location,
          pay: data.hourlyPay,
          num_guards: data.numGuards,
        }
      });
    } catch (error) {
      console.error('Error posting job:', error);
      Alert.alert('Error', 'Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: PostJobSpecializedFormData) => {
    const validation = await trigger();
    if (!validation) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (recurringMode === 'Recurring' && selectedDays.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one day for recurring jobs.');
      return;
    }

    await submitJob(data);
  };

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.95)']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Feather name="arrow-left" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{template.title}</Text>
          <View style={{ width: 24 }} />
        </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Template Info */}
          <View style={styles.templateInfo}>
            <View style={[styles.templateIcon, { backgroundColor: '#EBF4FF' }]}>
              <MaterialIcons name={template.icon} size={24} color="#2563eb" />
            </View>
            <View style={styles.templateDetails}>
              <Text style={styles.templateSubtext}>{template.subtext}</Text>
            </View>
          </View>

          {/* Job Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Job Title *</Text>
            <Controller
              control={control}
              name="title"
              rules={{ required: 'Job title is required' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g., Concert Security, Nightclub Security"
                />
              )}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
          </View>

          {/* Location */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Location *</Text>
            <Controller
              control={control}
              name="location"
              rules={{ required: 'Location is required' }}
              render={({ field: { onChange, value } }) => (
                <LocationAutocomplete
                  onSelectAddress={onChange}
                  value={value}
                />
              )}
            />
            {errors.location && <Text style={styles.errorText}>{errors.location.message}</Text>}
          </View>

          {/* Venue */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Venue *</Text>
            <Controller
              control={control}
              name="venue"
              rules={{ required: 'Venue is required' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Midnight bar, Marriott Hotel 2nd floor"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.venue && <Text style={styles.errorText}>{errors.venue.message}</Text>}
          </View>

          {/* Job Type Toggle - Moved above date field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Job Type</Text>
            <View style={styles.recurringOptions}>
              {['One-time', 'Recurring'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.recurringOption, recurringMode === mode && styles.recurringOptionSelected]}
                  onPress={() => setRecurringMode(mode)}
                >
                  <Text style={[styles.recurringOptionText, recurringMode === mode && styles.recurringOptionTextSelected]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date and Time Fields */}
          {recurringMode === 'One-time' ? (
            // One-time job: single date field
            <View style={styles.fieldGroup}>
              <Controller
                control={control}
                name="startDate"
                rules={{ required: 'Start date is required' }}
                render={({ field: { onChange, value } }) => (
                  <DateSelector
                    value={value}
                    onChange={onChange}
                    label="Date *"
                    error={errors.startDate?.message}
                  />
                )}
              />
            </View>
          ) : (
            // Recurring job: start and end date fields
            <>
              <View style={styles.row}>
                <View style={[styles.fieldGroup, styles.halfWidth]}>
                  <Controller
                    control={control}
                    name="startDate"
                    rules={{ required: 'Start date is required' }}
                    render={({ field: { onChange, value } }) => (
                      <DateSelector
                        value={value}
                        onChange={onChange}
                        label="Start Date *"
                        error={errors.startDate?.message}
                      />
                    )}
                  />
                </View>

                <View style={[styles.fieldGroup, styles.halfWidth]}>
                  <Controller
                    control={control}
                    name="endDate"
                    rules={{ required: 'End date is required' }}
                    render={({ field: { onChange, value } }) => (
                      <DateSelector
                        value={value}
                        onChange={onChange}
                        label="End Date *"
                        error={errors.endDate?.message}
                      />
                    )}
                  />
                </View>
              </View>

              {/* Day Selector for Recurring Jobs */}
              <DaySelector
                selectedDays={selectedDays}
                onDayToggle={handleDayToggle}
                label="Select Days *"
              />

              {/* Display selected days between dates */}
              {watchedStartDate && watchedEndDate && selectedDays.length > 0 && (
                <View style={styles.selectedDaysContainer}>
                  <Text style={styles.selectedDaysLabel}>Selected Dates:</Text>
                  <View style={styles.selectedDaysList}>
                    {getSelectedDaysBetweenDates().map((date, index) => (
                      <View key={index} style={styles.selectedDayChip}>
                        <Text style={styles.selectedDayText}>{date}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Time Fields */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Controller
                control={control}
                name="startTime"
                rules={{ required: 'Start time is required' }}
                render={({ field: { onChange, value } }) => (
                  <TimeSelector
                    value={value}
                    onChange={onChange}
                    label="Start Time *"
                    error={errors.startTime?.message}
                  />
                )}
              />
            </View>

            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Controller
                control={control}
                name="endTime"
                rules={{ required: 'End time is required' }}
                render={({ field: { onChange, value } }) => (
                  <TimeSelector
                    value={value}
                    onChange={onChange}
                    label="End Time *"
                    error={errors.endTime?.message}
                  />
                )}
              />
            </View>
          </View>

          {/* Pay and Guards */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.fieldLabel}>Hourly Pay *</Text>
              <Controller
                control={control}
                name="hourlyPay"
                rules={{ 
                  required: 'Hourly pay is required',
                  pattern: {
                    value: /^\d+(\.\d{0,2})?$/,
                    message: 'Please enter a valid amount (e.g., 25.50)'
                  },
                  min: {
                    value: 1,
                    message: 'Hourly pay must be at least $1'
                  }
                }}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={(text) => {
                        // Only allow numbers and one decimal point
                        const cleaned = text.replace(/[^0-9.]/g, '');
                        // Ensure only one decimal point
                        const parts = cleaned.split('.');
                        if (parts.length > 2) return;
                        // Limit decimal places to 2
                        if (parts[1] && parts[1].length > 2) return;
                        onChange(cleaned);
                      }}
                      placeholder="25.00"
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputSuffix}>/hr</Text>
                  </View>
                )}
              />
              {errors.hourlyPay && <Text style={styles.errorText}>{errors.hourlyPay.message}</Text>}
            </View>

            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.fieldLabel}>Number of Guards *</Text>
              <Controller
                control={control}
                name="numGuards"
                rules={{ required: 'Number of guards is required' }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    value={value?.toString() || '1'}
                    onChangeText={(text) => onChange(parseInt(text) || 1)}
                    placeholder="1"
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
          </View>

          {/* Template-specific fields */}
          {/* Contact Information */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Point of Contact *</Text>
            <Controller
              control={control}
              name="managerName"
              rules={{ required: 'Contact name is required' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Full name"
                />
              )}
            />
            {errors.managerName && <Text style={styles.errorText}>{errors.managerName.message}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <Controller
              control={control}
              name="managerPhone"
              rules={{ required: 'Phone number is required' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                />
              )}
            />
            {errors.managerPhone && <Text style={styles.errorText}>{errors.managerPhone.message}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Controller
              control={control}
              name="managerEmail"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                />
              )}
            />
          </View>

          {/* Special Instructions */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Special Instructions</Text>
            <Controller
              control={control}
              name="specialInstructions"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Any additional requirements or instructions..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          {/* Submit Button */}
          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={[styles.submitButton, styles.fullWidth]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              <LinearGradient 
                colors={["#2563eb", "#6366f1"]} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }} 
                style={styles.gradientButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>
                    Post Job - ${parseFloat(watchedHourlyPay || '0') * (watchedNumGuards || 1) * 4}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 4 : 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: SPACING.md,
    paddingBottom: 60,
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    borderWidth: 0.2,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  templateDetails: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  templateSubtext: {
    fontSize: 16,
    color: COLORS.textDark,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  currencySymbol: {
    fontSize: 16,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.sm,
  },
  inputSuffix: {
    fontSize: 16,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.sm,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfWidth: {
    flex: 1,
  },
  recurringOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  recurringOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  recurringOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  recurringOptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  recurringOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectedDaysContainer: {
    marginBottom: SPACING.lg,
  },
  selectedDaysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  selectedDaysList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  selectedDayChip: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectedDayText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  pickerOption: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
  },
  pickerOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  pickerOptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  pickerOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  gradientButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  picker: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.textDark,
  },
  submitButtonContainer: {
    marginTop: SPACING.lg,
    marginBottom: -40,
  },
});

export default PostJobSpecialized; 