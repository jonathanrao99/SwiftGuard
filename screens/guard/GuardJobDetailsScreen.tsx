// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { MaterialIcons, Feather, Entypo, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../theme';

interface GuardJobDetailsScreenProps {
  route: {
    params: {
      job: any;
    };
  };
  navigation: any;
}

export default function GuardJobDetailsScreen({ route, navigation }: GuardJobDetailsScreenProps) {
  const { job: originalJob } = route.params;

  // Add sample data to fill in missing fields for demonstration
  const job = {
    ...originalJob,
    title: originalJob.title || 'New Year\'s Eve Club Security',
    hourlyPay: originalJob.hourlyPay || originalJob.pay || '30',
    numGuards: originalJob.numGuards || originalJob.num_guards || 2,
    requirements: originalJob.requirements || ['Licensed Security Guard', 'First Aid Certified'],
    specialInstructions: originalJob.specialInstructions || 'Experience with crowd control and alcohol-related incidents preferred. Professional appearance required.',
    managerName: originalJob.managerName || 'John Smith',
    managerPhone: originalJob.managerPhone || '(555) 123-4567',
    managerEmail: originalJob.managerEmail || 'john.smith@venue.com',
    guestCount: originalJob.guestCount || 500,
    venueType: originalJob.venueType || 'Nightclub',
    recurringMode: originalJob.recurringMode || 'One-time',
    startDate: originalJob.startDate || originalJob.start_date || '2024-01-15',
    startTime: originalJob.startTime || originalJob.start_time || '22:00',
    endTime: originalJob.endTime || originalJob.end_time || '02:00',
    duration: originalJob.duration || 4,
    location: originalJob.location || '123 Main Street, Downtown',
    venue: originalJob.venue || 'Club Euphoria',
    status: originalJob.status || 'open',
  };

  const [menuVisible, setMenuVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

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

  const currentStep = getCurrentJobStep();
  const jobSteps = ['Posted', 'Assigned', 'In Progress', 'Completed'];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
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
                  size={20} 
                  color={currentStep > index ? COLORS.primary : '#d1d5db'} 
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
                // Handle any guard-specific actions
              }}>
              <MaterialIcons name="info" size={18} color={COLORS.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Job Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                hideMenu();
                // Handle contact client
              }}>
              <MaterialIcons name="phone" size={18} color={COLORS.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Contact Client</Text>
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
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#64748b" />
                <Text style={styles.locationText}>{job.location}</Text>
              </View>
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
          {job.status === 'open' && (
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                // Handle accept job logic
                navigation.goBack();
              }}
            >
              <Text style={styles.acceptButtonText}>Accept Job</Text>
            </TouchableOpacity>
          )}

          {job.status === 'assigned' && (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => {
                // Handle start job logic
                navigation.goBack();
              }}
            >
              <Text style={styles.trackButtonText}>Start Job</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.sm * 1.2 : SPACING.xl * 1.2,
    paddingBottom: SPACING.xs,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
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
    top: 12,
    left: '55%',
    right: '-55%',
    height: 28,
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
    marginRight: SPACING.sm,
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
  },
  locationText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
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
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
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
  acceptButton: {
    backgroundColor: '#2563eb',
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
  acceptButtonText: {
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