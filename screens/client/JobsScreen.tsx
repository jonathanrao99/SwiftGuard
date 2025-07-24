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
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
// @ts-ignore
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../theme';

interface JobsScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

// Sample data for demonstration
const scheduledJobs = [
  {
    id: '1',
    title: 'New Year\'s Eve Club Security',
    type: 'Nightclub',
    status: 'Scheduled',
    date: 'Dec 25, 2024',
    time: '10:00 PM - 2:00 AM',
    location: 'Club Euphoria, Downtown',
  },
  {
    id: '2',
    title: 'Tech Conference Security',
    type: 'Corporate',
    status: 'Scheduled',
    date: 'Dec 28, 2024',
    time: '6:00 PM - 10:00 PM',
    location: 'TechCorp Headquarters, Midtown',
  },
];

const completedJobs = [
  {
    id: '3',
    title: 'Wedding Reception Security',
    type: 'Private Event',
    status: 'Completed',
    date: 'Dec 20, 2024',
    time: '8:00 PM - 12:00 AM',
    location: 'Grand Hotel Ballroom, Uptown',
  },
  {
    id: '4',
    title: 'Rock Concert Security',
    type: 'Concert',
    status: 'Completed',
    date: 'Dec 15, 2024',
    time: '7:00 PM - 11:00 PM',
    location: 'Arena Stadium, Westside',
  },
];

const ScheduledTab = ({ navigation }: { navigation: any }) => (
  <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
    {scheduledJobs.length > 0 ? (
      scheduledJobs.map(job => (
        <TouchableOpacity
          key={job.id}
          style={styles.card}
          onPress={() => navigation.navigate('JobDetails', { job })}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <MaterialIcons name={
              job.type === 'Nightclub' ? 'nightlife' :
              job.type === 'Corporate' ? 'business' :
              'event'
            } size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>{job.title}</Text>
            <View style={[styles.statusPill, styles.statusScheduled]}>
              <Text style={[styles.statusText, styles.statusTextScheduled]}>
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
        </TouchableOpacity>
      ))
    ) : (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No scheduled jobs found.</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('PostJob')}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyButtonText}>Post a Job</Text>
        </TouchableOpacity>
      </View>
    )}
  </ScrollView>
);

const CompletedTab = ({ navigation }: { navigation: any }) => (
  <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
    {completedJobs.length > 0 ? (
      completedJobs.map(job => (
        <TouchableOpacity
          key={job.id}
          style={styles.card}
          onPress={() => navigation.navigate('JobDetails', { job })}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <MaterialIcons name={
              job.type === 'Nightclub' ? 'nightlife' :
              job.type === 'Corporate' ? 'business' :
              'event'
            } size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>{job.title}</Text>
            <View style={[styles.statusPill, styles.statusCompleted]}>
              <Text style={[styles.statusText, styles.statusTextCompleted]}>
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
        </TouchableOpacity>
      ))
    ) : (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No completed jobs found.</Text>
      </View>
    )}
  </ScrollView>
);

export default function JobsScreen({ navigation }: JobsScreenProps) {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'scheduled', title: 'Scheduled' },
    { key: 'completed', title: 'Completed' },
  ]);

  const renderScene = SceneMap({
    scheduled: () => <ScheduledTab navigation={navigation} />,
    completed: () => <CompletedTab navigation={navigation} />,
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
        {/* Header matching PostJob screen styling */}
        <View style={styles.header}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>Jobs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PostJob')}>
            <AntDesign name="pluscircle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
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
  
  // Header styling matching PostJob screen
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
  statusPill: { borderRadius: 16, paddingVertical: 4, paddingHorizontal: 12 },
  statusScheduled: { backgroundColor: '#dbeafe' },
  statusCompleted: { backgroundColor: '#d1fae5' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusTextScheduled: { color: '#2563eb' },
  statusTextCompleted: { color: '#059669' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 16 },
  emptyButton: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  emptyButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '500' },
}); 