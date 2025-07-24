import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Platform, ScrollView, StatusBar, Dimensions, TouchableOpacity, SafeAreaView, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { useTabBarVisibility } from '../../components/TabBarVisibilityContext';

// Props for QuickActionButton
interface QuickActionButtonProps {
  icon: 'add' | 'groups' | 'assignment' | 'alert-circle-outline' | 'attach-money';
  label: string;
  color?: string;
  onPress: () => void;
}

export default function ClientDashboard({ navigation }: { navigation: any }) {
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const contentHeightRef = useRef(0);
  const { setIsScrolledDown } = useTabBarVisibility();
  const handleScroll = (event: any) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setIsScrolledDown(yOffset > 50);
  };

  useEffect(() => {
    AsyncStorage.getItem('DARK_MODE').then(val => {
      setDarkMode(val === 'true');
    });
  }, []);

  // Mock data for jobs and guards
  const tempJobs: any[] = [
    {
      id: '1',
      title: 'Event Security',
      date: '2024-06-01',
      time: '20:00 - 02:00',
      location: 'Nightclub XYZ',
      guards: [
        { id: 'g1', name: 'John Doe', photo: 'https://randomuser.me/api/portraits/men/31.jpg' },
        { id: 'g2', name: 'Jane Smith', photo: 'https://randomuser.me/api/portraits/women/44.jpg' },
      ],
      requiredGuards: 2,
    },
  ];
  const recommendedGuards: any[] = [
    { name: 'Alex Turner', photo: 'https://randomuser.me/api/portraits/men/45.jpg', rating: 4.8, experience: '5 yrs' },
    { name: 'Maria Lopez', photo: 'https://randomuser.me/api/portraits/women/46.jpg', rating: 4.7, experience: '3 yrs' },
    { name: 'Sam Lee', photo: 'https://randomuser.me/api/portraits/men/47.jpg', rating: 4.9, experience: '7 yrs' },
  ];

  // Force light mode
  const colorScheme = useColorScheme();
  return (
    <>
      <StatusBar translucent backgroundColor={darkMode ? '#18181b' : '#f9fafb'} barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }}>
        <LinearGradient
          colors={darkMode ? ['#18181b', '#27272a'] : ['#ffffff', '#e0f2ff']}
          style={{ flex: 1 }}
        >
          <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            {/* Header (static) */}
            <View style={styles.headerWrapper}>
              <View style={styles.headerRow}>
                <View>
                  
                <Text style={styles.headerSubtitle}>Welcome back, </Text>
                  <Text style={styles.headerTitle}>Foodies Truck Park</Text>
                </View>
                <View style={styles.headerIcons}>
                  <Image
                    source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                    style={styles.avatar}
                  />
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
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {/* Quick Actions Title Row */}
             
              {/* Quick Actions */}
              <View style={styles.quickActionsRow}>
                <QuickActionButton icon="add" label="Post Job" onPress={() => navigation && navigation.navigate('PostJobTemplate')} />
                <QuickActionButton icon="groups" label="Find Guards" onPress={() => navigation && navigation.navigate('FindGuards')} />
                <QuickActionButton icon="assignment" label="Reports" onPress={() => navigation && navigation.navigate('ClientReports')} />
              </View>
              {/* Active Jobs Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Active Jobs</Text>
                <Text style={styles.viewAllBtn}>View all</Text>
              </View>
              {tempJobs.length > 0 ? (
                <View style={styles.activeJobsListCentered}>
                  {tempJobs.map((job) => (
                    <JobCard key={job.id} job={job} navigation={navigation} />
                  ))}
                </View>
              ) : (
                <View style={styles.activeJobsPlaceholder}>
                  <MaterialIcons name="event-available" size={48} color="#a5b4fc" style={{ marginBottom: 8 }} />
                  <Text style={styles.activeJobsText}>Got an event? SwiftGuard's got you covered.</Text>
                </View>
              )}
              {/* Verified Guards Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Verified Guards</Text>
                <Text style={styles.viewAllBtn}>View all</Text>
              </View>
              <View style={styles.carouselContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContentNoLeft}>
                  {recommendedGuards.map((guard: any, idx: number) => (
                    <GuardCard key={idx} guard={guard} isFirst={idx === 0} />
                  ))}
                </ScrollView>
              </View>

              
            </ScrollView>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}

function QuickActionButton({ icon, label, color = '#e0e7ff', onPress }: QuickActionButtonProps) {
  // Use a lighter background for colored buttons
  const bgColor = color === '#e0e7ff' ? color : color + '22'; // add alpha for ~13% opacity
  const iconColor = color === '#e0e7ff' ? '#2563eb' : color;
  const iconsMap: Record<string, React.ReactNode> = {
    add: <MaterialCommunityIcons name="shield-plus" size={48} color={iconColor} />,
    groups: <MaterialIcons name="person-search" size={48} color={iconColor} />,
    assignment: <MaterialIcons name="assignment" size={48} color={iconColor} />,
    'alert-circle-outline': <MaterialIcons name="emergency" size={48} color={iconColor} />,
    'attach-money': <MaterialIcons name="attach-money" size={48} color={iconColor} />,
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

function GuardCard({ guard, isFirst }: { guard: { name: string; photo: string; rating: number; experience: string }; isFirst: boolean }) {
  return (
    <View style={[styles.guardCard, isFirst && { marginLeft: '5%' }]}> 
      <Image source={{ uri: guard.photo }} style={styles.guardAvatar} />
      <Text style={styles.guardName}>{guard.name}</Text>
      <View style={styles.ratingRow}>
        <MaterialIcons name="star" size={14} color="#fbbf24" />
        <Text style={styles.guardRating}>{guard.rating}</Text>
      </View>
      <View style={styles.expBadge}>
        <Text style={styles.expText}>{guard.experience}</Text>
      </View>
    </View>
  );
}

function JobCard({ job, navigation }: { job: any; navigation: any }) {
  const maxAvatars = 2;
  const extra = job.guards.length - maxAvatars;
  const isAssigned = job.guards.length >= job.requiredGuards;
  return (
    <View style={styles.jobCardBlue}>
      <View style={styles.jobHeaderBlue}>
        <Text style={styles.jobTitleBlue}>{job.title}</Text>
        <View style={styles.tagRow}>
          {isAssigned ? (
            <View style={[styles.tag, styles.tagAssignedBlue]}>
              <Feather name="check-circle" size={12} color="#2563eb" />
              <Text style={styles.tagTextBlue}>Assigned</Text>
            </View>
          ) : (
            <View style={[styles.tag, styles.tagActiveBlue]}>
              <Text style={styles.tagTextBlue}>Active</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.jobDetailRowBlue}>
        <MaterialIcons name="event" size={16} color="#dbeafe" />
        <Text style={styles.jobDetailTextBlue}>{job.date}</Text>
        <MaterialIcons name="access-time" size={16} color="#dbeafe" style={{ marginLeft: 12 }} />
        <Text style={styles.jobDetailTextBlue}>{job.time}</Text>
      </View>
      <View style={styles.jobFooterBlue}>
        <View style={styles.avatarRow}>
          {job.guards.slice(0, maxAvatars).map((g: any, idx: number) => (
            <Image
              key={g.id}
              source={{ uri: g.photo }}
              style={[styles.avatarSmall, { marginLeft: idx === 0 ? 0 : -12, borderColor: '#dbeafe' }]}
            />
          ))}
          {extra > 0 && (
            <View style={[styles.avatarSmall, styles.avatarExtra, { backgroundColor: '#dbeafe' }]}>
              <Text style={[styles.extraText, { color: '#2563eb' }]}>+{extra}</Text>
            </View>
          )}
        </View>
        <Text
          style={styles.trackTextBlue}
          onPress={() => navigation.navigate('TrackJob', { jobId: job.id })}
        >
          Track
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
  
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 0,
    borderColor: '#2563eb',
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
  activeJobsPlaceholder: {
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    marginHorizontal: '5%',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  activeJobsText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeJobsListCentered: {
    width: '100%',
    alignItems: 'center',
  },
  carouselContainer: {
    marginTop: 12,
    marginBottom: 48,
  },
  carouselContentNoLeft: {
    paddingLeft: '0%',
    paddingRight: '5%',
  },
  guardCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 140,
    alignItems: 'center',
    padding: 18,
    marginRight: 12,
    marginBottom: 12,
    elevation: 4,
  },
  guardAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  guardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guardRating: {
    fontSize: 14,
    marginLeft: 4,
    color: '#fbbf24',
    fontWeight: '600',
  },
  expBadge: {
    marginTop: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
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
  tagAssignedBlue: {
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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  avatarExtra: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  extraText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackTextBlue: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
    textDecorationLine: 'underline',
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: '5%',
    marginBottom: 16,
    elevation: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
});
