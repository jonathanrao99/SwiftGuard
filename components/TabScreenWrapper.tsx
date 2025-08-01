import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface TabScreenWrapperProps {
  children: React.ReactNode;
  isFocused: boolean;
  onAnimationComplete?: () => void;
}

const TabScreenWrapper: React.FC<TabScreenWrapperProps> = ({ 
  children, 
  isFocused, 
  onAnimationComplete 
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.98);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isFocused) {
      // Animate in
      opacity.value = withTiming(1, { 
        duration: 400,
      }, () => {
        if (onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      });
      translateY.value = withSpring(0, { 
        damping: 20, 
        stiffness: 100,
        mass: 0.8,
      });
      scale.value = withSpring(1, { 
        damping: 20, 
        stiffness: 100,
        mass: 0.8,
      });
    } else {
      // Animate out
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(30, { duration: 300 });
      scale.value = withTiming(0.98, { duration: 300 });
    }
  }, [isFocused]);

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

export default TabScreenWrapper; 