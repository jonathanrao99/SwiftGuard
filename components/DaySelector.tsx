import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, SPACING } from '../theme';

interface DaySelectorProps {
  selectedDays: string[];
  onDayToggle: (day: string) => void;
  label?: string;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDays,
  onDayToggle,
  label = 'Select Days',
}) => {
  const days = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
  ];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.daysContainer}>
        {days.map((day) => (
          <TouchableOpacity
            key={day.key}
            style={[
              styles.dayButton,
              selectedDays.includes(day.key) && styles.dayButtonSelected,
            ]}
            onPress={() => onDayToggle(day.key)}
          >
            <Text
              style={[
                styles.dayButtonText,
                selectedDays.includes(day.key) && styles.dayButtonTextSelected,
              ]}
            >
              {day.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  dayButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayButtonTextSelected: {
    color: COLORS.white,
  },
}); 