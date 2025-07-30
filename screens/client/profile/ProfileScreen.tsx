// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar, Platform, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../../theme';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay,
  withSequence,
  runOnJS
} from 'react-native-reanimated';

// Platform-aware design constants
const colors = {
  primary: '#1E40AF',
  accent: '#3B82F6',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  success: '#22C55E',
  warning: '#F97316',
  border: '#E5E7EB',
};

const typography = {
  heading: { fontSize: 24, fontWeight: '700' },
  subheading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  const userInfoOpacity = useSharedValue(0);
  const userInfoScale = useSharedValue(0.8);
  const menuItemsOpacity = useSharedValue(0);
  const menuItemsTranslateY = useSharedValue(30);
  const logoutButtonOpacity = useSharedValue(0);
  const logoutButtonScale = useSharedValue(0.9);

  useEffect(() => {
    // Start animations when component mounts
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    
    userInfoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    userInfoScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 100 }));
    
    menuItemsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    menuItemsTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 100 }));
    
    logoutButtonOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    logoutButtonScale.value = withDelay(600, withSpring(1, { damping: 15, stiffness: 100 }));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('DARK_MODE').then(val => {
      if (val === 'true') setDarkMode(true);
    });
  }, []);

  const toggleDarkMode = async () => {
    setDarkMode(prev => {
      AsyncStorage.setItem('DARK_MODE', (!prev).toString());
      return !prev;
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const userInfoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: userInfoOpacity.value,
    transform: [{ scale: userInfoScale.value }],
  }));

  const menuItemsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuItemsOpacity.value,
    transform: [{ translateY: menuItemsTranslateY.value }],
  }));

  const logoutButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoutButtonOpacity.value,
    transform: [{ scale: logoutButtonScale.value }],
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent backgroundColor="white" barStyle="dark-content" />
      
      <LinearGradient
        colors={['#ffffff', '#e0f2ff']}
        style={{ flex: 1 }}
      >
        {/* Header matching JobsScreen styling */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </Animated.View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
                    {/* User Info Section */}
          <Animated.View style={userInfoAnimatedStyle}>
            <Pressable style={styles.userInfoCard} android_ripple={{ color: colors.border }}>
              <TouchableOpacity 
                style={styles.userInfoSection} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('PersonalInfo')}
              >
                <Image 
                  source={{ uri: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?img=8' }} 
                  style={styles.avatar} 
                />
                <View style={styles.userTextContainer}>
                  <Text style={styles.userName}>{user?.user_metadata?.full_name || user?.email || 'User'}</Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                  <Text style={styles.showProfileText}>Tap to edit profile</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </Pressable>
          </Animated.View>

          <View style={styles.divider} />

          {/* General Settings Section */}
                      <Animated.View style={menuItemsAnimatedStyle}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>General</Text>
                
                <Pressable style={styles.menuItemCard} android_ripple={{ color: colors.border }}>
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => navigation.navigate('Account')}>
                    <View style={styles.menuItemLeft}>
                      <MaterialIcons name="settings" size={20} color={colors.primary} />
                      <Text style={styles.menuItemText}>Account</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </Pressable>
              </View>

          <View style={styles.divider} />

          {/* Security Services Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Security Services</Text>
            
            <Pressable style={styles.menuItemCard} android_ripple={{ color: colors.border }}>
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => navigation.navigate('MySecurityJobs')}>
                <View style={styles.menuItemLeft}>
                  <FontAwesome5 name="list-alt" size={18} color={colors.primary} />
                  <Text style={styles.menuItemText}>My Security Jobs</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </Pressable>

            <Pressable style={styles.menuItemCard} android_ripple={{ color: colors.border }}>
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => navigation.navigate('PaymentMethods')}>
                <View style={styles.menuItemLeft}>
                  <FontAwesome5 name="credit-card" size={18} color={colors.primary} />
                  <Text style={styles.menuItemText}>Payment Methods</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Support Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Support</Text>
            
            <Pressable style={styles.menuItemCard} android_ripple={{ color: colors.border }}>
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => navigation.navigate('ContactSupport')}>
                <View style={styles.menuItemLeft}>
                  <MaterialIcons name="headset-mic" size={20} color={colors.primary} />
                  <Text style={styles.menuItemText}>Contact Support</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </Pressable>
          </View>
          </Animated.View>

          <View style={styles.divider} />

          {/* Logout Button */}
          <Animated.View style={logoutButtonAnimatedStyle}>
          <Pressable style={styles.logoutButton} android_ripple={{ color: colors.primary }}>
            <TouchableOpacity style={styles.logoutButtonInner} activeOpacity={0.7} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color={colors.surface} style={{ marginRight: spacing.sm }} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: 'transparent' 
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Header styling matching JobsScreen
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'android' ? spacing.sm * 1.2 : spacing.xxl * 1.2,
    paddingBottom: spacing.xs,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: colors.textPrimary 
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: spacing.lg,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  showProfileText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sectionContainer: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    marginLeft: spacing.md,
  },
  logoutButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  logoutText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
}); 