import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface EnhancedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  isRequired?: boolean;
  isLoading?: boolean;
  success?: boolean;
}

export const EnhancedInput = forwardRef<TextInput, EnhancedInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconPress,
      variant = 'outlined',
      size = 'md',
      isRequired = false,
      isLoading = false,
      success = false,
      style,
      value,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

    const handleFocus = (e: any) => {
      setIsFocused(true);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      if (!value) {
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      onBlur?.(e);
    };

    const sizeStyles = {
      sm: { height: 40, fontSize: 14 },
      md: { height: 48, fontSize: 16 },
      lg: { height: 56, fontSize: 18 },
    };

    const currentSize = sizeStyles[size];

    const getContainerStyle = () => {
      const baseStyle = [
        styles.container,
        { height: currentSize.height },
        variant === 'outlined' && styles.outlined,
        variant === 'filled' && styles.filled,
      ];

      if (error) {
        baseStyle.push(styles.error);
      } else if (success) {
        baseStyle.push(styles.success);
      } else if (isFocused) {
        baseStyle.push(styles.focused);
      }

      return baseStyle;
    };

    const animatedLabelStyle = {
      position: 'absolute' as const,
      left: leftIcon ? 44 : 20,
      top: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [currentSize.height / 2 - 8, -8],
      }),
      fontSize: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [currentSize.fontSize, 13],
      }),
      color: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['#9ca3af', isFocused ? '#2563eb' : '#374151'],
      }),
      fontWeight: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['400', '600'],
      }),
      zIndex: 1,
      backgroundColor: '#fff',
      paddingHorizontal: 8,
      borderRadius: 4,
    };

    return (
      <View style={styles.wrapper}>
        <View style={getContainerStyle()}>
          {leftIcon && (
            <MaterialIcons
              name={leftIcon}
              size={20}
              color={error ? '#ef4444' : isFocused ? '#2E88FA' : '#999'}
              style={styles.leftIcon}
            />
          )}

          {label && (
            <Animated.Text style={animatedLabelStyle}>
              {label}
              {isRequired && <Text style={styles.required}> *</Text>}
            </Animated.Text>
          )}

          <TextInput
            ref={ref}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.input,
              {
                fontSize: currentSize.fontSize,
                paddingLeft: leftIcon ? 48 : 20,
                paddingRight: rightIcon || isLoading ? 48 : 20,
                paddingTop: label ? 20 : 16,
                paddingBottom: 16,
              },
              style,
            ]}
            placeholderTextColor={error ? '#ef4444' : '#999'}
            {...props}
          />

          {isLoading && (
            <View style={styles.rightIcon}>
              <MaterialIcons name="hourglass-empty" size={20} color="#999" />
            </View>
          )}

          {!isLoading && rightIcon && (
            <TouchableOpacity
              style={styles.rightIcon}
              onPress={onRightIconPress}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={rightIcon}
                size={20}
                color={error ? '#ef4444' : isFocused ? '#2E88FA' : '#999'}
              />
            </TouchableOpacity>
          )}

          {!isLoading && !rightIcon && success && (
            <View style={styles.rightIcon}>
              <MaterialIcons name="check-circle" size={20} color="#10b981" />
            </View>
          )}

          {!isLoading && !rightIcon && error && (
            <View style={styles.rightIcon}>
              <MaterialIcons name="error" size={20} color="#ef4444" />
            </View>
          )}
        </View>

        {(error || helperText) && (
          <View style={styles.helperContainer}>
            {error && (
              <Text style={styles.errorText}>
                {error}
              </Text>
            )}
            {!error && helperText && (
              <Text style={styles.helperText}>
                {helperText}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  container: {
    position: 'relative',
    borderRadius: 16,
    backgroundColor: '#fff',
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filled: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  focused: {
    borderColor: '#2563eb',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  error: {
    borderColor: '#ef4444',
    borderWidth: 1.5,
  },
  success: {
    borderColor: '#10b981',
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
    textAlignVertical: 'center',
    fontWeight: '500',
  },
  leftIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -10,
    zIndex: 2,
  },
  rightIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
    zIndex: 2,
  },
  helperContainer: {
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
    lineHeight: 18,
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '400',
    lineHeight: 18,
  },
  required: {
    color: '#ef4444',
    fontSize: 14,
  },
});
