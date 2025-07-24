import { TextStyle, ViewStyle } from 'react-native';

// Security-focused color palette
export const colors = {
  // Primary Security Blue
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Security Red (Alerts/Emergency)
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Success Green (Verified/Complete)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning Orange (Caution)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Neutral Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Status Colors
  status: {
    online: '#22c55e',
    offline: '#6b7280',
    busy: '#f59e0b',
    emergency: '#dc2626',
  },
  
  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },
};

// Typography System
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System-Medium',
    semibold: 'System-Semibold',
    bold: 'System-Bold',
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 32,
    '3xl': 36,
    '4xl': 44,
  },
};

// Spacing System
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

// Border Radius
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Component Styles
export const components = {
  button: {
    primary: {
      backgroundColor: colors.primary[600],
      paddingHorizontal: spacing[6],
      paddingVertical: spacing[3],
      borderRadius: borderRadius.base,
      ...shadows.sm,
    },
    secondary: {
      backgroundColor: colors.gray[100],
      borderWidth: 1,
      borderColor: colors.gray[300],
      paddingHorizontal: spacing[6],
      paddingVertical: spacing[3],
      borderRadius: borderRadius.base,
    },
    danger: {
      backgroundColor: colors.danger[600],
      paddingHorizontal: spacing[6],
      paddingVertical: spacing[3],
      borderRadius: borderRadius.base,
      ...shadows.sm,
    },
    success: {
      backgroundColor: colors.success[600],
      paddingHorizontal: spacing[6],
      paddingVertical: spacing[3],
      borderRadius: borderRadius.base,
      ...shadows.sm,
    },
  },
  
  card: {
    base: {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.lg,
      padding: spacing[4],
      ...shadows.base,
    },
    elevated: {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.lg,
      padding: spacing[6],
      ...shadows.lg,
    },
  },
  
  input: {
    base: {
      borderWidth: 1,
      borderColor: colors.gray[300],
      borderRadius: borderRadius.base,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      fontSize: typography.fontSize.base,
      backgroundColor: colors.background.primary,
    },
    focused: {
      borderColor: colors.primary[500],
      borderWidth: 2,
    },
    error: {
      borderColor: colors.danger[500],
      borderWidth: 1,
    },
  },
  
  badge: {
    primary: {
      backgroundColor: colors.primary[600],
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
    },
    success: {
      backgroundColor: colors.success[600],
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
    },
    warning: {
      backgroundColor: colors.warning[600],
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
    },
    danger: {
      backgroundColor: colors.danger[600],
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
    },
  },
};

// Export theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
};

export type Theme = typeof theme; 