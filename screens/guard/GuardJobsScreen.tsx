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
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
// @ts-ignore
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../theme';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface GuardJobsScreenProps {
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
            year: 'numeric',
          });
          const formattedTime = `${startDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })} - ${endDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}`;

          return (
            <TouchableOpacity
              key={job.id}
              style={styles.card}
              onPress={() => navigation.navigate('GuardJobDetails', { job })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <MaterialIcons name="event" size={20} color="#2563eb" />
                <Text style={styles.cardTitle}>{job.title}</Text>
                <View style={[styles.statusPill, styles.statusAvailable]}>
                  <Text style={[styles.statusText, styles.statusTextAvailable]}>
                    Available
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <MaterialIcons name="event" size={16} color="#2563eb" />
                <Text style={styles.cardDate}>{formattedDate}</Text>
                <MaterialIcons name="access-time" size={16} color="#2563eb" style={{ marginLeft: 12 }} />
                <Text style={styles.cardDate}>{formattedTime}</Text>
              </View>

              <View style={styles.row}>
                <MaterialIcons name="location-on" size={16} color="#2563eb" />
                <Text style={styles.cardLocation}>{job.location}</Text>
              </View>

              <View style={styles.row}>
                <MaterialIcons name="attach-money" size={16} color="#2563eb" />
                <Text style={styles.cardPay}>${job.pay}/hr</Text>
                <MaterialIcons name="people" size={16} color="#2563eb" style={{ marginLeft: 12 }} />
                <Text style={styles.cardGuards}>{job.num_guards} guard{job.num_guards > 1 ? 's' : ''} needed</Text>
              </View>

              {job.manager_name && (
                <View style={styles.row}>
                  <MaterialIcons name="person" size={16} color="#2563eb" />
                  <Text style={styles.cardManager}>Manager: {job.manager_name}</Text>
                </View>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => onAcceptJob(job.id)}
                >
                  <LinearGradient
                    colors={["#059669", "#10B981"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <MaterialIcons name="check" size={16} color="white" />
                    <Text style={styles.buttonText}>Accept Job</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
            year: 'numeric',
          });
          const formattedTime = `${startDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })} - ${endDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}`;

          return (
            <TouchableOpacity
              key={job.id}
              style={styles.card}
              onPress={() => navigation.navigate('GuardJobDetails', { job })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <MaterialIcons name="event" size={20} color="#059669" />
                <Text style={styles.cardTitle}>{job.title}</Text>
                <View style={[styles.statusPill, 
                  job.status === 'assigned' ? styles.statusAssigned :
                  job.status === 'in_progress' ? styles.statusInProgress :
                  styles.statusCompleted
                ]}>
                  <Text style={[styles.statusText, 
                    job.status === 'assigned' ? styles.statusTextAssigned :
                    job.status === 'in_progress' ? styles.statusTextInProgress :
                    styles.statusTextCompleted
                  ]}>
                    {job.status === 'assigned' ? 'Assigned' :
                     job.status === 'in_progress' ? 'In Progress' :
                     job.status === 'completed' ? 'Completed' : job.status}
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <MaterialIcons name="event" size={16} color="#059669" />
                <Text style={styles.cardDate}>{formattedDate}</Text>
                <MaterialIcons name="access-time" size={16} color="#059669" style={{ marginLeft: 12 }} />
                <Text style={styles.cardDate}>{formattedTime}</Text>
              </View>

              <View style={styles.row}>
                <MaterialIcons name="location-on" size={16} color="#059669" />
                <Text style={styles.cardLocation}>{job.location}</Text>
              </View>

              <View style={styles.row}>
                <MaterialIcons name="attach-money" size={16} color="#059669" />
                <Text style={styles.cardPay}>${job.pay}/hr</Text>
                <MaterialIcons name="people" size={16} color="#059669" style={{ marginLeft: 12 }} />
                <Text style={styles.cardGuards}>{job.num_guards} guard{job.num_guards > 1 ? 's' : ''} needed</Text>
              </View>

              {job.manager_name && (
                <View style={styles.row}>
                  <MaterialIcons name="person" size={16} color="#059669" />
                  <Text style={styles.cardManager}>Manager: {job.manager_name}</Text>
                </View>
              )}
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
        console.log('No user ID available');
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

      console.log('Fetched jobs for guard:', data);
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Available Jobs</Text>
        </View>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width }}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  headerLeft: {
    flex: 1,
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    flex: 1,
    marginLeft: SPACING.xs,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: '#DBEAFE',
  },
  statusAssigned: {
    backgroundColor: '#FEF3C7',
  },
  statusInProgress: {
    backgroundColor: '#D1FAE5',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextAvailable: {
    color: '#1E40AF',
  },
  statusTextAssigned: {
    color: '#D97706',
  },
  statusTextInProgress: {
    color: '#059669',
  },
  statusTextCompleted: {
    color: '#059669',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  cardLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  cardPay: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  cardGuards: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  cardManager: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  cardActions: {
    marginTop: SPACING.md,
    alignItems: 'flex-end',
  },
  acceptButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
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