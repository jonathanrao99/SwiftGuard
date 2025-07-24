import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme';

type CounterInputProps = {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function CounterInput({ value, onIncrement, onDecrement }: CounterInputProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.btn} onPress={onDecrement} accessibilityLabel="Decrease guards">
        <Feather name="minus" size={20} color={COLORS.primary} />
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity style={styles.btn} onPress={onIncrement} accessibilityLabel="Increase guards">
        <Feather name="plus" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.sm },
  btn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginHorizontal: SPACING.md,
    minWidth: 32,
    textAlign: 'center',
  },
}); 