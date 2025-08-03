import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../../theme';
import { NavigationProps } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay
} from 'react-native-reanimated';

interface AccountScreenProps {
  navigation: NavigationProps;
}

export default function AccountScreen({ navigation }: AccountScreenProps) {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const menuItemsOpacity = useSharedValue(0);
  const menuItemsTranslateY = useSharedValue(30);

  useEffect(() => {
    // Start animations when component mounts
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    contentTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
    
    menuItemsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    menuItemsTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Implement account deletion logic
            Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
          }
        },
      ]
    );
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const menuItemsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuItemsOpacity.value,
    transform: [{ translateY: menuItemsTranslateY.value }],
  }));

  const notificationCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuItemsOpacity.value,
    transform: [{ translateY: menuItemsTranslateY.value }],
  }));

  const menuItems = [
    {
      title: 'Notifications',
      icon: 'notifications',
      type: 'toggle',
      value: notifications,
      onPress: () => setNotifications(!notifications),
    },
    {
      title: 'Email Notifications',
      icon: 'email',
      type: 'toggle',
      value: emailNotifications,
      onPress: () => setEmailNotifications(!emailNotifications),
    },
    {
      title: 'Change Password',
      icon: 'lock',
      type: 'navigate',
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      title: 'Privacy Policy',
      icon: 'privacy-tip',
      type: 'navigate',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
    {
      title: 'Terms of Service',
      icon: 'description',
      type: 'navigate',
      onPress: () => navigation.navigate('TermsOfService'),
    },
    {
      title: 'Delete Account',
      icon: 'delete-forever',
      type: 'action',
      onPress: handleDeleteAccount,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          {/* Account Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Email</Text>
                <Text style={styles.accountValue}>{user?.email}</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Member Since</Text>
                <Text style={styles.accountValue}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Notification Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
            
            {/* Notifications Card */}
            <Animated.View style={[styles.notificationCard, notificationCardAnimatedStyle]}>
              <View style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <MaterialIcons name="notifications" size={20} color={COLORS.primary} />
                  <View style={styles.notificationText}>
                    <Text style={styles.notificationTitle}>Push Notifications</Text>
                    <Text style={styles.notificationSubtitle}>Receive push notifications for job updates</Text>
                  </View>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={() => setNotifications(!notifications)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>
            </Animated.View>

            {/* Email Notifications Card */}
            <Animated.View style={[styles.notificationCard, notificationCardAnimatedStyle]}>
              <View style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <MaterialIcons name="email" size={20} color={COLORS.primary} />
                  <View style={styles.notificationText}>
                    <Text style={styles.notificationTitle}>Email Notifications</Text>
                    <Text style={styles.notificationSubtitle}>Receive email updates about your jobs</Text>
                  </View>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={() => setEmailNotifications(!emailNotifications)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>
            </Animated.View>
          </View>

          {/* Other Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Settings</Text>
            
            <TouchableOpacity style={styles.plainMenuItem} onPress={() => navigation.navigate('ChangePassword')}>
              <MaterialIcons name="lock" size={20} color={COLORS.primary} />
              <Text style={styles.plainMenuItemText}>Change Password</Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.plainMenuItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
              <MaterialIcons name="privacy-tip" size={20} color={COLORS.primary} />
              <Text style={styles.plainMenuItemText}>Privacy Policy</Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.plainMenuItem} onPress={() => navigation.navigate('TermsOfService')}>
              <MaterialIcons name="description" size={20} color={COLORS.primary} />
              <Text style={styles.plainMenuItemText}>Terms of Service</Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.plainMenuItemDestructive} onPress={handleDeleteAccount}>
              <MaterialIcons name="delete-forever" size={20} color={COLORS.error} />
              <Text style={styles.plainMenuItemTextDestructive}>Delete Account</Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>

          {/* Sign Out Section */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <MaterialIcons name="logout" size={20} color={COLORS.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  container: { 
    flex: 1, 
    backgroundColor: COLORS.backgroundLight 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.sm * 1.2 : SPACING.xl * 1.2,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: COLORS.textDark 
  },
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  accountLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  accountCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemDestructive: {
    borderWidth: 1,
    borderColor: COLORS.errorLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  menuItemTextDestructive: {
    color: COLORS.error,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
  // Notification card styles
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Plain menu item styles
  plainMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  plainMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
    flex: 1,
  },
  plainMenuItemDestructive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  plainMenuItemTextDestructive: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.error,
    marginLeft: SPACING.md,
    flex: 1,
  },
}); 