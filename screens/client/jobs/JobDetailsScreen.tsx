import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  Modal,
  Pressable,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import { MaterialIcons, Feather, Entypo, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../supabaseClient';
import { COLORS, SPACING } from '../../../theme';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { NavigationProps } from '../../../types';

interface Job {
  id: string;
  title?: string;
  hourlyPay?: string;
  numGuards?: number;
  requirements?: string[];
  specialInstructions?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  guestCount?: number;
  venueType?: string;
  recurringMode?: string;
  startDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  location?: string;
  venue?: string;
  status?: string;
  assignedGuards?: any[];
}

interface JobDetailsScreenProps {
  route: {
    params: {
      job: Job;
    };
  };
  navigation: NavigationProps;
}

export default function JobDetailsScreen({ route, navigation }: JobDetailsScreenProps) {
  const { job: originalJob } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add sample data to fill in missing fields for demonstration
  const job = {
    ...originalJob,
    title: originalJob.title || 'New Year\'s Eve Club Security',
    hourlyPay: originalJob.hourlyPay || '30',
    numGuards: originalJob.numGuards || 2,
    requirements: originalJob.requirements || ['Licensed Security Guard', 'First Aid Certified'],
    specialInstructions: originalJob.specialInstructions || 'Experience with crowd control and alcohol-related incidents preferred. Professional appearance required.',
    managerName: originalJob.managerName || 'John Smith',
    managerPhone: originalJob.managerPhone || '(555) 123-4567',
    managerEmail: originalJob.managerEmail || 'john.smith@venue.com',
    guestCount: originalJob.guestCount || 500,
    venueType: originalJob.venueType || 'Nightclub',
    recurringMode: originalJob.recurringMode || 'One-time',
    startDate: originalJob.startDate || originalJob.date || '2024-01-15',
    startTime: originalJob.startTime || '22:00',
    endTime: originalJob.endTime || '02:00',
    duration: originalJob.duration || 4,
    location: originalJob.location || '123 Main Street, Downtown',
    venue: originalJob.venue || 'Club Euphoria',
    // Sample assigned guards data for this specific job - only accepted guards
    assignedGuards: originalJob.assignedGuards || [
      {
        id: '1',
        name: 'Mike Johnson',
        photo: null,
        rating: 4.8,
        experience: '5 years',
        status: 'accepted',
        assignedAt: '2024-01-15T10:30:00Z',
        acceptedAt: '2024-01-15T11:00:00Z',
        arrivalStatus: 'arrived',
        arrivalTime: '2024-01-15T21:45:00Z'
      },
      {
        id: '2', 
        name: 'Sarah Williams',
        photo: null,
        rating: 4.9,
        experience: '3 years',
        status: 'accepted',
        assignedAt: '2024-01-15T11:15:00Z',
        acceptedAt: '2024-01-15T11:45:00Z',
        arrivalStatus: 'en_route',
        estimatedArrival: '2024-01-15T22:00:00Z'
      }
    ]
  };

  const [reviewed, setReviewed] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [canTrackGuards, setCanTrackGuards] = useState(false);
  const [showArrivalStatus, setShowArrivalStatus] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    const checkReview = async () => {
      if (job.status === 'Completed') {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from('reviews')
              .select('id')
              .eq('job_id', job.id)
              .eq('client_id', user.id)
              .single();
            if (data) {
              setReviewed(true);
            }
          }
        } catch (error) {
          // Error checking review status
        }
      }
    };

    checkReview();
  }, [job.id, job.status]);

  useEffect(() => {
    // Check if we can track guards and show arrival status (1 hour before start time)
    const checkAvailability = () => {
      const now = new Date();
      const jobStartTime = new Date(`${job.startDate}T${job.startTime}:00`);
      const oneHourBefore = new Date(jobStartTime.getTime() - 60 * 60 * 1000);
      
      const canTrack = now >= oneHourBefore && job.status === 'assigned' && job.assignedGuards?.length > 0;
      const showArrival = now >= oneHourBefore;
      
      setCanTrackGuards(canTrack);
      setShowArrivalStatus(showArrival);
    };

    checkAvailability();
    // Check every minute
    const interval = setInterval(checkAvailability, 60000);
    
    return () => clearInterval(interval);
  }, [job.startDate, job.startTime, job.status, job.assignedGuards]);

  const showMenu = () => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideMenu = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return '#3b82f6';
      case 'assigned':
        return '#f59e0b';
      case 'in_progress':
        return '#10b981';
      case 'completed':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return '#3b82f6';
      case 'assigned':
        return '#f59e0b';
      case 'in_progress':
        return '#10b981';
      case 'completed':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'unlock';
      case 'assigned':
        return 'shield-alt';
      case 'in_progress':
        return 'clock';
      case 'completed':
        return 'check-circle';
      default:
        return 'circle';
    }
  };

  // Get current job step based on status
  const getCurrentJobStep = () => {
    switch (job.status.toLowerCase()) {
      case 'open':
        return 0;
      case 'assigned':
        return 1;
      case 'in_progress':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  // Get arrival status color
  const getArrivalStatusColor = (status: string) => {
    switch (status) {
      case 'arrived':
        return '#10b981';
      case 'en_route':
        return '#f59e0b';
      case 'delayed':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  // Get arrival status text
  const getArrivalStatusText = (status: string) => {
    switch (status) {
      case 'arrived':
        return 'Arrived';
      case 'en_route':
        return 'En Route';
      case 'delayed':
        return 'Delayed';
      default:
        return 'Pending';
    }
  };

  // Format time to AM/PM
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Open location in maps
  const openLocationInMaps = () => {
    const location = job.location;
    const encodedLocation = encodeURIComponent(location);
    
    const mapsUrl = Platform.OS === 'ios' 
      ? `http://maps.apple.com/?q=${encodedLocation}`
      : `https://maps.google.com/?q=${encodedLocation}`;
    
    Linking.canOpenURL(mapsUrl).then(supported => {
      if (supported) {
        Linking.openURL(mapsUrl);
      } else {
        // Fallback to Google Maps web
        const googleMapsUrl = `https://maps.google.com/?q=${encodedLocation}`;
        Linking.openURL(googleMapsUrl);
      }
    }).catch(err => {
      Alert.alert(
        'Error',
        'Unable to open maps. Please try again.',
        [{ text: 'OK' }]
      );
    });
  };

  // Filter only accepted guards
  const acceptedGuards = job.assignedGuards?.filter((guard: any) => 
    guard.status === 'accepted' || guard.status === 'active'
  ) || [];

  const currentStep = getCurrentJobStep();
  const jobSteps = ['Posted', 'Assigned', 'In Progress', 'Completed'];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <LoadingSpinner text="Loading job details..." />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color="#222" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Job Details</Text>
            <TouchableOpacity onPress={showMenu}>
              <Entypo name="dots-three-vertical" size={18} color="#222" />
            </TouchableOpacity>
          </View>

      {/* Job Progress Timeline */}
      <View style={styles.timelineContainer}>
        {jobSteps.map((label, index) => (
          <View key={label} style={styles.stepWrapper}>
            <View style={[styles.stepCircle, currentStep >= index && styles.stepCircleActive]}>
              {currentStep > index ? (
                <Feather name="check" size={16} color={COLORS.white} />
              ) : (
                <Text style={[styles.stepNumber, currentStep === index && styles.stepNumberActive]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.stepText, currentStep >= index && styles.stepTextActive]}>
              {label}
            </Text>
            {index < jobSteps.length - 1 && (
              <View style={styles.stepArrowContainer}>
                <View style={[styles.stepLine, currentStep > index && styles.stepLineActive]} />
                <MaterialIcons 
                  name="arrow-forward" 
                  size={22} 
                  color={currentStep > index ? COLORS.primary : '#9ca3af'} 
                  style={styles.stepArrow}
                />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Animated Menu Dropdown */}
      {menuVisible && (
        <Pressable 
          style={styles.overlay} 
          onPress={hideMenu}
        >
          <Animated.View 
            style={[
              styles.menuDropdown,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                hideMenu();
                navigation.navigate('PostJobSpecialized', { selectedTemplate: null, editMode: true, jobId: job.id });
              }}>
              <MaterialIcons name="edit" size={18} color={COLORS.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Edit Job</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                hideMenu();
                alert('Job cancelled.'); // Placeholder for cancel logic
              }}>
              <MaterialIcons name="cancel" size={18} color="#ef4444" style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: '#ef4444' }]}>Cancel Job</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderTop}>
            <View style={styles.jobHeaderInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
            </View>
            <View style={[
              styles.statusChip,
              { backgroundColor: getStatusBackground(job.status) }
            ]}>
              <FontAwesome5 
                name={getStatusIcon(job.status)} 
                size={10} 
                color="white" 
              />
              <Text style={styles.statusText}>
                {job.status === 'open' ? 'OPEN' :
                 job.status === 'assigned' ? 'ASSIGNED' :
                 job.status === 'in_progress' ? 'IN PROGRESS' :
                 job.status === 'completed' ? 'COMPLETED' : job.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.locationRow} 
            onPress={openLocationInMaps}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={16} color="#64748b" />
            <Text style={styles.locationText} numberOfLines={2}>{job.location}</Text>
            <MaterialIcons name="open-in-new" size={16} color="#64748b" style={styles.locationArrow} />
          </TouchableOpacity>
        </View>

        {/* Event Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Information</Text>
          <View style={styles.divider} />
          
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="event" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Date:</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(job.startDate)}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="access-time" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Time:</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatTime(job.startTime)} - {formatTime(job.endTime)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="schedule" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Duration:</Text>
              </View>
              <Text style={styles.infoValue}>{job.duration} hours</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="repeat" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Job Type:</Text>
              </View>
              <Text style={styles.infoValue}>{job.recurringMode}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="location-on" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Venue:</Text>
              </View>
              <Text style={styles.infoValue}>{job.venue}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="business" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Venue Type:</Text>
              </View>
              <Text style={styles.infoValue}>{job.venueType}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="people" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Guest Count:</Text>
              </View>
              <Text style={styles.infoValue}>{job.guestCount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Job Requirements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Requirements</Text>
          <View style={styles.divider} />
          
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <FontAwesome5 name="dollar-sign" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Hourly Pay:</Text>
              </View>
              <Text style={styles.infoValue}>${job.hourlyPay}/hr</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <FontAwesome5 name="users" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Guards Needed:</Text>
              </View>
              <Text style={styles.infoValue}>{job.numGuards}</Text>
            </View>
          </View>

          <View style={styles.requirementsSection}>
            <Text style={styles.subsectionTitle}>Requirements:</Text>
            <View style={styles.requirementsList}>
              {job.requirements.map((requirement: string, index: number) => (
                <View key={index} style={styles.requirementItem}>
                  <MaterialIcons name="check-circle" size={16} color="#10b981" />
                  <Text style={styles.requirementText}>{requirement}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.instructionsSection}>
            <Text style={styles.subsectionTitle}>Special Instructions</Text>
            <View style={styles.instructionsCard}>
              <MaterialIcons name="warning" size={16} color="#f59e0b" style={styles.instructionIcon} />
              <Text style={styles.instructionsText}>{job.specialInstructions}</Text>
            </View>
          </View>
        </View>

        {/* Guards Accepted Section - Only show accepted guards */}
        {acceptedGuards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guards Accepted</Text>
            <View style={styles.divider} />
            
            <View style={styles.guardsList}>
              {acceptedGuards.map((guard: any, index: number) => (
                <TouchableOpacity
                  key={guard.id || index}
                  style={styles.guardRow}
                  onPress={() => navigation.navigate('GuardProfile', { guardId: guard.id })}
                >
                  <View style={styles.guardInfo}>
                    <View style={styles.guardAvatar}>
                      {guard.photo ? (
                        <Image source={{ uri: guard.photo }} style={styles.guardImage} />
                      ) : (
                        <MaterialIcons name="person" size={20} color={COLORS.primary} />
                      )}
                    </View>
                    <View style={styles.guardDetails}>
                      <Text style={styles.guardName}>{guard.name}</Text>
                      <View style={styles.guardStats}>
                        <View style={styles.guardStat}>
                          <MaterialIcons name="star" size={14} color="#f59e0b" />
                          <Text style={styles.guardStatText}>{guard.rating}</Text>
                        </View>
                        <View style={styles.guardStat}>
                          <MaterialIcons name="work" size={14} color="#64748b" />
                          <Text style={styles.guardStatText}>{guard.experience}</Text>
                        </View>
                        <View style={styles.guardStat}>
                          <MaterialIcons name="check-circle" size={14} color="#10b981" />
                          <Text style={styles.guardStatText}>Accepted</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {showArrivalStatus && (
                    <View style={styles.guardStatus}>
                      <View style={[styles.statusDot, { backgroundColor: getArrivalStatusColor(guard.arrivalStatus) }]} />
                      <Text style={[styles.guardStatusText, { color: getArrivalStatusColor(guard.arrivalStatus) }]}>
                        {getArrivalStatusText(guard.arrivalStatus)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Contact Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.divider} />
          
          <View style={styles.contactList}>
            <View style={styles.contactItem}>
              <MaterialIcons name="person" size={16} color="#64748b" />
              <Text style={styles.contactLabel}>Contact:</Text>
              <Text style={styles.contactValue}>{job.managerName}</Text>
            </View>

            <View style={styles.contactItem}>
              <MaterialIcons name="phone" size={16} color="#64748b" />
              <Text style={styles.contactLabel}>Phone:</Text>
              <Text style={styles.contactValue}>{job.managerPhone}</Text>
            </View>

            <View style={styles.contactItem}>
              <MaterialIcons name="email" size={16} color="#64748b" />
              <Text style={styles.contactLabel}>Email:</Text>
              <Text style={styles.contactValue}>{job.managerEmail}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {job.status === 'Completed' && !reviewed && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => navigation.navigate('LeaveReview', { 
                jobId: job.id, 
                guardId: acceptedGuards?.[0]?.id 
              })}
            >
              <Text style={styles.reviewButtonText}>Leave a Review</Text>
            </TouchableOpacity>
          )}

          {canTrackGuards && (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => navigation.navigate('TrackJob', { jobId: job.id })}
            >
              <Text style={styles.trackButtonText}>Track Guards</Text>
            </TouchableOpacity>
          )}

          {job.status === 'assigned' && acceptedGuards.length > 0 && !canTrackGuards && (
            <View style={styles.trackInfo}>
              <MaterialIcons name="info" size={16} color="#64748b" />
              <Text style={styles.trackInfoText}>
                Track Guards will be available 1 hour before the job starts
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
        </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 4,
    paddingBottom: 4,
    borderBottomColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: COLORS.textDark 
  },
  // Timeline Styles
  timelineContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  stepTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  stepArrowContainer: {
    position: 'absolute',
    top: 14,
    left: '70%',
    right: '-76%',
    height: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.border,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepArrow: {
    marginLeft: 12,
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: SPACING.md,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  // Job Header
  jobHeader: {
    marginBottom: SPACING.xl,
  },
  jobHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  jobHeaderInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.primaryDark,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  locationArrow: {
    marginLeft: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  // Section Styles
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: SPACING.lg,
  },
  // Info List Styles
  infoList: {
    gap: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  // Requirements Section
  requirementsSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: SPACING.md,
  },
  requirementsList: {
    gap: SPACING.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  // Instructions Section
  instructionsSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  instructionsCard: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
  },
  instructionIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  instructionsText: {
    fontSize: 16,
    color: '#92400e',
    lineHeight: 24,
    flex: 1,
  },
  // Guards Section
  guardsList: {
    gap: SPACING.md,
  },
  guardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  guardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  guardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  guardImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  guardDetails: {
    flex: 1,
  },
  guardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  guardStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  guardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guardStatText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  guardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  guardStatusText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  // Contact Section
  contactList: {
    gap: SPACING.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    minWidth: 80,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  // Action Buttons
  actionButtons: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  reviewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  trackButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trackButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    gap: 8,
  },
  trackInfoText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  // Menu Dropdown
  menuDropdown: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 65 : 75,
    right: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  menuText: {
    fontSize: 16,
    color: COLORS.textDark,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  menuIcon: {
    marginRight: SPACING.sm,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
});