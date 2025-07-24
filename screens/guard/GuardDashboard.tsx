// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { startLocationTracking, stopLocationTracking, isLocationTrackingActive } from '../../services/LocationTrackingService';
import { supabase } from '../../supabaseClient';
import * as Location from 'expo-location';
import { COLORS } from '../../theme';

// Props for QuickActionButton
interface QuickActionButtonProps {
  icon: 'login' | 'shield-plus' | 'earnings';
  label: string;
  color?: string;
  onPress: () => void;
}

export default function GuardDashboard({ navigation }) {
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const screenHeight = Dimensions.get('window').height;
  const contentHeightRef = useRef(0);

  // Status dropdown state
  const [status, setStatus] = useState('Ready');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Mock data for upcoming jobs and earnings
  const upcomingJobs = [
    {
      id: '1',
      title: 'Nightclub Security',
      date: '2024-06-01',
      time: '22:00 - 02:00',
      location: 'Club Euphoria, Downtown',
      status: 'Scheduled',
      hourlyPay: 30,
    },
    {
      id: '2',
      title: 'Corporate Event',
      date: '2024-06-03',
      time: '18:00 - 22:00',
      location: 'Tech Conference Center',
      status: 'Scheduled',
      hourlyPay: 35,
    },
  ];

  // Earnings data
  const weeklyEarnings = {
    total: 480,
    hours: 16,
    averageRate: 30,
    nextPayment: '2024-06-07',
  };

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBackgroundColor('#f9fafb');
      StatusBar.setBarStyle('dark-content');
      const checkTrackingStatus = async () => {
        const trackingStatus = await isLocationTrackingActive();
        setIsTracking(trackingStatus);
      };
      checkTrackingStatus();
    }, [])
  );

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

  return (
    <>
      <StatusBar translucent backgroundColor="#f9fafb" barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <LinearGradient
          colors={['#ffffff', '#e0f2ff']}
          style={{ flex: 1 }}
        >
          <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            {/* Header (static) */}
            <View style={styles.headerWrapper}>
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
                      color="#000"
                    />
                  </TouchableOpacity>
                  {dropdownOpen && (
                    <View style={styles.statusMenu}>
                      <TouchableOpacity
                        style={styles.statusOption}
                        onPress={() => {
                          setStatus('Ready');
                          setDropdownOpen(false);
                        }}
                      >
                        <View style={[styles.statusDot, { backgroundColor: 'green' }]} />
                        <Text style={styles.statusText}>Ready</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.statusOption}
                        onPress={() => {
                          setStatus('Off Duty');
                          setDropdownOpen(false);
                        }}
                      >
                        <View style={[styles.statusDot, { backgroundColor: 'grey' }]} />
                        <Text style={styles.statusText}>Off Duty</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 120 }}
              scrollEnabled={scrollEnabled}
              onContentSizeChange={(w, h) => {
                contentHeightRef.current = h;
                setScrollEnabled(h > screenHeight);
              }}
            >
              {/* Quick Actions */}
              <View style={styles.quickActionsRow}>
                <QuickActionButton 
                  icon="login" 
                  label="Check In" 
                  onPress={() => Alert.alert('Check In', 'Check in functionality')} 
                />
                <QuickActionButton 
                  icon="shield-plus" 
                  label="Report Incident" 
                  onPress={() => navigation.navigate('ReportIncident')} 
                />
                <QuickActionButton
                  icon="earnings" 
                  label="Earnings" 
                  onPress={() => navigation.navigate('EarningsOverview')} 
                />
              </View>

              {/* Upcoming Jobs Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Upcoming Jobs</Text>
                <Text style={styles.viewAllBtn}>View all</Text>
              </View>
              {upcomingJobs.length > 0 ? (
                <View style={styles.jobsListCentered}>
                  {upcomingJobs.map((job) => (
                    <JobCard key={job.id} job={job} navigation={navigation} />
                  ))}
                </View>
              ) : (
                <View style={styles.jobsPlaceholder}>
                  <MaterialIcons name="work-outline" size={48} color="#a5b4fc" style={{ marginBottom: 8 }} />
                  <Text style={styles.jobsText}>No upcoming jobs scheduled</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}

function QuickActionButton({ icon, label, color = '#e0e7ff', onPress }: QuickActionButtonProps) {
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

  return (
    <TouchableOpacity style={styles.quickActionWrapper} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionButton, { backgroundColor: bgColor }]}>
        {iconsMap[icon]}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function JobCard({ job, navigation }: { job: any; navigation: any }) {
  return (
    <View style={styles.jobCardBlue}>
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
    </View>
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
    paddingTop: Platform.OS === 'android' ? 48 : 64,
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
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 1000,
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
});
