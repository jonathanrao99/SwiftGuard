// import * as Notifications from 'expo-notifications'; // Removed - will install later
import { Platform, Alert } from 'react-native';
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Notification types
export type NotificationType = 
  | 'job_posted'
  | 'job_accepted'
  | 'job_rejected'
  | 'job_started'
  | 'job_completed'
  | 'incident_reported'
  | 'payment_received'
  | 'message_received'
  | 'emergency_alert'
  | 'check_in_reminder'
  | 'check_out_reminder';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  userId: string;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  priority?: 'default' | 'normal' | 'high';
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private pushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // TEMPORARILY DISABLED - expo-notifications removed
      if (__DEV__) {
        // Notification service temporarily disabled - expo-notifications removed
      }
      this.isInitialized = true;
      return;

      // TODO: Re-enable when expo-notifications is installed
      /*
      // Check if running in Expo Go (limited notification support)
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) {
        // Running in Expo Go - notification functionality is limited. Use a development build for full functionality.
        this.isInitialized = true;
        return;
      }

      // Configure notification behavior
      await this.configureNotifications();
      
      // Request permissions
      await this.requestPermissions();
      
      // Get push token (skip in Expo Go)
      if (!isExpoGo) {
        await this.getPushToken();
      }
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      // Set up Supabase real-time subscriptions
      await this.setupSupabaseSubscriptions();
      
      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
      */
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      throw error;
    }
  }

  /**
   * Configure notification behavior
   */
  private async configureNotifications(): Promise<void> {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Emergency channel for critical notifications
      await Notifications.setNotificationChannelAsync('emergency', {
        name: 'Emergency Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#FF0000',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<void> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Push notifications are required for important updates. Please enable them in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('✅ Notification permissions granted');
  }

  /**
   * Get push notification token
   */
  private async getPushToken(): Promise<void> {
    try {
      // Skip push token in Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) {
        console.log('⚠️ Skipping push token generation in Expo Go');
        return;
      }

      // Get project ID from app config
      const projectId = Constants.expoConfig?.extra?.expoProjectId || Constants.expoConfig?.projectId;
      
      if (!projectId) {
        console.warn('⚠️ No Expo project ID found, skipping push token generation');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      this.pushToken = token.data;
      
      // Store token locally
      await AsyncStorage.setItem('pushToken', token.data);
      
      // Save token to Supabase
      await this.savePushTokenToSupabase(token.data);
      
      console.log('✅ Push token obtained:', token.data);
    } catch (error) {
      console.error('❌ Failed to get push token:', error);
    }
  }

  /**
   * Save push token to Supabase
   */
  private async savePushTokenToSupabase(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          push_token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ Failed to save push token to Supabase:', error);
      } else {
        console.log('✅ Push token saved to Supabase');
      }
    } catch (error) {
      console.error('❌ Error saving push token:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners(): void {
    // Listen for incoming notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
      this.handleIncomingNotification(notification);
    });

    // Listen for notification responses (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Set up Supabase real-time subscriptions
   */
  private async setupSupabaseSubscriptions(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to user-specific notifications
      const notificationsSubscription = supabase
        .channel(`notifications:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          console.log('🔔 Real-time notification received:', payload);
          this.handleSupabaseNotification(payload.new as NotificationData);
        })
        .subscribe();

      // Subscribe to job updates for guards
      if (user.role === 'guard') {
        const jobsSubscription = supabase
          .channel(`guard_jobs:${user.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'jobs',
            filter: `status=eq.paid`,
          }, (payload) => {
            console.log('🔔 Job update received:', payload);
            this.handleJobUpdate(payload);
          })
          .subscribe();
      }

      // Subscribe to job updates for clients
      if (user.role === 'client') {
        const clientJobsSubscription = supabase
          .channel(`client_jobs:${user.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'jobs',
            filter: `client_id=eq.${user.id}`,
          }, (payload) => {
            console.log('🔔 Client job update received:', payload);
            this.handleClientJobUpdate(payload);
          })
          .subscribe();
      }

      console.log('✅ Supabase subscriptions set up successfully');
    } catch (error) {
      console.error('❌ Failed to set up Supabase subscriptions:', error);
    }
  }

  /**
   * Handle incoming push notifications
   */
  private handleIncomingNotification(notification: Notifications.Notification): void {
    // Store notification locally
    this.storeNotificationLocally(notification);
    
    // Update badge count
    this.updateBadgeCount();
  }

  /**
   * Handle notification responses (user taps)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    // Mark notification as read
    if (data?.notificationId) {
      this.markNotificationAsRead(data.notificationId);
    }
    
    // Navigate based on notification type
    this.navigateBasedOnNotification(data);
  }

  /**
   * Handle Supabase real-time notifications
   */
  private handleSupabaseNotification(notification: NotificationData): void {
    // Show local notification
    this.showLocalNotification({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      priority: notification.priority === 'critical' ? 'high' : 'default',
    });
    
    // Store notification locally
    this.storeNotificationLocally({
      request: {
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
        },
        identifier: notification.id,
      },
    } as any);
  }

  /**
   * Handle job updates for guards
   */
  private handleJobUpdate(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT') {
      // New job posted
      this.showLocalNotification({
        title: 'New Job Available',
        body: `${newRecord.title} - ${newRecord.location}`,
        data: { jobId: newRecord.id, type: 'job_posted' },
        priority: 'high',
      });
    } else if (eventType === 'UPDATE') {
      // Job status changed
      if (newRecord.status !== oldRecord.status) {
        this.showLocalNotification({
          title: 'Job Status Updated',
          body: `${newRecord.title} is now ${newRecord.status}`,
          data: { jobId: newRecord.id, type: 'job_status_changed' },
          priority: 'medium',
        });
      }
    }
  }

  /**
   * Handle client job updates
   */
  private handleClientJobUpdate(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'UPDATE') {
      if (newRecord.status === 'active' && oldRecord.status === 'paid') {
        // Job started
        this.showLocalNotification({
          title: 'Job Started',
          body: `${newRecord.title} is now active`,
          data: { jobId: newRecord.id, type: 'job_started' },
          priority: 'medium',
        });
      } else if (newRecord.status === 'completed' && oldRecord.status === 'active') {
        // Job completed
        this.showLocalNotification({
          title: 'Job Completed',
          body: `${newRecord.title} has been completed`,
          data: { jobId: newRecord.id, type: 'job_completed' },
          priority: 'medium',
        });
      }
    }
  }

  /**
   * Show local notification
   */
  async showLocalNotification(notification: PushNotificationPayload): Promise<void> {
    try {
      const channelId = notification.priority === 'high' ? 'emergency' : 'default';
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: notification.sound ?? true,
          priority: notification.priority ?? 'default',
        },
        trigger: null, // Show immediately
        identifier: `local_${Date.now()}`,
      });
    } catch (error) {
      console.error('❌ Failed to show local notification:', error);
    }
  }

  /**
   * Send push notification to specific user
   */
  async sendPushNotification(
    userId: string,
    notification: PushNotificationPayload
  ): Promise<void> {
    try {
      // Get user's push token from Supabase
      const { data: tokens, error } = await supabase
        .from('user_push_tokens')
        .select('push_token')
        .eq('user_id', userId);

      if (error || !tokens || tokens.length === 0) {
        console.log('⚠️ No push token found for user:', userId);
        return;
      }

      // Send to Expo push service
      const message = {
        to: tokens.map(t => t.push_token),
        sound: notification.sound ?? true,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        priority: notification.priority ?? 'default',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.statusText}`);
      }

      console.log('✅ Push notification sent successfully to user:', userId);
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
    }
  }

  /**
   * Store notification locally
   */
  private async storeNotificationLocally(notification: any): Promise<void> {
    try {
      const notifications = await this.getLocalNotifications();
      const newNotification = {
        id: notification.request.identifier || `local_${Date.now()}`,
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
        timestamp: Date.now(),
        read: false,
      };
      
      notifications.unshift(newNotification);
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }
      
      await AsyncStorage.setItem('localNotifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('❌ Failed to store notification locally:', error);
    }
  }

  /**
   * Get local notifications
   */
  async getLocalNotifications(): Promise<any[]> {
    try {
      const notifications = await AsyncStorage.getItem('localNotifications');
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('❌ Failed to get local notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getLocalNotifications();
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      await AsyncStorage.setItem('localNotifications', JSON.stringify(updatedNotifications));
      
      // Also mark as read in Supabase if it's a stored notification
      await this.markSupabaseNotificationAsRead(notificationId);
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark Supabase notification as read
   */
  private async markSupabaseNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Failed to mark Supabase notification as read:', error);
      }
    } catch (error) {
      console.error('❌ Error marking Supabase notification as read:', error);
    }
  }

  /**
   * Update badge count
   */
  private async updateBadgeCount(): Promise<void> {
    try {
      const notifications = await this.getLocalNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;
      
      await Notifications.setBadgeCountAsync(unreadCount);
    } catch (error) {
      console.error('❌ Failed to update badge count:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);
      await AsyncStorage.removeItem('localNotifications');
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  }

  /**
   * Navigate based on notification
   */
  private navigateBasedOnNotification(data: any): void {
    // This will be implemented when we have navigation context
    console.log('🧭 Navigation requested for notification:', data);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default NotificationService.getInstance();

