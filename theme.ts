// Enhanced Theme System for SwiftGuard
export const COLORS = {
  // Primary Colors
  primary: '#2563eb',
  primaryLight: '#eef2ff',
  primaryDark: '#1d4ed8',
  
  // Background Colors
  white: '#ffffff',
  background: '#ffffff',
  backgroundLight: '#f9fafb',
  backgroundGradient: ['#ffffff', '#e0f2ff'],
  
  // Text Colors
  textDark: '#222222',
  textPrimary: '#111827',
  textSecondary: '#64748b',
  textMuted: '#9ca3af',
  
  // Status Colors
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  
  // Border Colors
  border: '#e5e7eb',
  borderLight: '#f1f5f9',
  
  // Card Colors
  cardBackground: '#ffffff',
  cardShadow: '#000000',
  
  // Status Badge Colors
  statusAvailable: '#dcfce7',
  statusAccepted: '#e0f2fe',
  statusScheduled: '#dbeafe',
  statusTextAvailable: '#059669',
  statusTextAccepted: '#1d4ed8',
  statusTextScheduled: '#2563eb',
  statusTextCompleted: '#059669',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  // Font Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  
  // Font Weights
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  
  // Line Heights
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};

export const LAYOUT = {
  // Border Radius
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  
  // Shadows
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  // Margins and Padding
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  
  // Screen Dimensions
  screen: {
    paddingHorizontal: '5%',
    paddingBottom: 120,
  },
};

// Component-Specific Styles
export const COMPONENTS = {
  // Header Styles
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: SPACING.lg,
    paddingTop: 16,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
  },
  
  // Card Styles
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: LAYOUT.radius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.sm,
    justifyContent: 'space-between' as const,
  },
  
  cardTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  
  // Status Pill Styles
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: LAYOUT.radius.sm,
    alignSelf: 'flex-start' as const,
  },
  
  statusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
  },
  
  // Row Styles
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.sm,
  },
  
  // Button Styles
  button: {
    primary: {
      backgroundColor: COLORS.primary,
      borderRadius: LAYOUT.radius.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    
    secondary: {
      backgroundColor: COLORS.backgroundLight,
      borderRadius: LAYOUT.radius.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    
    text: {
      primary: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.base,
        fontWeight: TYPOGRAPHY.semibold,
      },
      
      secondary: {
        color: COLORS.textPrimary,
        fontSize: TYPOGRAPHY.base,
        fontWeight: TYPOGRAPHY.semibold,
      },
    },
  },
  
  // Tab Bar Styles
  tabBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  
  tabIndicator: {
    backgroundColor: COLORS.primary,
    height: 3,
  },
  
  tabLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    textTransform: 'none' as const,
  },
  
  // Empty State Styles
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: SPACING.xxl,
  },
  
  emptyText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginTop: SPACING.md,
  },
  
  emptySubtext: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    textAlign: 'center' as const,
    marginTop: SPACING.xs,
  },
  
  // Quick Action Styles
  quickAction: {
    wrapper: {
      alignItems: 'center' as const,
      flex: 1,
    },
    
    button: {
      backgroundColor: COLORS.primaryLight,
      borderRadius: LAYOUT.radius.xl,
      width: 100,
      height: 100,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: SPACING.sm,
    },
    
    label: {
      color: COLORS.textPrimary,
      fontSize: TYPOGRAPHY.sm,
      fontWeight: TYPOGRAPHY.bold,
      textAlign: 'center' as const,
    },
  },
  
  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: SPACING.md,
    marginHorizontal: '5%',
    marginBottom: SPACING.xs,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
  },
  
  viewAllButton: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.semibold,
    fontSize: TYPOGRAPHY.sm,
  },
};

// Utility Functions
export const createStyleSheet = (styles: any) => {
  return styles;
};

// Theme Export
export const THEME = {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  LAYOUT,
  COMPONENTS,
}; 