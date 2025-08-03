import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Platform, 
  ScrollView, 
  StatusBar, 
  Dimensions, 
  TouchableOpacity, 
  SafeAreaView, 
  useColorScheme,
  ActivityIndicator,
  Alert 
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay,
  withSequence,
  withRepeat,
  runOnJS 
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../theme';
import { useTabBarVisibility } from '../../../components/TabBarVisibilityContext';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardService, { DashboardJob, DashboardStats } from '../../../services/DashboardService';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorBoundary from '../../../components/ErrorBoundary';

// Types and Interfaces
interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
}

interface QuickActionButtonProps {
  icon: QuickActionIcon;
  label: string;
  color?: string;
  onPress: () => void;
}

interface Guard {
  id: string;
  name: string;
  photo: string;
  rating: number;
  experience: string;
}

interface Job {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  guards: Guard[];
  requiredGuards: number;
}

interface GuardCardProps {
  guard: Guard;
  isFirst: boolean;
}

interface JobCardProps {
  job: Job;
  navigation: NavigationProps;
}

type QuickActionIcon = 'add' | 'groups' | 'assignment' | 'alert-circle-outline' | 'attach-money';

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
const MAX_AVATARS = 2;

// Real data state
interface ClientDashboardData {
  jobs: DashboardJob[];
  stats: DashboardStats;
}

// Subcomponents
const QuickActionButton: React.FC<QuickActionButtonProps> = React.memo(({ 
  icon, 
  label, 
  color = '#e0e7ff', 
  onPress 
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const bgColor = useMemo(() => 
    color === '#e0e7ff' ? color : color + '22', 
    [color]
  );
  
  const iconColor = useMemo(() => 
    color === '#e0e7ff' ? '#2563eb' : color, 
    [color]
  );

  const iconsMap = useMemo(() => ({
    add: <MaterialCommunityIcons name="shield-plus" size={48} color={iconColor} />,
    groups: <MaterialIcons name="person-search" size={48} color={iconColor} />,
    assignment: <MaterialIcons name="assignment" size={48} color={iconColor} />,
    'alert-circle-outline': <MaterialIcons name="emergency" size={48} color={iconColor} />,
    'attach-money': <MaterialIcons name="attach-money" size={48} color={iconColor} />,
  }), [iconColor]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { 
      damping: 12, 
      stiffness: 300,
      mass: 0.8 
    });
    rotation.value = withSpring(-2, { damping: 15, stiffness: 200 });
  }, [scale, rotation]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { 
      damping: 15, 
      stiffness: 300,
      mass: 1 
    });
    rotation.value = withSpring(0, { damping: 15, stiffness: 200 });
  }, [scale, rotation]);

  const handlePress = useCallback(() => {
    // Add a subtle bounce effect on press
    scale.value = withSequence(
      withSpring(1.05, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    onPress();
  }, [scale, onPress]);

  return (
    <TouchableOpacity 
      style={styles.quickActionWrapper} 
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.quickActionButton, { backgroundColor: bgColor }, animatedStyle]}>
        {iconsMap[icon]}
      </Animated.View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
});

const GuardCard: React.FC<GuardCardProps> = React.memo(({ guard, isFirst }) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { 
      damping: 12, 
      stiffness: 300,
      mass: 0.8 
    });
    translateY.value = withSpring(-2, { damping: 15, stiffness: 200 });
  }, [scale, translateY]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { 
      damping: 15, 
      stiffness: 300,
      mass: 1 
    });
    translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
  }, [scale, translateY]);

  // Animate in on mount
  useEffect(() => {
    opacity.value = withDelay(
      isFirst ? 0 : 100 * (parseInt(guard.id.slice(1)) - 2),
      withSpring(1, { damping: 15, stiffness: 100 })
    );
    translateY.value = withDelay(
      isFirst ? 0 : 100 * (parseInt(guard.id.slice(1)) - 2),
      withSpring(0, { damping: 15, stiffness: 100 })
    );
  }, [guard.id, isFirst, opacity, translateY]);

  return (
    <TouchableOpacity 
      style={[styles.guardCard, isFirst && { marginLeft: '5%' }]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={`Guard ${guard.name}, Rating ${guard.rating}`}
    > 
      <Animated.View style={animatedStyle}>
        <Image 
          source={{ uri: guard.photo }} 
          style={styles.guardAvatar}
          accessibilityLabel={`${guard.name}'s photo`}
        />
        <Text style={styles.guardName}>{guard.name}</Text>
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color="#fbbf24" />
          <Text style={styles.guardRating}>{guard.rating}</Text>
        </View>
        <View style={styles.expBadge}>
          <Text style={styles.expText}>{guard.experience}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

const JobCard: React.FC<JobCardProps> = React.memo(({ job, navigation }) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const extra = job.guards.length - MAX_AVATARS;
  const isAssigned = job.guards.length >= job.requiredGuards;
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { 
      damping: 12, 
      stiffness: 300,
      mass: 0.8 
    });
    translateY.value = withSpring(-1, { damping: 15, stiffness: 200 });
  }, [scale, translateY]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { 
      damping: 15, 
      stiffness: 300,
      mass: 1 
    });
    translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
  }, [scale, translateY]);

  const handleTrackPress = useCallback(() => {
    // Add haptic feedback effect
    scale.value = withSequence(
      withSpring(0.95, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    navigation.navigate('TrackJob', { jobId: job.id });
  }, [navigation, job.id, scale]);

  return (
    <TouchableOpacity 
      style={styles.jobCardBlue}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={`Job ${job.title}, ${isAssigned ? 'Assigned' : 'Active'}`}
    >
      <Animated.View style={animatedStyle}>
        <View style={styles.jobHeaderBlue}>
          <Text style={styles.jobTitleBlue}>{job.title}</Text>
          <View style={styles.tagRow}>
            {isAssigned ? (
              <View style={[styles.tag, styles.tagAssignedBlue]}>
                <Feather name="check-circle" size={12} color="#2563eb" />
                <Text style={styles.tagTextBlue}>Assigned</Text>
              </View>
            ) : (
              <View style={[styles.tag, styles.tagActiveBlue]}>
                <Text style={styles.tagTextBlue}>Active</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.jobDetailRowBlue}>
          <MaterialIcons name="event" size={16} color="#dbeafe" />
          <Text style={styles.jobDetailTextBlue}>{job.date}</Text>
          <MaterialIcons name="access-time" size={16} color="#dbeafe" style={{ marginLeft: 12 }} />
          <Text style={styles.jobDetailTextBlue}>{job.time}</Text>
        </View>
        <View style={styles.jobFooterBlue}>
          <View style={styles.avatarRow}>
            {job.guards.slice(0, MAX_AVATARS).map((guard, idx) => (
              <Image
                key={guard.id}
                source={{ uri: guard.photo }}
                style={[styles.avatarSmall, { marginLeft: idx === 0 ? 0 : -12, borderColor: '#dbeafe' }]}
                accessibilityLabel={`${guard.name}'s photo`}
              />
            ))}
            {extra > 0 && (
              <View style={[styles.avatarSmall, styles.avatarExtra, { backgroundColor: '#dbeafe' }]}>
                <Text style={[styles.extraText, { color: '#2563eb' }]}>+{extra}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleTrackPress}>
            <Text style={styles.trackTextBlue}>Track</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// Main Component
export default function ClientDashboard({ navigation }: { navigation: NavigationProps }) {
  const { user } = useAuth();
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<ClientDashboardData>({
    jobs: [],
    stats: {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      totalEarnings: 0,
      averageRating: 0,
    }
  });
  const [error, setError] = useState<string | null>(null);
  
  const screenHeight = useMemo(() => Dimensions.get('window').height, []);
  const contentHeightRef = useRef(0);
  const { setIsScrolledDown } = useTabBarVisibility();
  const colorScheme = useColorScheme();

  // Animation values with better spring configurations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(50);
  const quickActionsOpacity = useSharedValue(0);
  const quickActionsTranslateY = useSharedValue(30);
  const activeJobsOpacity = useSharedValue(0);
  const activeJobsTranslateY = useSharedValue(30);
  const recommendedGuardsOpacity = useSharedValue(0);
  const recommendedGuardsTranslateY = useSharedValue(30);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await DashboardService.getClientDashboardData(user.id);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Memoized data - convert DashboardJob to Job format
  const jobs = useMemo(() => dashboardData.jobs.map(job => ({
    id: job.id,
    title: job.title,
    date: job.date,
    time: job.time,
    location: job.location,
    guards: [], // Will be populated from job_guards relationship
    requiredGuards: job.requiredGuards || 0,
  })), [dashboardData.jobs]);
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

  const handleQuickActionPress = useCallback((action: string) => {
    if (!navigation) return;
    
    switch (action) {
      case 'post-job':
        navigation.navigate('JobTemplateSelector');
        break;
      case 'find-guards':
        navigation.navigate('FindGuards');
        break;
      case 'reports':
        navigation.navigate('ClientReports');
        break;
      default:
        console.warn('Unknown quick action:', action);
    }
  }, [navigation]);

  const handleViewAllJobs = useCallback(() => {
    if (!navigation) return;
    navigation.navigate('Jobs');
  }, [navigation]);

  const handleViewAllGuards = useCallback(() => {
    if (!navigation) return;
    navigation.navigate('FindGuards');
  }, [navigation]);

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

    activeJobsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    activeJobsTranslateY.value = withDelay(400, withSpring(0, { 
      damping: ANIMATION_CONFIG.damping, 
      stiffness: ANIMATION_CONFIG.stiffness,
      mass: ANIMATION_CONFIG.mass,
    }));

    recommendedGuardsOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    recommendedGuardsTranslateY.value = withDelay(600, withSpring(0, { 
      damping: ANIMATION_CONFIG.damping, 
      stiffness: ANIMATION_CONFIG.stiffness,
      mass: ANIMATION_CONFIG.mass,
    }));
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const quickActionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: quickActionsOpacity.value,
    transform: [{ translateY: quickActionsTranslateY.value }],
  }));

  const activeJobsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: activeJobsOpacity.value,
    transform: [{ translateY: activeJobsTranslateY.value }],
  }));

  const recommendedGuardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: recommendedGuardsOpacity.value,
    transform: [{ translateY: recommendedGuardsTranslateY.value }],
  }));

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
                  <Text style={styles.headerTitle}>Foodies Truck Park</Text>
                </View>
                <View style={styles.headerIcons}>
                  <Image
                    source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                    style={styles.avatar}
                    accessibilityLabel="User avatar"
                  />
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
                  icon="add" 
                  label="Post Job" 
                  onPress={() => handleQuickActionPress('post-job')} 
                />
                <QuickActionButton 
                  icon="groups" 
                  label="Find Guards" 
                  onPress={() => handleQuickActionPress('find-guards')} 
                />
                <QuickActionButton 
                  icon="assignment" 
                  label="Reports" 
                  onPress={() => handleQuickActionPress('reports')} 
                />
              </Animated.View>

              {/* Active Jobs Section */}
              <Animated.View style={activeJobsAnimatedStyle}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>Active Jobs</Text>
                  <TouchableOpacity onPress={handleViewAllJobs}>
                    <Text style={styles.viewAllBtn}>View all</Text>
                  </TouchableOpacity>
                </View>
                {jobs.length > 0 ? (
                  <View style={styles.activeJobsListCentered}>
                    {jobs.map((job) => (
                      <JobCard key={job.id} job={job} navigation={navigation} />
                    ))}
                  </View>
                ) : (
                  <View style={styles.activeJobsPlaceholder}>
                    <MaterialIcons name="event-available" size={48} color="#a5b4fc" style={{ marginBottom: 8 }} />
                    <Text style={styles.activeJobsText}>Got an event? SwiftGuard's got you covered.</Text>
                  </View>
                )}
              </Animated.View>

              {/* Verified Guards Section */}
              <Animated.View style={recommendedGuardsAnimatedStyle}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>Verified Guards</Text>
                  <TouchableOpacity onPress={handleViewAllGuards}>
                    <Text style={styles.viewAllBtn}>View all</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.carouselContainer}>
                  <Text style={styles.emptyStateText}>
                    No verified guards available at the moment.
                  </Text>
                </View>
              </Animated.View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerWrapper: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 4,
    paddingBottom: 4,
    paddingHorizontal: '5%',
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
  },
  
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 0,
    borderColor: '#2563eb',
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
  activeJobsPlaceholder: {
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    marginHorizontal: '5%',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  activeJobsText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeJobsListCentered: {
    width: '100%',
    alignItems: 'center',
  },
  carouselContainer: {
    marginTop: 12,
    marginBottom: 48,
  },
  carouselContentNoLeft: {
    paddingLeft: '0%',
    paddingRight: '5%',
  },
  guardCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 140,
    alignItems: 'center',
    padding: 18,
    marginRight: 12,
    marginBottom: 12,
    elevation: 4,
  },
  guardAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  guardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guardRating: {
    fontSize: 14,
    marginLeft: 4,
    color: '#fbbf24',
    fontWeight: '600',
  },
  expBadge: {
    marginTop: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
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
  tagAssignedBlue: {
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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  avatarExtra: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  extraText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackTextBlue: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
    textDecorationLine: 'underline',
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: '5%',
    marginBottom: 16,
    elevation: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
  },
});
