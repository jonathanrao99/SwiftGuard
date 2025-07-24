import React, { Dispatch, SetStateAction, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Dimensions, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING } from '../../theme';
import { Controller, Control } from 'react-hook-form';
import { LocationAutocomplete } from '../LocationAutocomplete';
import { DateTimePair } from '../DateTimePair';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { CounterInput } from '../CounterInput';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';

const venueTypes = ['Nightclub', 'Bar', 'Private Event', 'Concert', 'Corporate', 'Other'];

const MemoCalendar = React.memo(RNCalendar);

interface EventDetailsSectionProps {
  control: Control<any>;
  errors: any;
  step1Submitted: boolean;
  startDate: string;
  setStartDate: (date: string) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  recurringMode: string;
  setRecurringMode: (mode: string) => void;
  selectedDates: string[];
  setSelectedDates: Dispatch<SetStateAction<string[]>>;
  selectedWeekdays: Record<string, boolean>;
  setSelectedWeekdays: Dispatch<SetStateAction<Record<string, boolean>>>;
  recurringPatternType: string;
  setRecurringPatternType: (type: string) => void;
  watchedNumWeeks: number;
  watchedNumMonths: number;
  venueType: string;
  setVenueType: (type: string) => void;
  watchedCustomVenueType: string;
}

export function getEventDetailsSummary({ control, startDate, startTime, endTime, recurringMode, selectedDates, recurringPatternType, selectedWeekdays, watchedNumWeeks, watchedNumMonths, venueType, watchedCustomVenueType }: EventDetailsSectionProps): { label: string, value: string }[] {
  return [
    { label: 'Title', value: control?._formValues?.title || '' },
    { label: 'Description', value: control?._formValues?.description || '' },
    { label: 'Location', value: control?._formValues?.location || '' },
    { label: 'Date', value: startDate || '' },
    { label: 'Time', value: `${startTime || ''} - ${endTime || ''}` },
    { label: 'Frequency', value: recurringMode || '' },
    { label: 'Event Type', value: venueType === 'Other' ? (watchedCustomVenueType || '') : (venueType || '') },
  ];
}

export const EventDetailsSection: React.FC<EventDetailsSectionProps> = React.memo((props) => {
  const {
    control,
    errors,
    step1Submitted,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    duration,
    setDuration,
    recurringMode,
    setRecurringMode,
    selectedDates,
    setSelectedDates,
    selectedWeekdays,
    setSelectedWeekdays,
    recurringPatternType,
    setRecurringPatternType,
    watchedNumWeeks,
    watchedNumMonths,
    venueType,
    setVenueType,
    watchedCustomVenueType,
  } = props;

  const weekdays = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
  ];

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const handleDayPress = (day: { dateString: string }) => {
    const dateString = day.dateString;
    setSelectedDates((prev: string[]) =>
      prev.includes(dateString)
        ? prev.filter((d: string) => d !== dateString)
        : [...prev, dateString].sort()
    );
  };

  const handleToggleWeekday = (key: string) => {
    setSelectedWeekdays((prev: Record<string, boolean>) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Remove a selected date chip
  const handleRemoveDateChip = (dateToRemove: string) => {
    setSelectedDates(prev => prev.filter(d => d !== dateToRemove));
  };
  // For recurring pattern: date range selection
  const [recStartDate, setRecStartDate] = useState<string>('');
  const [recEndDate, setRecEndDate] = useState<string>('');
  const [showRecStartPicker, setShowRecStartPicker] = useState(false);
  const [showRecEndPicker, setShowRecEndPicker] = useState(false);
  // Compute auto-marked dates between start/end for selected weekdays, parse date parts to avoid timezone
  const autoMarkedDates = useMemo(() => {
    if (!recStartDate || !recEndDate) return {};
    const [sy, sm, sd] = recStartDate.split('-').map(Number);
    const [ey, em, ed] = recEndDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    const dayMap = ['sun','mon','tue','wed','thu','fri','sat'];
    const marks: Record<string,{selected:boolean;selectedColor:string}> = {};
    const cur = new Date(start);
    while (cur <= end) {
      const key = dayMap[cur.getDay()];
      if (selectedWeekdays[key]) {
        const ds = cur.toISOString().split('T')[0];
        marks[ds] = { selected: true, selectedColor: COLORS.primary };
      }
      cur.setDate(cur.getDate() + 1);
    }
    return marks;
  }, [recStartDate, recEndDate, selectedWeekdays]);

  // Clear selections when switching between One-time and Recurring
  useEffect(() => {
    if (recurringMode === 'One-time') {
      // clear recurring selections
      setSelectedWeekdays({});
      setRecStartDate('');
      setRecEndDate('');
    } else {
      // clear one-time selections
      setSelectedDates([]);
    }
  }, [recurringMode]);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Event Details</Text>
      <View>
        {/* Job Title */}
        <Text style={styles.label}>Job Title</Text>
        <Controller
          control={control}
          name="title"
          rules={{ required: 'Job Title is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="E.g., Grand Opening Security"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />
        {step1Submitted && errors.title && (
          <Text style={styles.errorText}>{errors.title.message}</Text>
        )}

        {/* Job Description */}
        <Text style={styles.label}>Job Description</Text>
        <Controller
          control={control}
          name="description"
          rules={{ required: 'Description is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.descriptionInput, errors.description && styles.inputError]}
              placeholder="Describe the job responsibilities..."
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              multiline
              maxLength={500}
            />
          )}
        />
        {step1Submitted && errors.description && (
          <Text style={styles.errorText}>{errors.description.message}</Text>
        )}

        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <Controller
          control={control}
          name="location"
          rules={{ required: 'Location is required' }}
          render={({ field: { onChange } }) => (
            <LocationAutocomplete onSelectAddress={onChange} />
          )}
        />
        {step1Submitted && errors.location && (
          <Text style={styles.errorText}>{errors.location.message}</Text>
        )}

        {/* Time Selection (hide date) */}
        <DateTimePair
          date={startDate}
          hideDate
          onDateChange={setStartDate}
          startTime={startTime}
          onStartTimeChange={setStartTime}
          endTime={endTime}
          onEndTimeChange={setEndTime}
          duration={duration}
          onDurationChange={setDuration}
        />

        {/* Job Frequency */}
        <Text style={styles.label}>Job Frequency</Text>
        <View style={styles.pickerRow}>
          {['One-time', 'Recurring'].map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.pickerBtn, recurringMode === opt && styles.pickerBtnActive]}
              onPress={() => setRecurringMode(opt)}
            >
              <Text style={[styles.pickerBtnText, recurringMode === opt && styles.pickerBtnTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* One-time calendar for selecting one or multiple dates */}
        {recurringMode === 'One-time' && (
          <>
            <View style={styles.calendarContainer}>
              <MemoCalendar
                onDayPress={handleDayPress}
                markedDates={selectedDates.reduce((acc: any, date: string) => ({
                  ...acc,
                  [date]: { selected: true, selectedColor: COLORS.primary }
                }), {})}
              />
            </View>
            <View style={styles.selectedDatesRow}>
              {selectedDates.map(date => {
                const [year, month, day] = date.split('-').map(Number);
                const monthName = monthNames[month - 1];
                return (
                  <TouchableOpacity key={date} onPress={() => handleRemoveDateChip(date)} style={styles.dateChip}>
                    <Text style={styles.dateChipText}>{`${day} ${monthName}`}</Text>
                    <Feather name="x" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {recurringMode === 'Recurring' && (
          <>
            <Text style={styles.label}>Select Days</Text>
            <View style={styles.weekdaysRow}>
              {weekdays.map(day => (
                <TouchableOpacity
                  key={day.key}
                  style={[styles.weekdayBtn, selectedWeekdays[day.key] && styles.weekdayBtnActive]}
                  onPress={() => handleToggleWeekday(day.key)}
                >
                  <Text style={[styles.weekdayBtnText, selectedWeekdays[day.key] && styles.weekdayBtnTextActive]}> {day.label} </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Date range pickers side by side */}
            <View style={styles.dateRangeRow}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowRecStartPicker(true)}>
                  <Text style={[styles.inputText, !recStartDate && styles.placeholderText]}> {recStartDate || 'Select start date'} </Text>
                </TouchableOpacity>
                {showRecStartPicker && (
                  <DateTimePicker
                    value={recStartDate ? new Date(recStartDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(e, s) => { setShowRecStartPicker(false); if (s) setRecStartDate(s.toISOString().split('T')[0]); }}
                  />
                )}
              </View>
              <View style={[styles.halfField, { marginRight: 0 }]}>        
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowRecEndPicker(true)}>
                  <Text style={[styles.inputText, !recEndDate && styles.placeholderText]}> {recEndDate || 'Select end date'} </Text>
                </TouchableOpacity>
                {showRecEndPicker && (
                  <DateTimePicker
                    value={recEndDate ? new Date(recEndDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(e, s) => { setShowRecEndPicker(false); if (s) setRecEndDate(s.toISOString().split('T')[0]); }}
                  />
                )}
              </View>
            </View>
            {/* Read-only calendar for recurring */}
            <View style={styles.calendarContainer}>
              <MemoCalendar markedDates={autoMarkedDates} />
            </View>
          </>
        )}

        {/* Event Type & Estimated Guest Count */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Event Type</Text>
            <Controller
              control={control}
              name="venueType"
              rules={{ required: 'Event type is required' }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.dropdownWrapper}>
                  <Picker
                    selectedValue={value}
                    onValueChange={(itemValue: string) => {
                      onChange(itemValue);
                      setVenueType(itemValue);
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select event type" value="" color={COLORS.textSecondary} />
                    {venueTypes.map((type: string) => (
                      <Picker.Item key={type} label={type} value={type} color={COLORS.textDark} />
                    ))}
                  </Picker>
                </View>
              )}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 0 }}>
            <Text style={styles.label}>Estimated Guest Count</Text>
            <Controller
              control={control}
              name="guestCount"
              rules={{ required: 'Estimated guest count is required' }}
              defaultValue={500}
              render={({ field: { value, onChange } }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.sm }}>
                  <TouchableOpacity
                    style={{ padding: SPACING.sm, backgroundColor: COLORS.primaryLight, borderRadius: 8 }}
                    onPress={() => onChange(Math.max((value || 500) - 1, 0))}
                    accessibilityLabel="Decrease guest count"
                  >
                    <Feather name="minus" size={20} color={COLORS.primary} />
                  </TouchableOpacity>

                  <TextInput
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: COLORS.textDark,
                      marginHorizontal: SPACING.md,
                      minWidth: 64,
                      textAlign: 'center',
                      backgroundColor: COLORS.white,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 8,
                      paddingHorizontal: SPACING.md,
                      paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
                    }}
                    keyboardType="numeric"
                    value={String(value ?? '')}
                    placeholder="500"
                    onChangeText={text => {
                      const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                      const n = isNaN(num) ? 0 : num;
                      onChange(n);
                    }}
                    onBlur={() => { if ((value || 0) < 0) onChange(0); }}
                  />

                  <TouchableOpacity
                    style={{ padding: SPACING.sm, backgroundColor: COLORS.primaryLight, borderRadius: 8 }}
                    onPress={() => onChange((value || 500) + 1)}
                    accessibilityLabel="Increase guest count"
                  >
                    <Feather name="plus" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.guestCount && (
              <Text style={styles.errorText}>{errors.guestCount.message}</Text>
            )}
          </View>
        </View>
        {venueType === 'Other' && (
          <Controller
            control={control}
            name="customVenueType"
            rules={{ required: 'Please specify the custom venue type' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  { marginTop: SPACING.md, height: 48 },
                  errors.customVenueType && styles.inputError
                ]}
                placeholder="E.g., Community Hall"
                value={value}
                onChangeText={onChange}
                onBlur={() => !value && Alert.alert('Error', 'Custom venue type is required')}
              />
            )}
          />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: 'transparent',
    width: '100%',
    alignSelf: 'center',
    borderRadius: 12,
    padding: SPACING.xs,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
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
  inputError: {
    borderColor: COLORS.error,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  pickerBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  pickerBtnActive: {
    backgroundColor: COLORS.primary,
  },
  pickerBtnText: {
    color: COLORS.textDark,
    fontWeight: '500',
  },
  pickerBtnTextActive: {
    color: COLORS.white,
  },
  calendarContainer: {
    height: 350,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  weekdaysRow: {
    flexDirection: 'row',
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
    width: (Dimensions.get('window').width - (SPACING.md * 2) - (SPACING.sm * 6) - 2) / 7,
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
  dropdownWrapper: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    height: 70,
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING.xs,
  },
  picker: {
    width: '100%',
    height: '100%',
    color: COLORS.textDark,
  },
  selectedDatesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm, marginBottom: SPACING.sm },
  dateChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 16, marginRight: SPACING.sm, marginBottom: SPACING.sm },
  dateChipText: { color: COLORS.textDark, fontSize: 12, marginRight: SPACING.xs },
  inputText: {
    color: COLORS.textDark,
    fontSize: 15,
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  dateRangeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: SPACING.sm, marginBottom: SPACING.sm },
  halfField: { flex: 1, marginRight: SPACING.sm },
});
