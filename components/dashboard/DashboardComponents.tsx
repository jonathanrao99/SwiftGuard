import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { Job, QuickAction, User } from '../../types';
import { COLORS, SPACING } from '../../theme';

// Section Header Component
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
}) => {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Quick Action Grid Component
interface QuickActionGridProps {
  actions: QuickAction[];
  columns?: number;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  actions,
  columns = 4,
}) => {
  return (
    <View style={styles.quickActionsGrid}>
      {actions.map((action, index) => (
        <QuickActionButton
          key={action.id}
          action={action}
          style={[
            styles.quickAction,
            { width: `${100 / columns - 2}%` },
          ]}
        />
      ))}
    </View>
  );
};

// Simple QuickAction Component for GuardDashboard
interface SimpleQuickActionProps {
  icon: string;
  label: string;
  onPress?: () => void;
}

export const SimpleQuickAction: React.FC<SimpleQuickActionProps> = ({
  icon,
  label,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.quickActionButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickActionIcon}>
        <MaterialIcons 
          name={icon as any} 
          size={32} 
          color={COLORS.primary} 
        />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// QuickActionButton Component (for more complex actions)
interface QuickActionButtonProps {
  action: QuickAction;
  style?: any;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  action,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.quickActionButton, style]}
      onPress={action.action}
      activeOpacity={0.7}
    >
      <View style={[
        styles.quickActionIcon,
        { backgroundColor: `${action.color}15` },
        action.urgent && styles.urgentAction
      ]}>
        <MaterialIcons 
          name={action.icon as any} 
          size={32} 
          color={action.color} 
        />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={2}>
        {action.title}
      </Text>
      {action.urgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>!</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Job Card Component
interface JobCardProps {
  job: Job;
  onPress: () => void;
  showGuards?: boolean;
  userRole: 'client' | 'guard';
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onPress,
  showGuards = true,
  userRole,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return COLORS.primary;
      case 'pending':
        return COLORS.error;
      case 'completed':
        return COLORS.primary;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return COLORS.error;
      case 'high':
        return COLORS.error;
      case 'medium':
        return COLORS.textSecondary;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.jobCard]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Header */}
      <View style={styles.jobCardHeader}>
        <View style={styles.jobCardTitleContainer}>
          <Text style={styles.jobCardTitle} numberOfLines={1}>
            {job.title}
          </Text>
          <Text style={styles.jobCardVenue} numberOfLines={1}>
            {job.venue_type}
          </Text>
        </View>
        <View style={styles.jobCardBadges}>
          {job.priority_level && (
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(job.priority_level) }
            ]}>
              <Text style={styles.priorityText}>
                {job.priority_level.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(job.status)}20` }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(job.status) }
            ]}>
              {job.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Details */}
      <View style={styles.jobCardDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons 
            name="location-on" 
            size={24} 
            color={COLORS.textSecondary} 
          />
          <Text style={styles.detailText} numberOfLines={1}>
            {job.location}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialIcons 
            name="schedule" 
            size={24} 
            color={COLORS.textSecondary} 
          />
          <Text style={styles.detailText}>
            {job.start_time} - {job.end_time}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons 
            name="attach-money" 
            size={24} 
            color={COLORS.textSecondary} 
          />
          <Text style={styles.detailText}>
            ${job.hourly_pay}/hr • {job.num_guards} guard{job.num_guards > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Guards Section (for clients) */}
      {showGuards && userRole === 'client' && job.job_guards && job.job_guards.length > 0 && (
        <View style={styles.guardsSection}>
          <View style={styles.guardsAvatars}>
            {job.job_guards.slice(0, 3).map((jobGuard, index) => (
              <View key={jobGuard.id} style={[
                styles.guardAvatar,
                { marginLeft: index > 0 ? -8 : 0 }
              ]}>
                {jobGuard.guard?.first_name ? (
                  <Text style={styles.guardInitial}>
                    {jobGuard.guard.first_name[0]}
                  </Text>
                ) : (
                  <MaterialIcons 
                    name="person" 
                    size={16} 
                    color={COLORS.textSecondary} 
                  />
                )}
              </View>
            ))}
            {job.job_guards.length > 3 && (
              <View style={[styles.guardAvatar, styles.moreGuards]}>
                <Text style={styles.moreGuardsText}>
                  +{job.job_guards.length - 3}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.guardsText}>
            {job.job_guards.filter(jg => jg.status === 'accepted').length}/{job.num_guards} assigned
          </Text>
        </View>
      )}

      {/* Special Instructions */}
      {job.special_instructions && (
        <View style={styles.instructionsContainer}>
          <MaterialIcons 
            name="info-outline" 
            size={24} 
            color={COLORS.textSecondary} 
          />
          <Text style={styles.instructionsText} numberOfLines={2}>
            {job.special_instructions}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Guard Profile Card Component
interface GuardProfileCardProps {
  guard: User;
  onPress: () => void;
  showStatus?: boolean;
}

export const GuardProfileCard: React.FC<GuardProfileCardProps> = ({
  guard,
  onPress,
  showStatus = true,
}) => {
  return (
    <TouchableOpacity
      style={[styles.guardProfileCard]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.guardProfileHeader}>
        <View style={styles.guardProfileAvatar}>
          <Text style={styles.guardProfileInitial}>
            {guard.first_name?.[0]}{guard.last_name?.[0]}
          </Text>
        </View>
        <View style={styles.guardProfileInfo}>
          <Text style={styles.guardProfileName}>
            {guard.first_name} {guard.last_name}
          </Text>
          <Text style={styles.guardProfileLevel}>
            {guard.experience_level} • {guard.years_experience}+ years
          </Text>
        </View>
        {showStatus && (
          <View style={[
            styles.guardStatusDot,
            { backgroundColor: COLORS.primary }
          ]} />
        )}
      </View>
      
      {guard.bio && (
        <Text style={styles.guardProfileBio} numberOfLines={2}>
          {guard.bio}
        </Text>
      )}
      
      {guard.certifications && guard.certifications.length > 0 && (
        <View style={styles.certificationsContainer}>
          {guard.certifications.slice(0, 3).map((cert, index) => (
            <View key={index} style={styles.certificationBadge}>
              <Text style={styles.certificationText}>{cert}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Empty State Component
interface EmptyStateProps {
  title: string;
  description: string;
  icon: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <MaterialIcons 
          name={icon as any} 
          size={48} 
          color={COLORS.textSecondary} 
        />
      </View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateDescription}>{description}</Text>
      {action && (
        <TouchableOpacity
          style={[styles.emptyStateButton, styles.buttonSecondary]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyStateButtonText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
  },
  
  sectionTitleContainer: {
    flex: 1,
  },
  
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  buttonSecondary: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  // Quick Actions Styles
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  
  quickAction: {
    alignItems: 'center',
  },
  
  quickActionButton: {
    alignItems: 'center',
    padding: SPACING.sm,
    position: 'relative',
  },
  
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  
  urgentAction: {
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  
  quickActionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  urgentBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  urgentText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Job Card Styles
  jobCard: {
    marginBottom: SPACING.lg,
  },
  
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  
  jobCardTitleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  
  jobCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  
  jobCardVenue: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  
  jobCardBadges: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  
  priorityText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  jobCardDetails: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  
  guardsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  guardsAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  guardAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  
  guardInitial: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  moreGuards: {
    backgroundColor: COLORS.textSecondary,
  },
  
  moreGuardsText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  
  guardsText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: 6,
  },
  
  instructionsText: {
    fontSize: 12,
    color: COLORS.primary,
    flex: 1,
  },

  // Guard Profile Card Styles
  guardProfileCard: {
    marginBottom: SPACING.md,
  },
  
  guardProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  guardProfileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  
  guardProfileInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  guardProfileInfo: {
    flex: 1,
  },
  
  guardProfileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  
  guardProfileLevel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  
  guardStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  guardProfileBio: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  
  certificationBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  
  certificationText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
  },
  
  emptyStateIcon: {
    marginBottom: SPACING.lg,
  },
  
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  
  emptyStateDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  
  emptyStateButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
}); 