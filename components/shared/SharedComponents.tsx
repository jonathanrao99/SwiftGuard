// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, COMPONENTS } from '../../theme';

// Shared Header Component
interface SharedHeaderProps {
  title: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const SharedHeader: React.FC<SharedHeaderProps> = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  showBackButton = false,
  onBackPress,
}) => {
  return (
    <View style={COMPONENTS.header}>
      <View style={{ width: 24 }}>
        {showBackButton && (
          <TouchableOpacity onPress={onBackPress}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        {leftIcon && !showBackButton && (
          <TouchableOpacity onPress={onLeftPress}>
            <MaterialIcons name={leftIcon as any} size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={COMPONENTS.headerTitle}>{title}</Text>
      
      <View style={{ width: 24 }}>
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress}>
            <MaterialIcons name={rightIcon as any} size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Shared Card Component
interface SharedCardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  activeOpacity?: number;
}

export const SharedCard: React.FC<SharedCardProps> = ({
  children,
  style,
  onPress,
  activeOpacity = 0.7,
}) => {
  const CardContainer = onPress ? TouchableOpacity : View;
  
  return (
    <CardContainer
      style={[COMPONENTS.card, style]}
      onPress={onPress}
      activeOpacity={activeOpacity}
    >
      {children}
    </CardContainer>
  );
};

// Shared Button Component
interface SharedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  textStyle?: any;
}

export const SharedButton: React.FC<SharedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const buttonStyle = variant === 'primary' ? COMPONENTS.button.primary : COMPONENTS.button.secondary;
  const textStyleObj = variant === 'primary' ? COMPONENTS.button.text.primary : COMPONENTS.button.text.secondary;
  
  return (
    <TouchableOpacity
      style={[buttonStyle, style, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? COLORS.white : COLORS.textPrimary} />
      ) : (
        <Text style={[textStyleObj, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// Shared Status Pill Component
interface SharedStatusPillProps {
  status: string;
  variant?: 'available' | 'accepted' | 'scheduled' | 'completed';
  style?: any;
}

export const SharedStatusPill: React.FC<SharedStatusPillProps> = ({
  status,
  variant = 'available',
  style,
}) => {
  const getStatusStyle = () => {
    switch (variant) {
      case 'available':
        return { backgroundColor: COLORS.statusAvailable };
      case 'accepted':
        return { backgroundColor: COLORS.statusAccepted };
      case 'scheduled':
        return { backgroundColor: COLORS.statusScheduled };
      case 'completed':
        return { backgroundColor: COLORS.statusAvailable }; // Using same as available for now
      default:
        return { backgroundColor: COLORS.statusAvailable };
    }
  };

  const getStatusTextColor = () => {
    switch (variant) {
      case 'available':
        return COLORS.statusTextAvailable;
      case 'accepted':
        return COLORS.statusTextAccepted;
      case 'scheduled':
        return COLORS.statusTextScheduled;
      case 'completed':
        return COLORS.statusTextCompleted;
      default:
        return COLORS.statusTextAvailable;
    }
  };

  return (
    <View style={[COMPONENTS.statusPill, getStatusStyle(), style]}>
      <Text style={[COMPONENTS.statusText, { color: getStatusTextColor() }]}>
        {status}
      </Text>
    </View>
  );
};

// Shared Empty State Component
interface SharedEmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionButton?: {
    title: string;
    onPress: () => void;
  };
}

export const SharedEmptyState: React.FC<SharedEmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionButton,
}) => {
  return (
    <View style={COMPONENTS.emptyState}>
      <MaterialIcons name={icon as any} size={48} color="#a5b4fc" />
      <Text style={COMPONENTS.emptyText}>{title}</Text>
      {subtitle && <Text style={COMPONENTS.emptySubtext}>{subtitle}</Text>}
      {actionButton && (
        <TouchableOpacity
          style={[COMPONENTS.button.primary, { marginTop: SPACING.md }]}
          onPress={actionButton.onPress}
          activeOpacity={0.7}
        >
          <Text style={COMPONENTS.button.text.primary}>{actionButton.title}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Shared Section Header Component
interface SharedSectionHeaderProps {
  title: string;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
}

export const SharedSectionHeader: React.FC<SharedSectionHeaderProps> = ({
  title,
  showViewAll = false,
  onViewAllPress,
}) => {
  return (
    <View style={COMPONENTS.sectionHeader}>
      <Text style={COMPONENTS.sectionTitle}>{title}</Text>
      {showViewAll && (
        <TouchableOpacity onPress={onViewAllPress}>
          <Text style={COMPONENTS.viewAllButton}>View all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Shared Quick Action Component
interface SharedQuickActionProps {
  icon: string;
  label: string;
  onPress?: () => void;
  color?: string;
}

export const SharedQuickAction: React.FC<SharedQuickActionProps> = ({
  icon,
  label,
  onPress,
  color = COLORS.primaryLight,
}) => {
  const iconColor = color === COLORS.primaryLight ? COLORS.primary : color;
  
  return (
    <TouchableOpacity
      style={COMPONENTS.quickAction.wrapper}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[COMPONENTS.quickAction.button, { backgroundColor: color }]}>
        <MaterialIcons name={icon as any} size={48} color={iconColor} />
      </View>
      <Text style={COMPONENTS.quickAction.label}>{label}</Text>
    </TouchableOpacity>
  );
};

// Shared Info Row Component
interface SharedInfoRowProps {
  icon: string;
  text: string;
  iconColor?: string;
  textColor?: string;
  style?: any;
}

export const SharedInfoRow: React.FC<SharedInfoRowProps> = ({
  icon,
  text,
  iconColor = COLORS.primary,
  textColor = COLORS.textSecondary,
  style,
}) => {
  return (
    <View style={[COMPONENTS.row, style]}>
      <MaterialIcons name={icon as any} size={16} color={iconColor} />
      <Text style={[styles.infoText, { color: textColor, marginLeft: SPACING.sm }]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  infoText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
  },
}); 