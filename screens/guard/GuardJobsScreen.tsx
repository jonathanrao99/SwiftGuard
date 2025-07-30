import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
// @ts-ignore
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../theme';

interface GuardJobsScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

// Sample data for demonstration
const availableJobs = [
  {
    id: '1',
    title: 'New Year\'s Eve Club Security',
    type: 'Nightclub',
    status: 'Available',
    date: 'Dec 31, 2024',
    time: '10:00 PM - 2:00 AM',
    location: 'Club Euphoria, Downtown',
    hourlyPay: 30,
    numGuards: 2,
  },
  {
    id: '2',
    title: 'Tech Conference Security',
    type: 'Corporate',
    status: 'Available',
    date: 'Jan 15, 2025',
    time: '8:00 AM - 6:00 PM',
    location: 'TechCorp Headquarters, Midtown',
    hourlyPay: 35,
    numGuards: 3,
  },
  {
    id: '3',
    title: 'Wedding Reception Security',
    type: 'Private Event',
    status: 'Available',
    date: 'Jan 20, 2025',
    time: '6:00 PM - 12:00 AM',
    location: 'Grand Hotel Ballroom, Uptown',
    hourlyPay: 28,
    numGuards: 1,
  },
];

const acceptedJobs = [
  {
    id: '4',
    title: 'Rock Concert Security',
    type: 'Concert',
    status: 'Accepted',
    date: 'Jan 10, 2025',
    time: '7:00 PM - 11:00 PM',
    location: 'Arena Stadium, Westside',
    hourlyPay: 32,
    numGuards: 5,
  },
  {
    id: '5',
    title: 'Corporate Gala Security',
    type: 'Corporate',
    status: 'Accepted',
    date: 'Jan 25, 2025',
    time: '6:00 PM - 10:00 PM',
    location: 'Business Center, Downtown',
    hourlyPay: 40,
    numGuards: 4,
  },
];

const AvailableTab = ({ navigation }: { navigation: any }) => {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  const handleAcceptJob = async (jobId: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [jobId]: true }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, this would be:
      // const { data: { user } } = await supabase.auth.getUser();
      // const { error } = await supabase
      //   .from('job_guards')
      //   .insert([{ job_id: jobId, guard_id: user.id, status: 'accepted' }]);
      
      console.log('Job accepted successfully:', jobId);
      // You can add toast notification here
      // toast.success('Job accepted successfully!');
      
    } catch (error) {
      console.error('Error accepting job:', error);
      // toast.error('Failed to accept job. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [jobId]: false }));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      {availableJobs.length > 0 ? (
        availableJobs.map(job => (
          <View key={job.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() => navigation.navigate('GuardJobDetails', { job })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <MaterialIcons name={
                  job.type === 'Nightclub' ? 'nightlife' :
                  job.type === 'Corporate' ? 'business' :
                  'event'
                } size={20} color="#2563eb" />
                <Text style={styles.cardTitle}>{job.title}</Text>
                <View style={[styles.statusPill, styles.statusAvailable]}>
                  <Text style={[styles.statusText, styles.statusTextAvailable]}>
                    {job.status}
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <MaterialIcons name="event" size={16} color="#2563eb" />
                <Text style={styles.cardDate}>{job.date}</Text>
                <MaterialIcons name="access-time" size={16} color="#2563eb" style={{ marginLeft: 12 }} />
                <Text style={styles.cardDate}>{job.time}</Text>
              </View>

              <View style={styles.row}>
                <MaterialIcons name="location-on" size={16} color="#2563eb" />
                <Text style={styles.cardLocation}>{job.location}</Text>
              </View>

              <View style={styles.jobDetails}>
                <View style={styles.detailItem}>
                  <MaterialIcons name="attach-money" size={16} color="#2563eb" />
                  <Text style={styles.detailText}>${job.hourlyPay}/hr</Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcons name="people" size={16} color="#2563eb" />
                  <Text style={styles.detailText}>{job.numGuards} guards needed</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, loadingStates[job.id] && styles.acceptButtonLoading]}
              onPress={() => handleAcceptJob(job.id)}
              disabled={loadingStates[job.id]}
              activeOpacity={0.7}
            >
              {loadingStates[job.id] ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.acceptButtonText}>Accepting...</Text>
                </View>
              ) : (
                <Text style={styles.acceptButtonText}>Accept Job</Text>
              )}
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No available jobs found.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const AcceptedTab = ({ navigation }: { navigation: any }) => (
  <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
    {acceptedJobs.length > 0 ? (
      acceptedJobs.map(job => (
        <TouchableOpacity
          key={job.id}
          style={styles.card}
          onPress={() => navigation.navigate('GuardJobDetails', { job })}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <MaterialIcons name={
              job.type === 'Nightclub' ? 'nightlife' :
              job.type === 'Corporate' ? 'business' :
              'event'
            } size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>{job.title}</Text>
            <View style={[styles.statusPill, styles.statusAccepted]}>
              <Text style={[styles.statusText, styles.statusTextAccepted]}>
                {job.status}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <MaterialIcons name="event" size={16} color="#2563eb" />
            <Text style={styles.cardDate}>{job.date}</Text>
            <MaterialIcons name="access-time" size={16} color="#2563eb" style={{ marginLeft: 12 }} />
            <Text style={styles.cardDate}>{job.time}</Text>
          </View>

          <View style={styles.row}>
            <MaterialIcons name="location-on" size={16} color="#2563eb" />
            <Text style={styles.cardLocation}>{job.location}</Text>
          </View>

          <View style={styles.jobDetails}>
            <View style={styles.detailItem}>
              <MaterialIcons name="attach-money" size={16} color="#2563eb" />
              <Text style={styles.detailText}>${job.hourlyPay}/hr</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="people" size={16} color="#2563eb" />
              <Text style={styles.detailText}>{job.numGuards} guards needed</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))
    ) : (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No accepted jobs found.</Text>
      </View>
    )}
  </ScrollView>
);

export default function GuardJobsScreen({ navigation }: GuardJobsScreenProps) {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'available', title: 'Available' },
    { key: 'accepted', title: 'Accepted' },
  ]);

  const renderScene = SceneMap({
    available: () => <AvailableTab navigation={navigation} />,
    accepted: () => <AcceptedTab navigation={navigation} />,
  });

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.indicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor={COLORS.primary}
      inactiveColor={COLORS.textSecondary}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      <LinearGradient
        colors={['#ffffff', '#e0f2ff']}
        style={{ flex: 1 }}
      >
        {/* Header matching ClientJobsScreen styling */}
        <View style={styles.header}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>Jobs</Text>
          <View style={{ width: 24 }} />
        </View>

        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
          onIndexChange={setIndex}
          initialLayout={{ width }}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, backgroundColor: '#ffffff' },
  
  // Header styling matching ClientJobsScreen
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'android' ? SPACING.sm: SPACING.xxl,
    paddingBottom: SPACING.xs,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textDark },
  
  // Tab View styles
  tabBar: {
    backgroundColor: COLORS.white,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  indicator: {
    backgroundColor: COLORS.primary,
    height: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
  },
  
  // Content styles
  listContent: { paddingBottom: 100, paddingHorizontal: 16, paddingTop: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginLeft: 8, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardDate: { fontSize: 14, color: '#2563eb', marginLeft: 6 },
  cardLocation: { fontSize: 14, color: '#2563eb', marginLeft: 6 },
  jobDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: '#2563eb', marginLeft: 6 },
  statusPill: { borderRadius: 16, paddingVertical: 4, paddingHorizontal: 12 },
  statusAvailable: { backgroundColor: '#dbeafe' },
  statusAccepted: { backgroundColor: '#d1fae5' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusTextAvailable: { color: '#2563eb' },
  statusTextAccepted: { color: '#059669' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 16 },
  cardContent: { flex: 1 },
  acceptButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  acceptButtonLoading: {
    backgroundColor: '#9ca3af',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});