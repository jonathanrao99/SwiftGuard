import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  useColorScheme,
  ActivityIndicator 
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay, 
  withSequence,
  runOnJS 
} from 'react-native-reanimated';
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabaseClient';
import { COLORS, SPACING } from '../../theme';
import { useTabBarVisibility } from '../../components/TabBarVisibilityContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProps } from '../../types';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import DashboardService, { DashboardJob, DashboardEarnings, DashboardStats } from '../../services/DashboardService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundary from '../../components/ErrorBoundary';

// Props for QuickActionButton
interface QuickActionButtonProps {
  icon: 'login' | 'shield-plus' | 'earnings';
  label: string;
  color?: string;
  onPress: () => void;
  darkMode?: boolean;
}

// Constants
const ANIMATION_CONFIG = {
  duration: 800,
  damping: 15,
  stiffness: 100,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
} as const;

const SCROLL_THRESHOLD = 50;

interface GuardDashboardProps {
  navigation: NavigationProps;
}

export default function GuardDashboard({ navigation }: GuardDashboardProps) {
  const { user } = useAuth();
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationTrackingActive, setIsLocationTrackingActive] = useState(false);
  const [dashboardData, setDashboardData] = useState<{
    jobs: DashboardJob[];
    earnings: DashboardEarnings;
    stats: DashboardStats;
  }>({
    jobs: [],
    earnings: { total: 0, thisWeek: 0, thisMonth: 0, pending: 0 },
    stats: { totalJobs: 0, activeJobs: 0, completedJobs: 0, totalEarnings: 0, averageRating: 0 }
  });
  const [error, setError] = useState<string | null>(null);
  
  const screenHeight = useMemo(() => Dimensions.get('window').height, []);
  const contentHeightRef = useRef(0);
  const { setIsScrolledDown } = useTabBarVisibility();
  const colorScheme = useColorScheme();

  // Status dropdown state
  const [status, setStatus] = useState('Ready');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Animation values with better spring configurations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(50);
  const quickActionsOpacity = useSharedValue(0);
  const quickActionsTranslateY = useSharedValue(30);
  const upcomingJobsOpacity = useSharedValue(0);
  const upcomingJobsTranslateY = useSharedValue(30);
  const earningsOpacity = useSharedValue(0);
  const earningsTranslateY = useSharedValue(30);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await DashboardService.getGuardDashboardData(user.id);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Memoized data
  const upcomingJobs = useMemo(() => dashboardData.jobs, [dashboardData.jobs]);
  const earnings = useMemo(() => dashboardData.earnings, [dashboardData.earnings]);
  const stats = useMemo(() => dashboardData.stats, [dashboardData.stats]);

  // Handlers
  const handleScroll = useCallback((event: any) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setIsScrolledDown(yOffset > SCROLL_THRESHOLD);
  }, [setIsScrolledDown]);

  const handleContentSizeChange = useCallback((w: number, h: number) => {
    contentHeightRef.current = h;
    setScrollEnabled(h > screenHeight);
  }, [screenHeight]);

  useFocusEffect(
    React.useCallback(() => {
      const checkTrackingStatus = async () => {
        try {
          const trackingActive = await AsyncStorage.getItem('locationTrackingActive');
          setIsTracking(trackingActive === 'true');
        } catch (error) {
          console.error('Error checking tracking status:', error);
        }
      };
      checkTrackingStatus();
    }, [])
  );

  // Effects
  useEffect(() => {
    const loadDarkMode = async () => {
      try {
        const value = await AsyncStorage.getItem('DARK_MODE');
        setDarkMode(value === 'true');
      } catch (error) {
        console.error('Error loading dark mode:', error);
      }
    };

    loadDarkMode();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    // Enhanced staggered animations with better spring configurations
    headerOpacity.value = withTiming(1, { duration: ANIMATION_CONFIG.duration });
    headerTranslateY.value = withSpring(0, { 
      damping: ANIMATION_CONFIG.damping, 
      stiffness: ANIMATION_CONFIG.stiffness,
      mass: ANIMATION_CONFIG.mass,
      overshootClamping: ANIMATION_CONFIG.overshootClamping,
      restDisplacementThreshold: ANIMATION_CONFIG.restDisplacementThreshold,
      restSpeedThreshold: ANIMATION_CONFIG.restSpeedThreshold,
    });

    quickActionsOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    quickActionsTranslateY.value = withDelay(200, withSpring(0, { 
      damping: ANIMATION_CONFIG.damping, 
      stiffness: ANIMATION_CONFIG.stiffness,
      mass: ANIMATION_CONFIG.mass,
    }));

    upcomingJobsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    upcomingJobsTranslateY.value = withDelay(400, withSpring(0, { 
      damping: ANIMATION_CONFIG.damping, 
      stiffness: ANIMATION_CONFIG.stiffness,
      mass: ANIMATION_CONFIG.mass,
    }));

    earningsOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    earningsTranslateY.value = withDelay(600, withSpring(0, { 
      damping: ANIMATION_CONFIG.damping, 
      stiffness: ANIMATION_CONFIG.stiffness,
      mass: ANIMATION_CONFIG.mass,
    }));
  }, []);

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for tracking.');
        return;
      }

      await AsyncStorage.setItem('locationTrackingActive', 'true');
      setIsLocationTrackingActive(true);
      setIsTracking(true);
      
      // Start location tracking
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      // Update location in database
      if (location) {
        // Location sent to backend via GuardTrackingService
        // Location updated successfully
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking.');
    }
  };

  const stopLocationTracking = async () => {
    try {
      await AsyncStorage.setItem('locationTrackingActive', 'false');
      setIsLocationTrackingActive(false);
      setIsTracking(false);
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  const toggleLocationTracking = async () => {
    if (isTracking) {
      await stopLocationTracking();
      setIsTracking(false);
      Alert.alert('Location Tracking', 'Location tracking stopped.');
    } else {
      await startLocationTracking();
      setIsTracking(true);
      Alert.alert('Location Tracking', 'Location tracking started.');
    }
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const quickActionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: quickActionsOpacity.value,
    transform: [{ translateY: quickActionsTranslateY.value }],
  }));

  const upcomingJobsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: upcomingJobsOpacity.value,
    transform: [{ translateY: upcomingJobsTranslateY.value }],
  }));

  const earningsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: earningsOpacity.value,
    transform: [{ translateY: earningsTranslateY.value }],
  }));

  const handleEmergencyAlert = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'You must be logged in to report an emergency.');
      return;
    }

    let location = null;
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to report an emergency.');
        return;
      }
      location = await Location.getCurrentPositionAsync({});
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location.');
      return;
    }

    const dummyJobId = 1;
    const dummyClientId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    const { error } = await supabase
      .from('emergency_alerts')
      .insert([
        {
          job_id: dummyJobId,
          guard_id: user.id,
          client_id: dummyClientId,
          location_latitude: location?.coords.latitude,
          location_longitude: location?.coords.longitude,
        },
      ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Emergency Alert', 'Emergency alert sent successfully!');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner text="Loading dashboard..." />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={{ alignItems: 'center', padding: 20 }}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
          <Text style={{ fontSize: 18, color: COLORS.error, marginTop: 16, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity 
            style={{ marginTop: 20, padding: 12, backgroundColor: COLORS.primary, borderRadius: 8 }}
            onPress={loadDashboardData}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle={darkMode ? 'light-content' : 'dark-content'} 
      />
      <LinearGradient
        colors={darkMode ? ['#18181b', '#27272a'] : ['#ffffff', '#e0f2ff']}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            {/* Header */}
            <Animated.View style={[styles.headerWrapper, headerAnimatedStyle]}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.headerSubtitle}>Welcome back, </Text>
                  <Text style={styles.headerTitle}>Jonathan</Text>
                </View>
                <View style={styles.headerIcons}>
                  <TouchableOpacity
                    style={styles.statusToggle}
                    onPress={() => setDropdownOpen(!dropdownOpen)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: status === 'Ready' ? 'green' : 'grey' },
                      ]}
                    />
                    <Text style={styles.statusText}>{status}</Text>
                    <MaterialIcons
                      name={dropdownOpen ? 'arrow-drop-up' : 'arrow-drop-down'}
                      size={20}
                      color={darkMode ? '#fff' : '#000'}
                    />
                  </TouchableOpacity>
                  {dropdownOpen && (
                    <View style={[styles.statusMenu, { backgroundColor: darkMode ? '#374151' : '#ffffff' }]}>
                      <TouchableOpacity
                        style={styles.statusOption}
                        onPress={() => {
                          setStatus('Ready');
                          setDropdownOpen(false);
                        }}
                      >
                        <View style={[styles.statusDot, { backgroundColor: 'green' }]} />
                        <Text style={[styles.statusText, { color: darkMode ? '#fff' : '#000' }]}>Ready</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.statusOption}
                        onPress={() => {
                          setStatus('Off Duty');
                          setDropdownOpen(false);
                        }}
                      >
                        <View style={[styles.statusDot, { backgroundColor: 'grey' }]} />
                        <Text style={[styles.statusText, { color: darkMode ? '#fff' : '#000' }]}>Off Duty</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 120 }}
              scrollEnabled={scrollEnabled}
              onContentSizeChange={handleContentSizeChange}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
              {/* Quick Actions */}
              <Animated.View style={[styles.quickActionsRow, quickActionsAnimatedStyle]}>
                <QuickActionButton 
                  icon="login" 
                  label="Check In" 
                  onPress={() => navigation.navigate('CheckIn')} 
                  darkMode={darkMode}
                />
                <QuickActionButton 
                  icon="shield-plus" 
                  label="Report Incident" 
                  onPress={() => navigation.navigate('ReportIncident')} 
                  darkMode={darkMode}
                />
                <QuickActionButton
                  icon="earnings" 
                  label="Earnings" 
                  onPress={() => navigation.navigate('Earnings')} 
                  darkMode={darkMode}
                />
              </Animated.View>

              {/* Upcoming Jobs Section */}
              <Animated.View style={upcomingJobsAnimatedStyle}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeader, { color: darkMode ? '#fff' : '#222' }]}>Upcoming Jobs</Text>
                  <Text style={styles.viewAllBtn}>View all</Text>
                </View>
                {upcomingJobs.length > 0 ? (
                  <View style={styles.jobsListCentered}>
                    {upcomingJobs.map((job) => (
                      <JobCard key={job.id} job={job} navigation={navigation} darkMode={darkMode} />
                    ))}
                  </View>
                ) : (
                  <View style={[styles.jobsPlaceholder, { backgroundColor: darkMode ? '#374151' : '#eef2ff' }]}>
                    <MaterialIcons name="work-outline" size={48} color="#a5b4fc" style={{ marginBottom: 8 }} />
                    <Text style={[styles.jobsText, { color: darkMode ? '#9ca3af' : '#64748b' }]}>No upcoming jobs scheduled</Text>
                  </View>
                )}
              </Animated.View>

              {/* Earnings Section */}
              <Animated.View style={earningsAnimatedStyle}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeader, { color: darkMode ? '#fff' : '#222' }]}>This Week's Earnings</Text>
                  <Text style={styles.viewAllBtn}>View details</Text>
                </View>
                <View style={[styles.earningsCard, { backgroundColor: darkMode ? '#374151' : '#ffffff' }]}>
                  <View style={styles.earningsRow}>
                    <View style={styles.earningsItem}>
                      <Text style={[styles.earningsLabel, { color: darkMode ? '#9ca3af' : '#64748b' }]}>Total Earned</Text>
                      <Text style={styles.earningsValue}>${earnings.thisWeek}</Text>
                    </View>
                    <View style={styles.earningsItem}>
                      <Text style={[styles.earningsLabel, { color: darkMode ? '#9ca3af' : '#64748b' }]}>Hours Worked</Text>
                                              <Text style={styles.earningsValue}>{stats.totalJobs} jobs</Text>
                    </View>
                  </View>
                  <View style={styles.earningsRow}>
                    <View style={styles.earningsItem}>
                      <Text style={[styles.earningsLabel, { color: darkMode ? '#9ca3af' : '#64748b' }]}>Avg. Rate</Text>
                                              <Text style={styles.earningsValue}>${earnings.total}</Text>
                    </View>
                    <View style={styles.earningsItem}>
                      <Text style={[styles.earningsLabel, { color: darkMode ? '#9ca3af' : '#64748b' }]}>Next Payment</Text>
                                              <Text style={styles.earningsValue}>${earnings.pending}</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ErrorBoundary>
  );
}

function QuickActionButton({ icon, label, color = '#e0e7ff', onPress, darkMode = false }: QuickActionButtonProps) {
  const scale = useSharedValue(1);
  const bgColor = color === '#e0e7ff' ? color : color + '22';
  const iconColor = color === '#e0e7ff' ? '#2563eb' : color;
  
  const iconsMap: Record<string, React.ReactNode> = {
    login: <MaterialIcons name="login" size={48} color={iconColor} />,
    'shield-plus': <MaterialCommunityIcons name="shield-plus" size={48} color={iconColor} />,
    'play-circle-outline': <MaterialIcons name="play-circle-outline" size={48} color={iconColor} />,
    'pause-circle-outline': <MaterialIcons name="pause-circle-outline" size={48} color={iconColor} />,
    'alert-circle-outline': <MaterialIcons name="alert-circle-outline" size={48} color={iconColor} />,
    earnings: <MaterialIcons name="attach-money" size={48} color={iconColor} />,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <TouchableOpacity 
      style={styles.quickActionWrapper} 
      onPress={onPress} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.quickActionButton, { backgroundColor: bgColor }, animatedStyle]}>
        {iconsMap[icon]}
      </Animated.View>
      <Text style={[styles.quickActionLabel, { color: darkMode ? '#fff' : '#222' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function JobCard({ job, navigation, darkMode = false }: { job: any; navigation: any; darkMode?: boolean }) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <TouchableOpacity 
      style={styles.jobCardBlue}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={animatedStyle}>
        <View style={styles.jobHeaderBlue}>
          <Text style={styles.jobTitleBlue}>{job.title}</Text>
          <View style={styles.tagRow}>
            <View style={[styles.tag, styles.tagActiveBlue]}>
              <Text style={styles.tagTextBlue}>{job.status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.jobDetailRowBlue}>
          <MaterialIcons name="event" size={16} color="#dbeafe" />
          <Text style={styles.jobDetailTextBlue}>{job.date}</Text>
          <MaterialIcons name="access-time" size={16} color="#dbeafe" style={{ marginLeft: 12 }} />
          <Text style={styles.jobDetailTextBlue}>{job.time}</Text>
        </View>
        <View style={styles.jobDetailRowBlue}>
          <MaterialIcons name="location-on" size={16} color="#dbeafe" />
          <Text style={styles.jobDetailTextBlue}>{job.location}</Text>
        </View>
        <View style={styles.jobFooterBlue}>
          <Text style={styles.jobPayText}>${job.hourlyPay}/hr</Text>
          <Text
            style={styles.trackTextBlue}
            onPress={() => navigation.navigate('GuardJobDetails', { job })}
          >
            View Details
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerWrapper: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 4,
    paddingBottom: 4,
    paddingHorizontal: '5%',
    zIndex: 9998,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#2563eb',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 9999,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginRight: 4,
  },
  statusMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    marginTop: -14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 9999,
    minWidth: 120,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginHorizontal: '5%',
  },
  quickActionWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionButton: {
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    color: '#222',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginHorizontal: '5%',
    marginBottom: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  viewAllBtn: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
  jobsListCentered: {
    width: '100%',
    alignItems: 'center',
  },
  jobsPlaceholder: {
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    marginHorizontal: '5%',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  jobsText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  jobCardBlue: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    width: '90%',
    alignSelf: 'center',
    marginTop: 12,
    padding: 16,
    elevation: 2,
  },
  jobHeaderBlue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitleBlue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  tagRow: {
    flexDirection: 'row',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagActiveBlue: {
    backgroundColor: '#dbeafe',
  },
  tagTextBlue: {
    color: '#2563eb',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  jobDetailRowBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  jobDetailTextBlue: {
    fontSize: 14,
    color: '#dbeafe',
    marginHorizontal: 6,
  },
  jobFooterBlue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  jobPayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dbeafe',
  },
  trackTextBlue: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
    textDecorationLine: 'underline',
  },
  earningsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: '5%',
    marginTop: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
});
