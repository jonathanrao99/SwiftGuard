import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  completedColor = '#10b981',
  activeColor = '#2E88FA',
  inactiveColor = '#e5e7eb',
  showLabels = true,
  orientation = 'horizontal',
}) => {
  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'inactive';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return completedColor;
      case 'active':
        return activeColor;
      default:
        return inactiveColor;
    }
  };

  if (orientation === 'vertical') {
    return (
      <View style={styles.verticalContainer}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const color = getStepColor(status);

          return (
            <View key={step.id} style={styles.verticalStep}>
              <View style={styles.verticalStepContent}>
                <View style={[styles.stepCircle, { backgroundColor: color }]}>
                  {status === 'completed' ? (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  ) : (
                    <Text style={[styles.stepNumber, { color: status === 'active' ? '#fff' : '#666' }]}>
                      {index + 1}
                    </Text>
                  )}
                </View>

                {showLabels && (
                  <View style={styles.verticalLabelContainer}>
                    <Text style={[styles.stepTitle, { color: status === 'inactive' ? '#999' : '#333' }]}>
                      {step.title}
                    </Text>
                    {step.description && (
                      <Text style={styles.stepDescription}>{step.description}</Text>
                    )}
                  </View>
                )}
              </View>

              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.verticalConnector,
                    { backgroundColor: index < currentStep ? completedColor : inactiveColor },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.horizontalContainer}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const color = getStepColor(status);

        return (
          <React.Fragment key={step.id}>
            <View style={styles.horizontalStep}>
              <View style={[styles.stepCircle, { backgroundColor: color }]}>
                {status === 'completed' ? (
                  <MaterialIcons name="check" size={16} color="#fff" />
                ) : (
                  <Text style={[styles.stepNumber, { color: status === 'active' ? '#fff' : '#666' }]}>
                    {index + 1}
                  </Text>
                )}
              </View>

              {showLabels && (
                <View style={styles.horizontalLabelContainer}>
                  <Text style={[styles.stepTitle, { color: status === 'inactive' ? '#999' : '#333' }]}>
                    {step.title}
                  </Text>
                  {step.description && (
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  )}
                </View>
              )}
            </View>

            {index < steps.length - 1 && (
              <View
                style={[
                  styles.horizontalConnector,
                  { backgroundColor: index < currentStep ? completedColor : inactiveColor },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  verticalContainer: {
    paddingHorizontal: 20,
  },
  horizontalStep: {
    alignItems: 'center',
    flex: 1,
  },
  verticalStep: {
    position: 'relative',
  },
  verticalStepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  horizontalLabelContainer: {
    alignItems: 'center',
    marginTop: 12,
    maxWidth: 100,
  },
  verticalLabelContainer: {
    marginLeft: 16,
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  stepDescription: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 3,
    fontWeight: '500',
  },
  horizontalConnector: {
    height: 3,
    flex: 1,
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 1.5,
  },
  verticalConnector: {
    position: 'absolute',
    left: 17,
    top: 44,
    bottom: -12,
    width: 3,
    borderRadius: 1.5,
  },
});
