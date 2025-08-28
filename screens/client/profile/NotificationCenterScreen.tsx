import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../theme';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { NotificationData } from '../../../services/NotificationService';

interface NotificationItemProps {
  notification: NotificationData;
  onPress: (notification: NotificationData) => void;
  onMarkAsRead: (notificationId: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = React.memo(({ 
  notification, 
  onPress, 
  onMarkAsRead 
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return COLORS.error;
      case 'high': return COLORS.warning;
      case 'medium': return COLORS.primary;
      default: return COLORS.textMuted;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'priority-high';
      case 'medium': return 'info';
      default: return 'notifications-none';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job_posted': return 'work';
      case 'job_accepted': return 'check-circle';
      case 'job_rejected': return 'cancel';
      case 'job_started': return 'play-arrow';
      case 'job_completed': return 'done-all';
      case 'incident_reported': return 'warning';
      case 'payment_received': return 'payment';
      case 'message_received': return 'message';
      case 'emergency_alert': return 'emergency';
      case 'check_in_reminder': return 'schedule';
      case 'check_out_reminder': return 'schedule';
      default: return 'notifications';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification,
        notification.priority === 'critical' && styles.criticalNotification
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <MaterialIcons 
            name={getTypeIcon(notification.type) as any} 
            size={20} 
            color={getPriorityColor(notification.priority)} 
          />
        </View>
        <View style={styles.notificationInfo}>
          <Text style={[
            styles.notificationTitle,
            !notification.read && styles.unreadTitle
          ]}>
            {notification.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
        <View style={styles.notificationMeta}>
          <View style={styles.priorityIndicator}>
            <MaterialIcons 
              name={getPriorityIcon(notification.priority) as any} 
              size={16} 
              color={getPriorityColor(notification.priority)} 
            />
          </View>
          <Text style={styles.timestamp}>
            {formatTime(notification.createdAt)}
          </Text>
        </View>
      </View>
      
      {!notification.read && (
        <TouchableOpacity
          style={styles.markAsReadButton}
          onPress={() => onMarkAsRead(notification.id)}
        >
          <MaterialIcons name="check" size={16} color={COLORS.primary} />
          <Text style={styles.markAsReadText}>Mark as read</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

export default function NotificationCenterScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('read', false);
      } else if (filter === 'critical') {
        query = query.eq('priority', 'critical');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [filter]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      console.log('✅ Notification marked as read');
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All Read',
          onPress: async () => {
            try {
              const { error: updateError } = await supabase
                .from('notifications')
                .update({ 
                  read: true, 
                  updated_at: new Date().toISOString() 
                })
                .eq('user_id', user?.id)
                .eq('read', false);

              if (updateError) {
                throw updateError;
              }

              // Update local state
              setNotifications(prev => 
                prev.map(n => ({ ...n, read: true }))
              );

              Alert.alert('Success', 'All notifications marked as read');
            } catch (err: any) {
              console.error('Error marking all notifications as read:', err);
              Alert.alert('Error', 'Failed to mark all notifications as read');
            }
          },
        },
      ]
    );
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'This will permanently delete all your notifications. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: deleteError } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user?.id);

              if (deleteError) {
                throw deleteError;
              }

              setNotifications([]);
              Alert.alert('Success', 'All notifications cleared');
            } catch (err: any) {
              console.error('Error clearing notifications:', err);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification: NotificationData) => {
    // Mark as read if unread
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'job_posted':
        navigation.navigate('Jobs');
        break;
      case 'job_accepted':
      case 'job_started':
      case 'job_completed':
        if (notification.data?.jobId) {
          navigation.navigate('JobDetails', { jobId: notification.data.jobId });
        }
        break;
      case 'incident_reported':
        navigation.navigate('Reports');
        break;
      case 'payment_received':
        navigation.navigate('PaymentMethods');
        break;
      case 'message_received':
        // Navigate to messages when implemented
        break;
      default:
        // Default navigation or no navigation
        break;
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'critical':
        return notifications.filter(n => n.priority === 'critical');
      default:
        return notifications;
    }
  };

  const getUnreadCount = () => notifications.filter(n => !n.read).length;
  const getCriticalCount = () => notifications.filter(n => n.priority === 'critical').length;

  const renderFilterButton = (filterType: 'all' | 'unread' | 'critical', label: string, count?: number) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Loading notifications..." />
      </View>
    );
  }

  const filteredNotifications = getFilteredNotifications();

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
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('NotificationPreferences')}
            style={styles.settingsButton}
          >
            <MaterialIcons name="settings" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filtersContainer}>
          {renderFilterButton('all', 'All', notifications.length)}
          {renderFilterButton('unread', 'Unread', getUnreadCount())}
          {renderFilterButton('critical', 'Critical', getCriticalCount())}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={markAllAsRead}
            disabled={getUnreadCount() === 0}
          >
            <MaterialIcons name="done-all" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Mark All Read</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            <MaterialIcons name="clear-all" size={20} color={COLORS.error} />
            <Text style={[styles.actionButtonText, styles.clearButtonText]}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={20} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-none" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'You\'re all caught up!' 
                : filter === 'unread' 
                  ? 'No unread notifications'
                  : 'No critical notifications'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                onPress={handleNotificationPress}
                onMarkAsRead={markNotificationAsRead}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            contentContainerStyle={styles.notificationsList}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: COLORS.white,
  },
  filterBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: SPACING.xs,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearButton: {
    borderColor: COLORS.error,
  },
  actionButtonText: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  clearButtonText: {
    color: COLORS.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.error,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '600',
    color: COLORS.textDark,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  notificationItem: {
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
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.backgroundLight,
  },
  criticalNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notificationInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  notificationTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationBody: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  notificationMeta: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  priorityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
  markAsReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  markAsReadText: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

