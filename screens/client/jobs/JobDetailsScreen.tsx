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
} from 'react-native';
import { MaterialIcons, Feather, Entypo } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../supabaseClient';
import { COLORS, SPACING } from '../../../theme';

interface JobDetailsScreenProps {
  route: {
    params: {
      job: any;
    };
  };
  navigation: any;
}

export default function JobDetailsScreen({ route, navigation }: JobDetailsScreenProps) {
  const { job: originalJob } = route.params;

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
    startDate: originalJob.startDate || originalJob.date,
    startTime: originalJob.startTime || '22:00',
    endTime: originalJob.endTime || '02:00',
    duration: originalJob.duration || 4,
    location: originalJob.location || '123 Main Street, Downtown',
    description: originalJob.description || 'Professional security services for high-energy nightclub environment. Must be comfortable in loud, crowded environments.',
    venue: originalJob.venue || 'Club Euphoria',
  };

  const [reviewed, setReviewed] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

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
          console.log('Error checking review status:', error);
        }
      }
    };

      checkReview();
  }, [job.id, job.status]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return '#3B82F6';
      case 'active':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return '#EFF6FF';
      case 'active':
        return '#ECFDF5';
      case 'completed':
        return '#F3F4F6';
      default:
        return '#F3F4F6';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Nightclub':
        return 'nightlife';
      case 'Corporate':
        return 'business';
      case 'Private Event':
        return 'event';
      case 'Concert':
        return 'music-note';
      case 'Bar':
        return 'local-bar';
      default:
        return 'event';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      {/* Header - Matching FindGuardsScreen */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Entypo name="dots-three-vertical" size={18} color="#222" />
        </TouchableOpacity>
      </View>

      {menuVisible && (
        <Pressable 
          style={styles.overlay} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuDropdown}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('PostJobSpecialized', { selectedTemplate: null, editMode: true, jobId: job.id });
              }}>
              <MaterialIcons name="edit" size={18} color={COLORS.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Edit Job</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                alert('Job cancelled.'); // Placeholder for cancel logic
              }}>
              <MaterialIcons name="cancel" size={18} color="red" style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: 'red' }]}>Cancel Job</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}

      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Job Header - Clean Design */}
          <View style={styles.jobHeader}>
            <View style={styles.jobHeaderTop}>
              <View style={styles.iconWrapper}>
                <MaterialIcons name={getTypeIcon(job.type)} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.jobHeaderInfo}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobType}>{job.type}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: getStatusBackgroundColor(job.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                  {job.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Event Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="event" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Event Information</Text>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <MaterialIcons name="event" size={16} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{job.date || job.startDate}</Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons name="access-time" size={16} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>
                  {job.time || `${job.startTime} - ${job.endTime}`}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons name="schedule" size={16} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{job.duration} hours</Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons name="repeat" size={16} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Job Type</Text>
                <Text style={styles.infoValue}>{job.recurringMode}</Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons name="location-on" size={16} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Venue</Text>
                <Text style={styles.infoValue}>{job.venue}</Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons name="place" size={16} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{job.location}</Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons name="business" size={16} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Venue Type</Text>
                <Text style={styles.infoValue}>{job.venueType}</Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons name="people" size={16} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Guest Count</Text>
                <Text style={styles.infoValue}>{job.guestCount.toLocaleString()}</Text>
              </View>
            </View>

            {job.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.subsectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{job.description}</Text>
              </View>
            )}
          </View>

          {/* Job Requirements Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="security" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Job Requirements</Text>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <MaterialIcons name="attach-money" size={16} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Hourly Pay</Text>
                <Text style={styles.infoValue}>${job.hourlyPay}/hr</Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons name="security" size={16} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Guards Needed</Text>
                <Text style={styles.infoValue}>{job.numGuards}</Text>
              </View>
            </View>

            <View style={styles.requirementsSection}>
              <Text style={styles.subsectionTitle}>Requirements</Text>
              <View style={styles.requirementsList}>
                {job.requirements.map((requirement: string, index: number) => (
                  <View key={index} style={styles.requirementItem}>
                    <MaterialIcons name="check-circle" size={16} color={COLORS.primary} />
                    <Text style={styles.requirementText}>{requirement}</Text>
                </View>
              ))}
              </View>
            </View>

            <View style={styles.instructionsSection}>
              <Text style={styles.subsectionTitle}>Special Instructions</Text>
              <Text style={styles.instructionsText}>{job.specialInstructions}</Text>
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="contact-phone" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>
            
            <View style={styles.contactList}>
              <View style={styles.contactItem}>
                <MaterialIcons name="person" size={20} color={COLORS.primary} style={styles.contactIcon} />
                <Text style={styles.contactLabel}>Contact:</Text>
                <Text style={styles.contactValue}>{job.managerName}</Text>
              </View>

              <View style={styles.contactItem}>
                <MaterialIcons name="phone" size={20} color={COLORS.primary} style={styles.contactIcon} />
                <Text style={styles.contactLabel}>Phone:</Text>
                <Text style={styles.contactValue}>{job.managerPhone}</Text>
              </View>

              <View style={styles.contactItem}>
                <MaterialIcons name="email" size={20} color={COLORS.primary} style={styles.contactIcon} />
                <Text style={styles.contactLabel}>Email:</Text>
                <Text style={styles.contactValue}>{job.managerEmail}</Text>
              </View>
            </View>
          </View>

          {/* Guards Section - Only show if guards are assigned */}
          {job.guards && job.guards.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="people" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Guards on Duty</Text>
              </View>
              
              <View style={styles.guardsRow}>
                {job.guards.map((guard: any, index: number) => (
                  <View key={guard.id || index} style={styles.guardItem}>
                    <View style={styles.guardAvatar}>
                      {guard.photo ? (
                        <Image source={{ uri: guard.photo }} style={styles.guardImage} />
                      ) : (
                        <MaterialIcons name="person" size={24} color={COLORS.primary} />
                      )}
                    </View>
                    <Text style={styles.guardName}>{guard.name}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.infoGrid}>
                {job.idsScanned !== undefined && (
                  <View style={styles.infoItem}>
                    <MaterialIcons name="badge" size={16} color={COLORS.primary} />
                    <Text style={styles.infoLabel}>IDs Scanned</Text>
                    <Text style={styles.infoValue}>{job.idsScanned}</Text>
                  </View>
                )}

                {job.issues && (
                  <View style={styles.infoItem}>
                    <MaterialIcons name="report-problem" size={16} color={COLORS.primary} />
                    <Text style={styles.infoLabel}>Issues</Text>
                    <Text style={styles.infoValue}>{job.issues}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {job.status === 'Completed' && !reviewed && (
            <TouchableOpacity
              style={styles.reviewButton}
                onPress={() => navigation.navigate('LeaveReview', { 
                  jobId: job.id, 
                  guardId: job.guards?.[0]?.id 
                })}
            >
              <Text style={styles.reviewButtonText}>Leave a Review</Text>
            </TouchableOpacity>
          )}

            {job.status === 'Scheduled' && job.guards && job.guards.length > 0 && (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => navigation.navigate('TrackJob', { jobId: job.id })}
            >
                <Text style={styles.trackButtonText}>Track Guards</Text>
            </TouchableOpacity>
          )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  jobHeader: {
    marginBottom: SPACING.xl,
  },
  jobHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
  },
  jobHeaderInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  jobType: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  statusPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginLeft: SPACING.sm,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  infoItem: {
    width: '48%',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  descriptionSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  requirementsSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  requirementsList: {
    // No specific styles for list, items are handled by requirementItem
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
  },
  requirementText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  instructionsSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  guardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
    justifyContent: 'space-around',
  },
  guardItem: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    minWidth: 80,
  },
  guardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  guardImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  guardName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButtons: {
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  reviewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  trackButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: COLORS.textSecondary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  menuDropdown: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 65 : 75, // Position exactly below the header
    right: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000, // Ensure it appears above other content
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 140, // Ensure minimum width for the dropdown
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  menuText: {
    fontSize: 16, // Increased font size
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
    backgroundColor: 'transparent', // Remove the dark overlay
    zIndex: 999, // Ensure it's below other content
  },
  contactList: {
    marginTop: SPACING.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  contactIcon: {
    marginRight: SPACING.sm,
  },
  contactLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
}); 