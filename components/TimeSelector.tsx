import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme';

interface TimeSelectorProps {
  value?: string;
  onChange: (time: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select Time',
  label,
  error,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(
    value ? new Date(`2000-01-01T${value}`) : new Date()
  );

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (time) {
      setSelectedTime(time);
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      onChange(formattedTime);
    }
  };

  const showTimePicker = () => {
    setShowPicker(true);
  };

  const formatDisplayTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.input} onPress={showTimePicker}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value ? formatDisplayTime(value) : placeholder}
        </Text>
        <MaterialIcons name="access-time" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showPicker}
            onRequestClose={() => setShowPicker(false)}
          >
            <Pressable 
              style={styles.modalOverlay} 
              onPress={() => setShowPicker(false)}
            >
              <Pressable style={styles.pickerContainer} onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Time</Text>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.closeButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerWrapper}>
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    is24Hour={false}
                    style={styles.dateTimePicker}
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
            is24Hour={false}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  inputText: {
    fontSize: 16,
    color: COLORS.textDark,
    flex: 1,
  },
  placeholder: {
    color: COLORS.textSecondary,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  closeButton: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  pickerWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  dateTimePicker: {
    width: '100%',
    height: 200,
  },
}); 