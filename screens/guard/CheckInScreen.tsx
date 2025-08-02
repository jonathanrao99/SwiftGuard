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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING } from '../../theme';

interface Job {
  id: string;
  title: string;
  location: string;
  venue: string;
  start_time: string;
  end_time: string;
  pay: number;
  status: string;
}

interface CountdownTimer {
  hours: number;
  minutes: number;
  seconds: number;
  canEnterGuardMode: boolean;
}

export default function CheckInScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [countdownTimers, setCountdownTimers] = useState<{ [key: string]: CountdownTimer }>({});
  const [isInGuardMode, setIsInGuardMode] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    fetchAvailableJobs();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateCountdownTimers();
    }, 1000);

    return () => clearInterval(interval);
  }, [availableJobs]);

  const updateCountdownTimers = () => {
    const now = new Date().getTime();
    const newTimers: { [key: string]: CountdownTimer } = {};

    availableJobs.forEach(job => {
      const startTime = new Date(job.start_time).getTime();
      const timeDiff = startTime - now;

      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        const canEnterGuardMode = hours === 1 && minutes === 0;

        newTimers[job.id] = {
          hours,
          minutes,
          seconds,
          canEnterGuardMode
        };
      } else {
        newTimers[job.id] = {
          hours: 0,
          minutes: 0,
          seconds: 0,
          canEnterGuardMode: false
        };
      }
    });

    setCountdownTimers(newTimers);
  };

  const formatCountdown = (timer: CountdownTimer) => {
    if (timer.hours === 0 && timer.minutes === 0 && timer.seconds === 0) {
      return 'Started';
    }
    return `${timer.hours.toString().padStart(2, '0')}:${timer.minutes.toString().padStart(2, '0')}:${timer.seconds.toString().padStart(2, '0')}`;
  };

  const enterGuardMode = async (job: Job) => {
    try {
      setIsLoading(true);
      
      // Update job status to in_progress
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', job.id);

      if (error) {
        console.error('Error updating job status:', error);
        Alert.alert('Error', 'Failed to enter guard mode');
        return;
      }

      // Navigate to guard mode screen
      navigation.navigate('GuardMode', { job });
    } catch (error) {
      console.error('Error entering guard mode:', error);
      Alert.alert('Error', 'Failed to enter guard mode');
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to check in for jobs.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .or(`status.eq.open,status.eq.assigned,status.eq.in_progress,status.eq.completed`)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }

      setAvailableJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedJob) {
      Alert.alert('Error', 'Please select a job to check in.');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required for check-in.');
      return;
    }

    try {
      setIsCheckingIn(true);

      // Check if guard is already assigned to this job
      const { data: existingAssignment, error: checkError } = await supabase
        .from('job_guards')
        .select('*')
        .eq('job_id', selectedJob.id)
        .eq('guard_id', user?.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking assignment:', checkError);
        Alert.alert('Error', 'Failed to check job assignment.');
        return;
      }

      if (!existingAssignment) {
        // Assign guard to job first
        const { error: assignError } = await supabase
          .from('job_guards')
          .insert([
            {
              job_id: selectedJob.id,
              guard_id: user?.id,
              status: 'assigned',
              assigned_at: new Date().toISOString(),
            },
          ]);

        if (assignError) {
          console.error('Error assigning guard:', assignError);
          Alert.alert('Error', 'Failed to assign you to this job.');
          return;
        }
      }

      // Create check-in record
      const { error: checkInError } = await supabase
        .from('guard_checkins')
        .insert([
          {
            job_id: selectedJob.id,
            guard_id: user?.id,
            check_in_time: new Date().toISOString(),
            location_latitude: location.coords.latitude,
            location_longitude: location.coords.longitude,
            status: 'checked_in',
          },
        ]);

      if (checkInError) {
        console.error('Error checking in:', checkInError);
        Alert.alert('Error', 'Failed to check in. Please try again.');
        return;
      }

      Alert.alert(
        'Check-in Successful!',
        `You have successfully checked in for ${selectedJob.title}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('GuardDashboard'),
          },
        ]
      );
    } catch (error) {
      console.error('Error during check-in:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check In</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeIcon}>
              <MaterialIcons name="login" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Ready to Check In?</Text>
            <Text style={styles.welcomeSubtitle}>
              Select a job and verify your location to start your shift
            </Text>
          </View>

          {/* Location Status */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Location Status</Text>
            </View>
            <View style={styles.locationCard}>
              <View style={styles.locationRow}>
                <View style={[
                  styles.locationIcon,
                  { backgroundColor: locationPermission ? COLORS.primary + '15' : '#fef2f2' }
                ]}>
                  <MaterialIcons 
                    name={locationPermission ? "location-on" : "location-off"} 
                    size={24} 
                    color={locationPermission ? COLORS.primary : "#ef4444"} 
                  />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationStatus}>
                    {locationPermission ? 'Location Access Granted' : 'Location Access Required'}
                  </Text>
                  <Text style={styles.locationSubtext}>
                    {locationPermission 
                      ? 'Your location will be used for check-in verification'
                      : 'Please enable location access to continue'
                    }
                  </Text>
                </View>
              </View>
              {!locationPermission && (
                <TouchableOpacity 
                  style={styles.permissionButton}
                  onPress={requestLocationPermission}
                >
                  <MaterialIcons name="settings" size={16} color="white" />
                  <Text style={styles.permissionButtonText}>Enable Location</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Available Jobs */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="work" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Jobs</Text>
              {availableJobs.length > 0 && (
                <Text style={styles.jobCount}>{availableJobs.length} job{availableJobs.length !== 1 ? 's' : ''} available</Text>
              )}
            </View>
            
            {availableJobs.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <MaterialIcons name="work-outline" size={48} color="#a5b4fc" />
                </View>
                <Text style={styles.emptyStateText}>No available jobs at the moment</Text>
                <Text style={styles.emptyStateSubtext}>
                  Check back later for new opportunities
                </Text>
                <TouchableOpacity style={styles.refreshButton}>
                  <MaterialIcons name="refresh" size={16} color={COLORS.primary} />
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.jobsContainer}>
                {availableJobs.map((job) => {
                  const timer = countdownTimers[job.id];
                  const canEnterGuardMode = timer?.canEnterGuardMode || false;
                  
                  return (
                    <TouchableOpacity
                      key={job.id}
                      style={[
                        styles.jobCard,
                        selectedJob?.id === job.id && styles.jobCardSelected
                      ]}
                      onPress={() => setSelectedJob(job)}
                    >
                      <View style={styles.jobHeader}>
                        <View style={styles.jobTitleContainer}>
                          <Text style={styles.jobTitle}>{job.title}</Text>
                          <View style={[
                            styles.jobStatus,
                            job.status === 'assigned' ? styles.statusAssigned :
                            job.status === 'in_progress' ? styles.statusInProgress :
                            job.status === 'completed' ? styles.statusCompleted :
                            styles.statusOpen
                          ]}>
                            <MaterialIcons 
                              name={
                                job.status === 'assigned' ? 'security' :
                                job.status === 'in_progress' ? 'schedule' :
                                job.status === 'completed' ? 'check-circle' :
                                'work'
                              } 
                              size={12} 
                              color="white" 
                            />
                            <Text style={styles.jobStatusText}>
                              {job.status === 'assigned' ? 'Assigned' :
                               job.status === 'in_progress' ? 'In Progress' :
                               job.status === 'completed' ? 'Completed' :
                               'Open'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.jobPayContainer}>
                          <Text style={styles.jobPay}>${job.pay}</Text>
                          <Text style={styles.jobPayUnit}>/hr</Text>
                        </View>
                      </View>
                      
                      {/* Countdown Timer */}
                      <View style={styles.countdownContainer}>
                        <View style={styles.countdownIcon}>
                          <MaterialIcons name="access-time" size={16} color={COLORS.primary} />
                        </View>
                        <View style={styles.countdownContent}>
                          <Text style={styles.countdownLabel}>Time Until Start</Text>
                          <Text style={[
                            styles.countdownText,
                            timer?.hours === 1 && timer?.minutes === 0 ? styles.countdownReady : null
                          ]}>
                            {timer ? formatCountdown(timer) : 'Loading...'}
                          </Text>
                        </View>
                        {canEnterGuardMode && (
                          <TouchableOpacity
                            style={styles.guardModeButton}
                            onPress={() => enterGuardMode(job)}
                            disabled={isLoading}
                          >
                            <LinearGradient
                              colors={["#10b981", "#059669"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.gradientGuardButton}
                            >
                              <MaterialIcons name="security" size={16} color="white" />
                              <Text style={styles.guardModeButtonText}>Enter Guard Mode</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      <View style={styles.jobDetails}>
                        <View style={styles.jobDetailRow}>
                          <View style={styles.detailIcon}>
                            <MaterialIcons name="location-on" size={16} color={COLORS.primary} />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Location</Text>
                            <Text style={styles.detailText}>{job.venue}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.jobDetailRow}>
                          <View style={styles.detailIcon}>
                            <MaterialIcons name="event" size={16} color={COLORS.primary} />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Date & Time</Text>
                            <Text style={styles.detailText}>
                              {formatDate(job.start_time)} • {formatTime(job.start_time)} - {formatTime(job.end_time)}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.jobDetailRow}>
                          <View style={styles.detailIcon}>
                            <MaterialIcons name="access-time" size={16} color={COLORS.primary} />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Duration</Text>
                            <Text style={styles.detailText}>
                              {Math.round((new Date(job.end_time).getTime() - new Date(job.start_time).getTime()) / (1000 * 60 * 60))} hours
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {selectedJob?.id === job.id && (
                        <View style={styles.selectedIndicator}>
                          <View style={styles.selectedIcon}>
                            <Ionicons name="checkmark-circle" size={20} color="white" />
                          </View>
                          <Text style={styles.selectedText}>Selected for Check-in</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

            {/* Check-in Button */}
            {selectedJob && locationPermission && (
              <View style={styles.checkInSection}>
                <TouchableOpacity
                  style={[styles.checkInButton, isCheckingIn && styles.checkInButtonDisabled]}
                  onPress={handleCheckIn}
                  disabled={isCheckingIn}
                >
                  <LinearGradient
                    colors={["#2563eb", "#6366f1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    {isCheckingIn ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <MaterialIcons name="login" size={20} color="white" />
                        <Text style={styles.checkInButtonText}>Check In</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.checkInNote}>
                  You'll be checked in for {selectedJob.title} at {selectedJob.venue}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  headerTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textDark },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginLeft: 8,
  },
  jobCount: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 'auto',
  },
  locationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  locationSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  jobCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primary + '05',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  jobPayContainer: {
    alignItems: 'flex-end',
  },
  jobPay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  jobPayUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  jobDetails: {
    gap: SPACING.md,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  jobDetailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.sm,
    borderRadius: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  checkInSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  checkInButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  checkInButtonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  checkInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkInNote: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  jobsContainer: {
    gap: 12,
  },
  jobStatus: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  statusAssigned: {
    backgroundColor: '#2563eb',
  },
  statusInProgress: {
    backgroundColor: '#10b981',
  },
  statusCompleted: {
    backgroundColor: '#4f46e5',
  },
  statusOpen: {
    backgroundColor: '#f59e0b',
  },
  detailIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  selectedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primary + '05',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '10',
  },
  countdownIcon: {
    marginRight: SPACING.sm,
  },
  countdownContent: {
    flex: 1,
  },
  countdownLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  countdownReady: {
    color: '#10b981',
  },
  guardModeButton: {
    marginTop: SPACING.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradientGuardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  guardModeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 