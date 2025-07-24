import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../theme';
import { Feather } from '@expo/vector-icons';

interface StepIndicatorProps {
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  // Adjust for template selection step (0) - only show steps 1, 2, 3
  const adjustedStep = currentStep === 0 ? 0 : currentStep - 1;
  
  return (
    <View style={styles.container}>
      {['Event Details', 'Pay & Requirements', 'Contact & Review'].map((label, index) => (
        <View key={label} style={styles.stepWrapper}>
          <View style={[styles.stepCircle, adjustedStep >= index && styles.stepCircleActive]}>
            {adjustedStep > index ? (
              <Feather name="check" size={16} color={COLORS.white} />
            ) : (
              <Text style={[styles.stepNumber, adjustedStep === index && styles.stepNumberActive]}>
                {index + 1}
              </Text>
            )}
          </View>
          <Text style={[styles.stepText, adjustedStep >= index && styles.stepTextActive]}>
            {label}
          </Text>
          {index < 2 && <View style={[styles.stepLine, adjustedStep > index && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0,
    zIndex: 1000,
    paddingTop: SPACING.md,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    color: COLORS.white,
  },
  stepText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  stepTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  stepLine: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: COLORS.border,
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
});

