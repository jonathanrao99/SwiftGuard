import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../theme';

interface EnhancedLoadingSpinnerProps {
  visible: boolean;
  message?: string;
  type?: 'default' | 'payment' | 'security' | 'location';
  fullScreen?: boolean;
  overlay?: boolean;
}

const { width, height } = Dimensions.get('window');

export const EnhancedLoadingSpinner: React.FC<EnhancedLoadingSpinnerProps> = ({
  visible,
  message,
  type = 'default',
  fullScreen = false,
  overlay = true,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Start animations
      Animated.parallel([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      // Start spin animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();

      return () => spinAnimation.stop();
    } else {
      // Hide animations
      Animated.parallel([
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getLoadingConfig = () => {
    switch (type) {
      case 'payment':
        return {
          icon: 'payment',
          color: '#10b981',
          message: message || 'Processing payment...',
          gradient: ['#10b981', '#059669'],
        };
      case 'security':
        return {
          icon: 'security',
          color: '#3b82f6',
          message: message || 'Verifying security credentials...',
          gradient: ['#3b82f6', '#2563eb'],
        };
      case 'location':
        return {
          icon: 'location-on',
          color: '#f59e0b',
          message: message || 'Getting your location...',
          gradient: ['#f59e0b', '#d97706'],
        };
      default:
        return {
          icon: 'autorenew',
          color: COLORS.primary,
          message: message || 'Loading...',
          gradient: [COLORS.primary, '#6366f1'],
        };
    }
  };

  const config = getLoadingConfig();

  if (!visible) return null;

  const containerStyle = fullScreen
    ? [styles.fullScreen, overlay && styles.overlay]
    : styles.inline;

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          opacity: fadeValue,
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <View style={styles.content}>
        <LinearGradient
          colors={config.gradient}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <MaterialIcons
              name={config.icon as any}
              size={32}
              color="white"
            />
          </Animated.View>
        </LinearGradient>

        <Text style={styles.message}>{config.message}</Text>

        {type === 'payment' && (
          <Text style={styles.submessage}>
            Please don't close the app during payment processing
          </Text>
        )}

        {type === 'security' && (
          <Text style={styles.submessage}>
            This may take a few moments
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  inline: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  
  content: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: width * 0.8,
  },
  
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  
  submessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

// Hook for easy loading state management
export const useLoadingState = (initialState = false) => {
  const [loading, setLoading] = React.useState(initialState);
  const [message, setMessage] = React.useState<string>();
  const [type, setType] = React.useState<EnhancedLoadingSpinnerProps['type']>('default');

  const showLoading = (
    loadingMessage?: string,
    loadingType?: EnhancedLoadingSpinnerProps['type']
  ) => {
    setMessage(loadingMessage);
    setType(loadingType || 'default');
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
    setMessage(undefined);
  };

  return {
    loading,
    message,
    type,
    showLoading,
    hideLoading,
    LoadingComponent: () => (
      <EnhancedLoadingSpinner
        visible={loading}
        message={message}
        type={type}
        fullScreen
      />
    ),
  };
};

export default EnhancedLoadingSpinner;
