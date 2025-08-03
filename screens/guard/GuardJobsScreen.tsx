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
  Alert,
} from 'react-native';
import { MaterialIcons, AntDesign, Ionicons, FontAwesome5 } from '@expo/vector-icons';
// @ts-ignore
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../theme';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundary from '../../components/ErrorBoundary';
import { NavigationProps } from '../../types';

interface GuardJobsScreenProps {
  navigation: NavigationProps;
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
  client_id: string;
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

const AvailableTab = ({ navigation, jobs, loading, onRefresh, onAcceptJob }: { 
  navigation: any; 
  jobs: Job[]; 
  loading: boolean;
  onRefresh: () => void;
  onAcceptJob: (jobId: string) => Promise<void>;
}) => {
  const availableJobs = jobs.filter(job => job.status === 'open');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading available jobs...</Text>
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
      {availableJobs.length > 0 ? (
        availableJobs.map(job => {
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
              onPress={() => navigation.navigate('GuardJobDetails', { job })}
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
                  <View style={styles.statusChip}>
                    <FontAwesome5 
                      name="unlock" 
                      size={10} 
                      color="white" 
                    />
                    <Text style={styles.statusText}>Available</Text>
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
                      <Text style={styles.guardsText}>{job.num_guards} guard{job.num_guards > 1 ? 's' : ''} needed</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.acceptButtonContainer}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => onAcceptJob(job.id)}
                  >
                    <LinearGradient
                      colors={["#1d4ed8", "#2563eb", "#3b82f6"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <MaterialIcons name="check" size={16} color="white" />
                      <Text style={styles.buttonText}>Accept Job</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="work-off" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Available Jobs</Text>
          <Text style={styles.emptySubtitle}>
            There are currently no security jobs available. Check back later for new opportunities.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const AcceptedTab = ({ navigation, jobs, loading, onRefresh }: { 
  navigation: any; 
  jobs: Job[]; 
  loading: boolean;
  onRefresh: () => void;
}) => {
  const acceptedJobs = jobs.filter(job => 
    job.status === 'assigned' || job.status === 'in_progress' || job.status === 'completed'
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading accepted jobs...</Text>
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
      {acceptedJobs.length > 0 ? (
        acceptedJobs.map(job => {
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
              onPress={() => navigation.navigate('GuardJobDetails', { job })}
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
                    job.status === 'assigned' ? styles.statusAssigned :
                    job.status === 'in_progress' ? styles.statusInProgress :
                    styles.statusCompleted
                  ]}>
                    <FontAwesome5 
                      name={job.status === 'assigned' ? 'shield-alt' : 
                           job.status === 'in_progress' ? 'clock' : 'check-circle'} 
                      size={10} 
                      color="white" 
                    />
                    <Text style={styles.statusText}>
                      {job.status === 'assigned' ? 'Assigned' :
                       job.status === 'in_progress' ? 'In Progress' :
                       job.status === 'completed' ? 'Completed' : job.status}
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
                      <Text style={styles.guardsText}>{job.num_guards} guard{job.num_guards > 1 ? 's' : ''} needed</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="assignment" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Accepted Jobs</Text>
          <Text style={styles.emptySubtitle}>
            You haven't accepted any jobs yet. Browse available jobs to get started.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default function GuardJobsScreen({ navigation }: GuardJobsScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingJob, setAcceptingJob] = useState<string | null>(null);

  const [routes] = useState([
    { key: 'available', title: 'Available' },
    { key: 'accepted', title: 'Accepted' },
  ]);

  const fetchJobs = async () => {
    try {
      if (!user?.id) {
        // No user ID available
        return;
      }

      // Fetch all jobs that are available or assigned to this guard
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .or(`status.eq.open,status.eq.assigned,status.eq.in_progress,status.eq.completed`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }

              // Jobs fetched successfully
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleAcceptJob = async (jobId: string) => {
    try {
      setAcceptingJob(jobId);
      
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Update the job status to assigned and add the guard
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'assigned',
          guard_id: user.id 
        })
        .eq('id', jobId);

      if (error) {
        console.error('Error accepting job:', error);
        Alert.alert('Error', 'Failed to accept job. Please try again.');
        return;
      }

      Alert.alert('Success', 'Job accepted successfully!');
      
      // Refresh the jobs list
      fetchJobs();
    } catch (error) {
      console.error('Error accepting job:', error);
      Alert.alert('Error', 'Failed to accept job. Please try again.');
    } finally {
      setAcceptingJob(null);
    }
  };

  const renderScene = ({ route }: { route: any }) => {
    switch (route.key) {
      case 'available':
        return <AvailableTab navigation={navigation} jobs={jobs} loading={loading} onRefresh={handleRefresh} onAcceptJob={handleAcceptJob} />;
      case 'accepted':
        return <AcceptedTab navigation={navigation} jobs={jobs} loading={loading} onRefresh={handleRefresh} />;
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

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width }}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.sm * 1.2 : SPACING.xl * 1.2,
    paddingBottom: SPACING.xs,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textDark,
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
    padding: SPACING.lg,
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
  // Modern Card Styles (similar to client JobsScreen)
  ultraCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    width: 24,
    height: 24,
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
    fontSize: 14,
    fontWeight: '600',
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
  acceptButtonContainer: {
    marginTop: SPACING.sm,
  },
  acceptButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    fontWeight: '700',
    letterSpacing: 0.5,
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
});