import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  type?: 'spinner' | 'dots' | 'pulse';
  fullScreen?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = COLORS.primary,
  text,
  type = 'spinner',
  fullScreen = false,
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (type === 'spinner') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    } else if (type === 'pulse') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else if (type === 'dots') {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        false
      );
    }
  }, [type]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      opacity.value,
      [0.3, 1],
      [0.3, 1],
      Extrapolate.CLAMP
    ),
  }));

  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return (
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, dotsStyle, { backgroundColor: color }]} />
            <Animated.View style={[styles.dot, dotsStyle, { backgroundColor: color }]} />
            <Animated.View style={[styles.dot, dotsStyle, { backgroundColor: color }]} />
          </View>
        );
      case 'pulse':
        return (
          <Animated.View style={[styles.pulseContainer, spinnerStyle]}>
            <View style={[styles.pulseCircle, { backgroundColor: color }]} />
          </Animated.View>
        );
      default:
        return (
          <Animated.View style={spinnerStyle}>
            <ActivityIndicator size={size} color={color} />
          </Animated.View>
        );
    }
  };

  const content = (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      {renderSpinner()}
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreenOverlay}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  fullScreen: {
    flex: 1,
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  text: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default LoadingSpinner; 