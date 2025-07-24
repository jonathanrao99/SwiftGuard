// @ts-nocheck
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
  Alert,
  RefreshControl
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
// @ts-ignore
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabaseClient';
import { COLORS, SPACING } from '../../theme';
import { toast } from 'sonner-native';

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

const upcomingJobs = [
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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleAcceptJob = async (jobId: string) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, this would be:
      // const { data: { user } } = await supabase.auth.getUser();
      // const { error } = await supabase
      //   .from('job_guards')
      //   .insert([{ job_id: jobId, guard_id: user.id, status: 'accepted' }]);
      
      toast.success('Job accepted successfully!');
      // Refresh the list
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 500);
    } catch (error) {
      console.error('Error accepting job:', error);
      toast.error('Failed to accept job');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.listContent} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {availableJobs.length > 0 ? (
        availableJobs.map(job => (
          <View key={job.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <MaterialIcons name={
                  job.type === 'Nightclub' ? 'nightlife' :
                  job.type === 'Corporate' ? 'business' :
                  job.type === 'Private Event' ? 'event' :
                  'security'
                } size={20} color="#2563eb" />
                <Text style={styles.cardTitle}>{job.title}</Text>
              </View>
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

            <View style={styles.row}>
              <MaterialIcons name="attach-money" size={16} color="#2563eb" />
              <Text style={styles.cardPay}>${job.hourlyPay}/hr</Text>
              <MaterialIcons name="group" size={16} color="#2563eb" style={{ marginLeft: 12 }} />
              <Text style={styles.cardGuards}>{job.numGuards} guard{job.numGuards > 1 ? 's' : ''} needed</Text>
            </View>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptJob(job.id)}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.acceptButtonText}>Accept Job</Text>
              )}
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="work-outline" size={48} color="#a5b4fc" />
          <Text style={styles.emptyText}>No available jobs found.</Text>
          <Text style={styles.emptySubtext}>Check back later for new opportunities!</Text>
        </View>
      )}
    </ScrollView>
  );
};

const UpcomingTab = ({ navigation }: { navigation: any }) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.listContent} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {upcomingJobs.length > 0 ? (
        upcomingJobs.map(job => (
          <TouchableOpacity
            key={job.id}
            style={styles.card}
            onPress={() => navigation.navigate('GuardJobDetails', { job })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <MaterialIcons name={
                  job.type === 'Nightclub' ? 'nightlife' :
                  job.type === 'Corporate' ? 'business' :
                  job.type === 'Private Event' ? 'event' :
                  'security'
                } size={20} color="#2563eb" />
                <Text style={styles.cardTitle}>{job.title}</Text>
              </View>
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

            <View style={styles.row}>
              <MaterialIcons name="attach-money" size={16} color="#2563eb" />
              <Text style={styles.cardPay}>${job.hourlyPay}/hr</Text>
              <MaterialIcons name="group" size={16} color="#2563eb" style={{ marginLeft: 12 }} />
              <Text style={styles.cardGuards}>{job.numGuards} guard{job.numGuards > 1 ? 's' : ''} assigned</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="schedule" size={48} color="#a5b4fc" />
          <Text style={styles.emptyText}>No upcoming jobs found.</Text>
          <Text style={styles.emptySubtext}>Accept jobs from the Available tab to see them here.</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default function GuardJobsScreen({ navigation }: GuardJobsScreenProps) {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'available', title: 'Available' },
    { key: 'upcoming', title: 'Upcoming' },
  ]);

  const renderScene = SceneMap({
    available: () => <AvailableTab navigation={navigation} />,
    upcoming: () => <UpcomingTab navigation={navigation} />,
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
        {/* Header matching client Jobs screen styling */}
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
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 0,
    shadowOpacity: 0,
  },
  indicator: {
    backgroundColor: COLORS.primary,
    height: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: { 
    paddingBottom: 100, 
    paddingHorizontal: 16, 
    paddingTop: 16 
  },
  card: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 10, 
    shadowColor: '#000', 
    shadowOpacity: 0.06, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 2 }, 
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardHeader: {
    marginBottom: 8
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  titleContainer: {
    flex: 1
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#111827',
    marginBottom: 2,
    lineHeight: 18
  },
  typePill: { 
    backgroundColor: '#dbeafe', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  typePillText: { 
    color: '#2563eb', 
    fontSize: 11, 
    fontWeight: '600' 
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusAvailable: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  statusAccepted: {
    backgroundColor: '#e0f2fe',
    color: '#1d4ed8',
  },
  statusTextAvailable: {
    color: '#059669',
  },
  statusTextAccepted: {
    color: '#1d4ed8',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 4,
  },
  cardPay: {
    fontSize: 13,
    color: '#2563eb',
    marginLeft: 4,
    fontWeight: '600',
  },
  cardGuards: {
    fontSize: 13,
    color: '#2563eb',
    marginLeft: 4,
    fontWeight: '600',
  },
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
    elevation: 3
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32
  },
  emptyText: { 
    color: '#6b7280', 
    textAlign: 'center', 
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
});