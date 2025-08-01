import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface TabTransitionProps {
  children: React.ReactNode;
  isActive: boolean;
  onAnimationComplete?: () => void;
}

const TabTransition: React.FC<TabTransitionProps> = ({ 
  children, 
  isActive, 
  onAnimationComplete 
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (isActive) {
      // Animate in
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { 
        damping: 15, 
        stiffness: 100 
      });
      scale.value = withSpring(1, { 
        damping: 15, 
        stiffness: 100 
      });
    } else {
      // Animate out
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(20, { duration: 200 });
      scale.value = withTiming(0.95, { duration: 200 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TabTransition; 