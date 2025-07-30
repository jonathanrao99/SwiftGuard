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

// Types
import { JobTemplate } from '../../../components/post-job/JobTemplateSelector';

interface PostJobSpecializedFormData {
  title: string;
  location: string;
  startDate: string;
  startTime: string;
  endTime: string;
  hourlyPay: string;
  numGuards: number;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  specialInstructions: string;
  guestCount?: number;
  venueType: string;
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
      venueType: 'Other',
    }
  };
  const { control, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<PostJobSpecializedFormData>();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurringMode, setRecurringMode] = useState<string>('One-time');

  // Form watchers
  const watchedLocation = watch('location');
  const watchedNumGuards = watch('numGuards');
  const watchedHourlyPay = watch('hourlyPay');

  // Initialize form with template defaults
  useEffect(() => {
    setValue('title', template.defaultSettings.title);
    setValue('hourlyPay', template.defaultSettings.hourlyPay.toString());
    setValue('numGuards', template.defaultSettings.numGuards);
    setValue('venueType', template.defaultSettings.venueType);
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

  const submitJob = async (data: PostJobSpecializedFormData) => {
    try {
      setIsSubmitting(true);

      const jobData = {
        title: data.title,
        description: template.defaultSettings.description,
        location: data.location,
        hourly_pay: parseFloat(data.hourlyPay),
        num_guards: data.numGuards,
        gender_pref: 'No Preference',
        uniform: '',
        equipment: '',
        manager_name: data.managerName,
        manager_phone: data.managerPhone,
        manager_email: data.managerEmail,
        start_date: data.startDate,
        start_time: data.startTime,
        end_time: data.endTime,
        duration: 4, // Default 4 hours
        venue_type: data.venueType,
        recurring_mode: recurringMode,
        guest_count: data.guestCount,
        special_instructions: data.specialInstructions,
        status: 'pending',
        client_id: 'current-user-id', // Replace with actual user ID
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

      navigation.navigate('Jobs');
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

    await submitJob(data);
  };

  const getTemplateSpecificFields = () => {
    switch (template.id) {
      case 'concert-security':
        return (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Expected Guest Count</Text>
            <Controller
              control={control}
              name="guestCount"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value?.toString() || '1000'}
                  onChangeText={(text) => onChange(parseInt(text) || 1000)}
                  placeholder="1000"
                  keyboardType="numeric"
                />
              )}
            />
          </View>
        );
      
      case 'nightclub-security':
        return (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Venue Capacity</Text>
            <Controller
              control={control}
              name="guestCount"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value?.toString() || '500'}
                  onChangeText={(text) => onChange(parseInt(text) || 500)}
                  placeholder="500"
                  keyboardType="numeric"
                />
              )}
            />
          </View>
        );
      
      case 'corporate-security':
        return (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Event Type</Text>
            <Controller
              control={control}
              name="venueType"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  {['Conference', 'Meeting', 'Product Launch', 'Corporate Party', 'Other'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.pickerOption, value === type && styles.pickerOptionSelected]}
                      onPress={() => onChange(type)}
                    >
                      <Text style={[styles.pickerOptionText, value === type && styles.pickerOptionTextSelected]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
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
            <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
              <MaterialIcons name={template.icon} size={24} color="white" />
            </View>
            <View style={styles.templateDetails}>
              <Text style={styles.templateTitle}>{template.title}</Text>
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
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter venue address"
                />
              )}
            />
            {errors.location && <Text style={styles.errorText}>{errors.location.message}</Text>}
          </View>

          {/* Date and Time */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date *</Text>
            <Controller
              control={control}
              name="startDate"
              rules={{ required: 'Start date is required' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="MM/DD/YYYY"
                />
              )}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.fieldLabel}>Start Time *</Text>
              <Controller
                control={control}
                name="startTime"
                rules={{ required: 'Start time is required' }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder="19:00"
                  />
                )}
              />
            </View>

            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.fieldLabel}>End Time *</Text>
              <Controller
                control={control}
                name="endTime"
                rules={{ required: 'End time is required' }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder="23:00"
                  />
                )}
              />
            </View>
          </View>

          {/* Recurring Job */}
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

          {/* Pay and Guards */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.fieldLabel}>Hourly Pay *</Text>
              <Controller
                control={control}
                name="hourlyPay"
                rules={{ required: 'Hourly pay is required' }}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      placeholder="25.00"
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputSuffix}>/hr</Text>
                  </View>
                )}
              />
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
          {getTemplateSpecificFields()}

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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom button */}
      <View style={styles.footerBar}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
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
    fontSize: 14,
    color: COLORS.textSecondary,
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
});

export default PostJobSpecialized; 