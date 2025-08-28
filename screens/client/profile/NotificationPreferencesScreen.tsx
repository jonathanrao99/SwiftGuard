import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../theme';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorBoundary from '../../../components/ErrorBoundary';

interface NotificationPreference {
  id: string;
  type: string;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
}

interface NotificationType {
  key: string;
  label: string;
  description: string;
  icon: string;
  critical: boolean;
}

const NOTIFICATION_TYPES: NotificationType[] = [
  {
    key: 'job_posted',
    label: 'New Job Alerts',
    description: 'Get notified when new security jobs are posted',
    icon: 'work',
    critical: false,
  },
  {
    key: 'job_accepted',
    label: 'Job Acceptance',
    description: 'When a guard accepts your job',
    icon: 'check-circle',
    critical: false,
  },
  {
    key: 'job_started',
    label: 'Job Started',
    description: 'When your security job begins',
    icon: 'play-arrow',
    critical: false,
  },
  {
    key: 'job_completed',
    label: 'Job Completed',
    description: 'When your security job is finished',
    icon: 'done-all',
    critical: false,
  },
  {
    key: 'incident_reported',
    label: 'Incident Reports',
    description: 'Critical alerts for security incidents',
    icon: 'warning',
    critical: true,
  },
  {
    key: 'payment_received',
    label: 'Payment Updates',
    description: 'Payment confirmations and updates',
    icon: 'payment',
    critical: false,
  },
  {
    key: 'message_received',
    label: 'Messages',
    description: 'New messages from guards or support',
    icon: 'message',
    critical: false,
  },
  {
    key: 'emergency_alert',
    label: 'Emergency Alerts',
    description: 'Critical emergency notifications',
    icon: 'emergency',
    critical: true,
  },
];

export default function NotificationPreferencesScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .order('type');

      if (fetchError) {
        throw fetchError;
      }

      setPreferences(data || []);
    } catch (err: any) {
      console.error('Error fetching notification preferences:', err);
      setError(err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (
    type: string,
    field: 'push_enabled' | 'email_enabled' | 'sms_enabled' | 'in_app_enabled',
    value: boolean
  ) => {
    try {
      setSaving(true);
      setError(null);

      // Find existing preference
      const existingPreference = preferences.find(p => p.type === type);
      
      if (existingPreference) {
        // Update existing preference
        const { error: updateError } = await supabase
          .from('notification_preferences')
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq('id', existingPreference.id);

        if (updateError) {
          throw updateError;
        }

        // Update local state
        setPreferences(prev => 
          prev.map(p => 
            p.type === type ? { ...p, [field]: value } : p
          )
        );
      } else {
        // Create new preference
        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user?.id,
            type,
            [field]: value,
            push_enabled: field === 'push_enabled' ? value : false,
            email_enabled: field === 'email_enabled' ? value : false,
            sms_enabled: field === 'sms_enabled' ? value : false,
            in_app_enabled: field === 'in_app_enabled' ? value : true,
          });

        if (insertError) {
          throw insertError;
        }

        // Refresh preferences
        await fetchNotificationPreferences();
      }

      console.log(`✅ Updated ${field} for ${type} to ${value}`);
    } catch (err: any) {
      console.error('Error updating preference:', err);
      setError(err.message || 'Failed to update preference');
      
      // Revert local state
      await fetchNotificationPreferences();
    } finally {
      setSaving(false);
    }
  };

  const getPreferenceValue = (type: string, field: keyof NotificationPreference): boolean => {
    const preference = preferences.find(p => p.type === type);
    return preference ? preference[field] : false;
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Reset to Defaults',
      'This will reset all notification preferences to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              setError(null);

              // Delete all existing preferences
              const { error: deleteError } = await supabase
                .from('notification_preferences')
                .delete()
                .eq('user_id', user?.id);

              if (deleteError) {
                throw deleteError;
              }

              // Refresh to get new default preferences
              await fetchNotificationPreferences();
              
              Alert.alert('Success', 'Notification preferences reset to defaults');
            } catch (err: any) {
              console.error('Error resetting preferences:', err);
              setError(err.message || 'Failed to reset preferences');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const renderNotificationType = (notificationType: NotificationType) => {
    const pushEnabled = getPreferenceValue(notificationType.key, 'push_enabled');
    const inAppEnabled = getPreferenceValue(notificationType.key, 'in_app_enabled');

    return (
      <View key={notificationType.key} style={styles.notificationTypeContainer}>
        <View style={styles.notificationTypeHeader}>
          <View style={styles.iconContainer}>
            <MaterialIcons 
              name={notificationType.icon as any} 
              size={24} 
              color={notificationType.critical ? COLORS.error : COLORS.primary} 
            />
          </View>
          <View style={styles.notificationTypeInfo}>
            <Text style={[
              styles.notificationTypeLabel,
              notificationType.critical && styles.criticalLabel
            ]}>
              {notificationType.label}
            </Text>
            <Text style={styles.notificationTypeDescription}>
              {notificationType.description}
            </Text>
          </View>
        </View>
        
        <View style={styles.switchesContainer}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Push Notifications</Text>
            <Switch
              value={pushEnabled}
              onValueChange={(value) => updatePreference(notificationType.key, 'push_enabled', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={pushEnabled ? COLORS.white : COLORS.textMuted}
              disabled={saving}
            />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>In-App Notifications</Text>
            <Switch
              value={inAppEnabled}
              onValueChange={(value) => updatePreference(notificationType.key, 'in_app_enabled', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={inAppEnabled ? COLORS.white : COLORS.textMuted}
              disabled={saving}
            />
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Loading notification preferences..." />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Preferences</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoSection}>
            <MaterialIcons name="info-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Manage how you receive notifications for different events
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.preferencesContainer}>
            {NOTIFICATION_TYPES.map(renderNotificationType)}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetToDefaults}
              disabled={saving}
            >
              <MaterialIcons name="restore" size={20} color={COLORS.textMuted} />
              <Text style={styles.resetButtonText}>Reset to Defaults</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Critical notifications (incidents, emergencies) will always be shown regardless of your preferences
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? 48 : 4,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING.md,
    borderRadius: 8,
    marginVertical: SPACING.md,
  },
  infoText: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: 8,
    marginVertical: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.error,
    flex: 1,
  },
  preferencesContainer: {
    marginVertical: SPACING.md,
  },
  notificationTypeContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notificationTypeInfo: {
    flex: 1,
  },
  notificationTypeLabel: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  criticalLabel: {
    color: COLORS.error,
  },
  notificationTypeDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  switchesContainer: {
    gap: SPACING.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  switchLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  actionsContainer: {
    marginVertical: SPACING.lg,
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundLight,
  },
  resetButtonText: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  footer: {
    marginVertical: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
  },
  footerText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

