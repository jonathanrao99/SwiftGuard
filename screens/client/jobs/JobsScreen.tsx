import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, AntDesign, Ionicons, FontAwesome5 } from '@expo/vector-icons';
// @ts-ignore
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../../theme';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import TabScreenWrapper from '../../../components/TabScreenWrapper';
import { useTabFocus } from '../../../hooks/useTabFocus';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay,
  withSequence,
  runOnJS
} from 'react-native-reanimated';

interface JobsScreenProps {
  navigation: any;
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  pay: number;
  num_guards: number;
  start_time: string;
  end_time: string;
  status: string;
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  venue_type?: string;
  guest_count?: number;
  special_instructions?: string;
  recurring_mode?: string;
  recurring_days?: string[];
  start_date?: string;
  end_date?: string;
  created_at: string;
}

const { width } = Dimensions.get('window');

const ScheduledTab = ({ navigation, jobs, loading, onRefresh }: { 
  navigation: any; 
  jobs: Job[]; 
  loading: boolean;
  onRefresh: () => void;
}) => {
  const scheduledJobs = jobs.filter(job => 
    job.status === 'open' || job.status === 'assigned' || job.status === 'in_progress'
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.listContent} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      {scheduledJobs.length > 0 ? (
        scheduledJobs.map(job => {
          const startDate = new Date(job.start_time);
          const endDate = new Date(job.end_time);
          const formattedDate = startDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          const formattedTime = `${startDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })} – ${endDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}`;

          // Calculate remaining guards needed
          const assignedGuards = job.status === 'assigned' || job.status === 'in_progress' ? 1 : 0;
          const remainingGuards = job.num_guards - assignedGuards;
          const guardsText = remainingGuards > 0 
            ? `${remainingGuards} more guard${remainingGuards > 1 ? 's' : ''} needed`
            : 'All guards assigned';

          return (
            <TouchableOpacity
              key={job.id}
              style={styles.ultraCard}
              onPress={() => navigation.navigate('JobDetails', { job })}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleSection}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={14} color="#64748b" />
                      <Text style={styles.locationText} numberOfLines={1}>{job.location}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.statusChip,
                    job.status === 'open' ? styles.statusOpen :
                    job.status === 'assigned' ? styles.statusAssigned :
                    styles.statusInProgress
                  ]}>
                    <FontAwesome5 
                      name={job.status === 'open' ? 'unlock' : job.status === 'assigned' ? 'shield-alt' : 'clock'} 
                      size={10} 
                      color="white" 
                    />
                    <Text style={styles.statusText}>
                      {job.status === 'open' ? 'Open' :
                       job.status === 'assigned' ? 'Assigned' :
                       job.status === 'in_progress' ? 'In Progress' : job.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <View style={styles.infoIcon}>
                        <MaterialIcons name="event" size={16} color="#3b82f6" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Date</Text>
                        <Text style={styles.infoValue}>{formattedDate}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.infoItem}>
                      <View style={styles.infoIcon}>
                        <MaterialIcons name="access-time" size={16} color="#3b82f6" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Time</Text>
                        <Text style={styles.infoValue}>{formattedTime}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.paySection}>
                      <Text style={styles.payAmount}>${job.pay}</Text>
                      <Text style={styles.payUnit}>/hr</Text>
                    </View>
                    
                    <View style={styles.guardsSection}>
                      <FontAwesome5 name="users" size={14} color="#64748b" />
                      <Text style={styles.guardsText}>{guardsText}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="work-off" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Scheduled Jobs</Text>
          <Text style={styles.emptySubtitle}>
            You haven't posted any jobs yet. Create your first security job to get started.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('JobTemplateSelector')}
          >
            <LinearGradient
              colors={["#2563eb", "#6366f1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <MaterialIcons name="add" size={20} color="white" />
              <Text style={styles.buttonText}>Post Your First Job</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const CompletedTab = ({ navigation, jobs, loading, onRefresh }: { 
  navigation: any; 
  jobs: Job[]; 
  loading: boolean;
  onRefresh: () => void;
}) => {
  const completedJobs = jobs.filter(job => job.status === 'completed');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.listContent} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      {completedJobs.length > 0 ? (
        completedJobs.map(job => {
          const startDate = new Date(job.start_time);
          const endDate = new Date(job.end_time);
          const formattedDate = startDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          const formattedTime = `${startDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })} – ${endDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}`;

          return (
            <TouchableOpacity
              key={job.id}
              style={styles.ultraCard}
              onPress={() => navigation.navigate('JobDetails', { job })}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleSection}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={14} color="#64748b" />
                      <Text style={styles.locationText} numberOfLines={1}>{job.location}</Text>
                    </View>
                  </View>
                  <View style={styles.statusCompleted}>
                    <FontAwesome5 
                      name="check-circle" 
                      size={10} 
                      color="white" 
                    />
                    <Text style={styles.statusText}>Completed</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <View style={styles.infoIcon}>
                        <MaterialIcons name="event" size={16} color="#3b82f6" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Date</Text>
                        <Text style={styles.infoValue}>{formattedDate}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.infoItem}>
                      <View style={styles.infoIcon}>
                        <MaterialIcons name="access-time" size={16} color="#3b82f6" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Time</Text>
                        <Text style={styles.infoValue}>{formattedTime}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.paySection}>
                      <Text style={styles.payAmount}>${job.pay}</Text>
                      <Text style={styles.payUnit}>/hr</Text>
                    </View>
                    
                    <View style={styles.guardsSection}>
                      <FontAwesome5 name="users" size={14} color="#64748b" />
                      <Text style={styles.guardsText}>
                        {job.num_guards} guard{job.num_guards > 1 ? 's' : ''} assigned
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="check-circle" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Completed Jobs</Text>
          <Text style={styles.emptySubtitle}>
            Completed jobs will appear here once your security jobs are finished.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default function JobsScreen({ navigation }: JobsScreenProps) {
  const { user } = useAuth();
  const isFocused = useTabFocus();
  const [index, setIndex] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);

  const [routes] = useState([
    { key: 'scheduled', title: 'Scheduled' },
    { key: 'completed', title: 'Completed' },
  ]);

  const fetchJobs = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available');
        return;
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }

      console.log('Fetched jobs:', data);
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user?.id]);

  useEffect(() => {
    // Start animations when component mounts
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const renderScene = ({ route }: { route: any }) => {
    switch (route.key) {
      case 'scheduled':
        return <ScheduledTab navigation={navigation} jobs={jobs} loading={loading} onRefresh={handleRefresh} />;
      case 'completed':
        return <CompletedTab navigation={navigation} jobs={jobs} loading={loading} onRefresh={handleRefresh} />;
      default:
        return null;
    }
  };

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.indicator}
      style={styles.tabBar}
      labelStyle={styles.label}
      activeColor={COLORS.primary}
      inactiveColor={COLORS.textSecondary}
    />
  );

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient
        colors={['#ffffff', '#e0f2ff']}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <View style={{ width: 24 }} />
            <Text style={styles.headerTitle}>My Jobs</Text>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('JobTemplateSelector')}
            >
              <MaterialIcons name="add" size={24} color="#222" />
            </TouchableOpacity>
          </Animated.View>

          <TabScreenWrapper isFocused={isFocused}>
            <TabView
              navigationState={{ index, routes }}
              renderScene={renderScene}
              onIndexChange={setIndex}
              initialLayout={{ width }}
              renderTabBar={renderTabBar}
            />
          </TabScreenWrapper>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24, // Match Profile screen's spacing.xl (24)
    paddingTop: Platform.OS === 'android' ? 48 : 4,
    paddingBottom: 4,
    borderBottomColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerButton: {
    borderRadius: 12,
    padding: 0,
  },
  tabBar: {
    backgroundColor: COLORS.white,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  indicator: {
    backgroundColor: COLORS.primary,
    height: 3,
  },
  label: {
    fontWeight: '600',
    textTransform: 'none',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  // Premium Card Styles
  ultraCard: {
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 5,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  titleSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
    lineHeight: 18,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  statusOpen: {
    backgroundColor: '#3b82f6',
  },
  statusAssigned: {
    backgroundColor: '#f59e0b',
  },
  statusInProgress: {
    backgroundColor: '#10b981',
  },
  statusCompleted: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    gap: SPACING.md,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: SPACING.xs,
  },
  paySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: -0.5,
  },
  payUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  guardsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guardsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});