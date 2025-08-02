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
import { supabase } from '../../supabaseClient';
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

interface GuardModeProps {
  navigation: any;
  route: {
    params: {
      job: Job;
    };
  };
}

export default function GuardMode({ navigation, route }: GuardModeProps) {
  const { job } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleScanID = () => {
    // TODO: Implement ID scanning functionality
    Alert.alert('Scan ID', 'ID scanning functionality will be implemented here');
  };

  const handleReportIncident = () => {
    navigation.navigate('ReportIncident');
  };

  const handleCheckOut = async () => {
    Alert.alert(
      'Check Out',
      'Are you sure you want to check out from this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Update job status to completed
              const { error } = await supabase
                .from('jobs')
                .update({ status: 'completed' })
                .eq('id', job.id);

              if (error) {
                console.error('Error updating job status:', error);
                Alert.alert('Error', 'Failed to check out');
                return;
              }

              Alert.alert('Success', 'Successfully checked out from job');
              navigation.navigate('GuardDashboard');
            } catch (error) {
              console.error('Error checking out:', error);
              Alert.alert('Error', 'Failed to check out');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.primary} barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guard Mode</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Job Info Card */}
          <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <View style={styles.jobTitleContainer}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <View style={styles.jobStatus}>
                  <MaterialIcons name="security" size={12} color="white" />
                  <Text style={styles.jobStatusText}>Active</Text>
                </View>
              </View>
              <View style={styles.jobPayContainer}>
                <Text style={styles.jobPay}>${job.pay}</Text>
                <Text style={styles.jobPayUnit}>/hr</Text>
              </View>
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
                  <Text style={styles.detailLabel}>Shift</Text>
                  <Text style={styles.detailText}>
                    {formatDate(job.start_time)} • {formatTime(job.start_time)} - {formatTime(job.end_time)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Current Time */}
          <View style={styles.timeCard}>
            <View style={styles.timeIcon}>
              <MaterialIcons name="access-time" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.timeContent}>
              <Text style={styles.timeLabel}>Current Time</Text>
              <Text style={styles.timeText}>
                {currentTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>
          </View>

          {/* Guard Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Guard Actions</Text>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={handleScanID}>
                <View style={styles.actionIcon}>
                  <MaterialIcons name="qr-code-scanner" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.actionTitle}>Scan ID</Text>
                <Text style={styles.actionSubtitle}>Verify attendee identity</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={handleReportIncident}>
                <View style={styles.actionIcon}>
                  <MaterialIcons name="report" size={32} color="#ef4444" />
                </View>
                <Text style={styles.actionTitle}>Report Incident</Text>
                <Text style={styles.actionSubtitle}>Log security issues</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <View style={styles.actionIcon}>
                  <MaterialIcons name="notifications" size={32} color="#f59e0b" />
                </View>
                <Text style={styles.actionTitle}>Emergency Alert</Text>
                <Text style={styles.actionSubtitle}>Send urgent notification</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <View style={styles.actionIcon}>
                  <MaterialIcons name="location-on" size={32} color="#10b981" />
                </View>
                <Text style={styles.actionTitle}>Location Update</Text>
                <Text style={styles.actionSubtitle}>Update your position</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Check Out Button */}
          <View style={styles.checkOutSection}>
            <TouchableOpacity
              style={[styles.checkOutButton, isLoading && styles.checkOutButtonDisabled]}
              onPress={handleCheckOut}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientCheckOutButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="logout" size={20} color="white" />
                    <Text style={styles.checkOutButtonText}>Check Out</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.checkOutNote}>
              This will end your shift and mark the job as completed
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.primary 
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.sm * 1.2 : SPACING.xl * 1.2,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: 'white' 
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  jobStatus: {
    backgroundColor: '#10b981',
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
  timeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  timeIcon: {
    marginRight: SPACING.md,
  },
  timeContent: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  actionsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '48%',
    alignItems: 'center',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  checkOutSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  checkOutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  checkOutButtonDisabled: {
    opacity: 0.7,
  },
  gradientCheckOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  checkOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkOutNote: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
}); 