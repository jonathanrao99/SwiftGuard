import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING } from '../theme';
import { Feather } from '@expo/vector-icons';

type DateTimePairProps = {
  date: string;
  onDateChange: (dateStr: string) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
  duration: string;
  onDurationChange: (dur: string) => void;
};

function computeDuration(start: string, end: string): string {
  if (!start || !end) return '0.00';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return (diff / 60).toFixed(2);
}

// Add display formatting helpers
function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const month = monthNames[d.getMonth()];
  const weekdayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const weekday = weekdayNames[d.getDay()];
  return `${day} ${month} - ${weekday}`;
}

function formatDisplayTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${period}`;
}

export function DateTimePair({
  date,
  onDateChange,
  hideDate = false,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  duration,
  onDurationChange,
}: DateTimePairProps & { hideDate?: boolean }) {
  const [showDate, setShowDate] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    const d = computeDuration(startTime, endTime);
    onDurationChange(d);
  }, [startTime, endTime]);

  const handleDate = (e: any, selected?: Date) => {
    setShowDate(false);
    if (selected) {
      const iso = selected.toISOString().split('T')[0];
      onDateChange(iso);
    }
  };

  const handleStart = (e: any, selected?: Date) => {
    setShowStart(false);
    if (selected) {
      const h = selected.getHours().toString().padStart(2, '0');
      const m = selected.getMinutes().toString().padStart(2, '0');
      onStartTimeChange(`${h}:${m}`);
    }
  };

  const handleEnd = (e: any, selected?: Date) => {
    setShowEnd(false);
    if (selected) {
      const h = selected.getHours().toString().padStart(2, '0');
      const m = selected.getMinutes().toString().padStart(2, '0');
      onEndTimeChange(`${h}:${m}`);
    }
  };

  return (
    <View style={styles.wrapper}>
      {!hideDate && (
        <>
          <Text style={styles.fieldLabel}>Date</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateTimeInput, showDate && styles.inputFocused]}
            onPress={() => setShowDate(true)}
            accessibilityRole="button"
            accessibilityLabel="Select date"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="calendar" size={16} color={COLORS.textSecondary} />
            <Text style={[styles.inputText, !date && styles.placeholderText]}>
              {date ? formatDisplayDate(date) : 'Select date'}
            </Text>
          </TouchableOpacity>
          {showDate && <DateTimePicker value={date ? new Date(date) : new Date()} mode="date" display="default" onChange={handleDate} />}
        </>
      )}

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.fieldLabel}>Start Time</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateTimeInput, showStart && styles.inputFocused]}
            onPress={() => setShowStart(true)}
            accessibilityRole="button"
            accessibilityLabel="Select start time"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="clock" size={16} color={COLORS.textSecondary} />
            <Text style={[styles.inputText, !startTime && styles.placeholderText]}>
              {startTime ? formatDisplayTime(startTime) : 'Start time'}
            </Text>
          </TouchableOpacity>
          {showStart && <DateTimePicker value={startTime ? new Date(`1970-01-01T${startTime}`) : new Date()} mode="time" display="spinner" onChange={handleStart} />}
        </View>
        <View style={styles.half}>
          <Text style={styles.fieldLabel}>End Time</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateTimeInput, showEnd && styles.inputFocused]}
            onPress={() => setShowEnd(true)}
            accessibilityRole="button"
            accessibilityLabel="Select end time"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="clock" size={16} color={COLORS.textSecondary} />
            <Text style={[styles.inputText, !endTime && styles.placeholderText]}>
              {endTime ? formatDisplayTime(endTime) : 'End time'}
            </Text>
          </TouchableOpacity>
          {showEnd && <DateTimePicker value={endTime ? new Date(`1970-01-01T${endTime}`) : new Date()} mode="time" display="spinner" onChange={handleEnd} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: SPACING.sm },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: SPACING.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  half: { flex: 1, marginRight: SPACING.sm },
  picker: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: SPACING.sm, alignItems: 'center' },
  text: { fontSize: 16, color: COLORS.textDark, textAlign: 'center' },
  duration: { marginTop: SPACING.sm, fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
  },
  inputText: {
    marginLeft: SPACING.sm,
    fontSize: 15,
    color: COLORS.textDark,
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
}); 