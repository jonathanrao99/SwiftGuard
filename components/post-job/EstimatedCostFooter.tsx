import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

interface EstimatedCostFooterProps {
  estimatedCost: string;
  onPost: () => void;
  isSubmitting: boolean;
}

export const EstimatedCostFooter: React.FC<EstimatedCostFooterProps> = ({ estimatedCost, onPost, isSubmitting }) => (
  <View style={styles.container}>
    <Text style={styles.costText}>{estimatedCost}</Text>
    <TouchableOpacity style={styles.button} onPress={onPost} disabled={isSubmitting}>
      <LinearGradient colors={['#2563eb', '#6366f1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Review & Post Job</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  costText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    alignSelf: 'center',
  },
  button: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  gradient: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

