import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Platform, ScrollView, StatusBar, Dimensions, TouchableOpacity } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

// Props for QuickActionButton
interface QuickActionButtonProps {
  icon: 'add' | 'groups' | 'assignment';
  label: string;
  color?: string;
  onPress: () => void;
}

export default function ClientDashboard({ navigation }: { navigation: any }) {
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const screenHeight = Dimensions.get('window').height;
  const contentHeightRef = useRef(0);

  return (
    <View style={styles.container}>
      <StatusBar translucent={false} backgroundColor="#2563eb" barStyle="light-content" />
      {/* Header (static) */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>SwiftGuard</Text>
            <Text style={styles.headerSubtitle}>Nightclub XYZ</Text>
          </View>
          <View style={styles.headerIcons}>
            <MaterialIcons name="notifications-none" size={32} color="#fff" style={styles.bellIcon} />
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.avatar}
            />
          </View>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        scrollEnabled={scrollEnabled}
        onContentSizeChange={(w, h) => {
          contentHeightRef.current = h;
          setScrollEnabled(h > screenHeight);
        }}
      >
        {/* Quick Actions Title Row */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Quick Actions</Text>
        </View>
        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <QuickActionButton icon="add" label="Post Job" onPress={() => navigation && navigation.navigate('PostJob')} />
          <QuickActionButton icon="groups" label="Find Guards" color="#7c3aed" onPress={() => navigation && navigation.navigate('FindGuards')} />
          <QuickActionButton icon="assignment" label="Reports" color="#a21caf" onPress={() => navigation && navigation.navigate('Reports')} />
        </View>
        {/* Active Jobs Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Active Jobs</Text>
          <Text style={styles.viewAllBtn}>View all</Text>
        </View>
        {tempJobs.length > 0 ? (
          <View style={styles.activeJobsList}>
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
        {/* Recommended Guards Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Recommended Guards</Text>
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
      {/* Footer Navigation */}
      <View style={styles.footerNav}>
        <FooterNavButton icon="home" label="Home" active onPress={() => navigation.navigate('ClientDashboard')} />
        <FooterNavButton icon="search" label="Search" onPress={() => navigation.navigate('Search')} />
        <FooterNavButton icon="bar-chart" label="Analytics" type="feather" onPress={() => navigation.navigate('Analytics')} />
        <FooterNavButton icon="person" label="Profile" onPress={() => navigation.navigate('Profile')} />
      </View>
    </View>
  );
}

function QuickActionButton({ icon, label, color = '#e0e7ff', onPress }: QuickActionButtonProps) {
  // Use a lighter background for colored buttons
  const bgColor = color === '#e0e7ff' ? color : color + '22'; // add alpha for ~13% opacity
  const iconColor = color === '#e0e7ff' ? '#2563eb' : color;
  const iconsMap: Record<string, React.ReactNode> = {
    add: <MaterialCommunityIcons name="shield-plus" size={42} color={iconColor} />,  // Post Job
    groups: <MaterialIcons name="person-search" size={42} color={iconColor} />,  // Find Guards
    assignment: <MaterialIcons name="assignment" size={42} color={iconColor} />,  // Reports
  };
  return (
    <TouchableOpacity style={styles.quickActionWrapper} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionButton, { backgroundColor: bgColor }] }>
        {iconsMap[icon]}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// Props for FooterNavButton
interface FooterNavButtonProps {
  icon: string;
  label: string;
  active?: boolean;
  type?: 'feather' | 'material';
  onPress: () => void;
}

function FooterNavButton({ icon, label, active = false, type = 'material', onPress }: FooterNavButtonProps) {
  const IconComp = type === 'feather' ? require('@expo/vector-icons').Feather : MaterialIcons;
  return (
    <TouchableOpacity style={styles.footerNavBtn} onPress={onPress} activeOpacity={0.7}>
      <IconComp name={icon} size={26} color={active ? '#2563eb' : '#64748b'} />
      <Text style={[styles.footerNavLabel, active && { color: '#2563eb' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Props for RecommendedGuardAvatar
interface RecommendedGuardAvatarProps { uri: string; }
function RecommendedGuardAvatar({ uri }: RecommendedGuardAvatarProps) {
  return (
    <View style={styles.guardAvatarWrapper}>
      <Image source={{ uri }} style={styles.guardAvatar} />
    </View>
  );
}

// Props for GuardCard
interface GuardCardProps { guard: { name: string; photo: string; rating: number; experience: string; }; isFirst: boolean; }
function GuardCard({ guard, isFirst }: GuardCardProps) {
  return (
    <View style={[styles.guardCard, isFirst && { marginLeft: 24 }]}>
      <Image source={{ uri: guard.photo }} style={styles.guardCardPhoto} />
      <Text style={styles.guardCardName}>{guard.name}</Text>
      <View style={styles.guardCardRow}>
        <MaterialIcons name="star" size={16} color="#fbbf24" style={{ marginRight: 2 }} />
        <Text style={styles.guardCardRating}>{guard.rating}</Text>
      </View>
      <View style={styles.guardCardExpWrapper}>
        <Text style={styles.guardCardExp}>{guard.experience}</Text>
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
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: Platform.OS === 'android' ? 24 : 36,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#dbeafe',
    fontSize: 14,
    fontWeight: '500',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIcon: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#fff',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginHorizontal: 24,
  },
  quickActionWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionButton: {
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
    width: 86,
    height: 86,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    color: '#222',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginHorizontal: 16,
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
    marginHorizontal: 24,
    paddingVertical: 60,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 18,
  },
  activeJobsText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 260,
  },
  carouselContainer: {
    marginHorizontal: 0,
    marginTop: 12,
    marginBottom: 2,
    height: 210,
  },
  carouselContent: {
    paddingRight: 24,
  },
  carouselContentNoLeft: {
    paddingRight: 24,
  },
  guardCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 16,
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 10,
    height: 190,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  guardCardPhoto: {
    width: 78,
    height: 78,
    borderRadius: 39,
    marginBottom: 8,
  },
  guardCardName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  guardCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  guardCardRating: {
    color: '#fbbf24',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  guardCardExpWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  guardCardExp: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 13,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'center',
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'android' ? 12 : 20,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  footerNavBtn: {
    alignItems: 'center',
    flex: 1,
  },
  footerNavLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  activeJobsList: {
    marginHorizontal: 24,
    marginBottom: 12,
    marginTop: 12,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  jobCardStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22c55e',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  jobCardDate: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
    marginBottom: 2,
  },
  jobCardLocation: {
    fontSize: 13,
    color: '#64748b',
  },
  jobCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guardAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  extraAvatar: {
    backgroundColor: '#6366f1',
    borderColor: '#fff',
    marginLeft: -12,
  },
  extraAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  trackBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  trackBtnText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobTag: {
    fontSize: 12,
    fontWeight: 'bold',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: '#fff',
    overflow: 'hidden',
  },
  activeTag: {
    backgroundColor: '#22c55e',
  },
  assignedTag: {
    backgroundColor: '#2563eb',
  },
  // Styles for recommended guard avatars
  guardAvatarWrapper: { alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  guardAvatar: { width: 48, height: 48, borderRadius: 24 },
});

const recommendedGuards = [
  {
    name: 'John Carter',
    photo: 'https://randomuser.me/api/portraits/men/20.jpg',
    rating: 4.9,
    experience: 'Elite',
  },
  {
    name: 'Maria Lopez',
    photo: 'https://randomuser.me/api/portraits/women/13.jpg',
    rating: 4.8,
    experience: 'Certified',
  },
  {
    name: 'Alex Kim',
    photo: 'https://randomuser.me/api/portraits/men/14.jpg',
    rating: 4.7,
    experience: 'Entry',
  },
  {
    name: 'Priya Singh',
    photo: 'https://randomuser.me/api/portraits/women/15.jpg',
    rating: 4.9,
    experience: 'Entry',
  },
];

const tempJobs = [
  {
    id: 1,
    title: 'VIP Event Security',
    date: 'Sat, Jun 22, 9:00 PM - 2:00 AM',
    location: 'Nightclub XYZ, Downtown',
    requiredGuards: 4,
    guards: [
      { id: 1, name: 'John Carter', photo: 'https://randomuser.me/api/portraits/men/11.jpg' },
      { id: 2, name: 'Maria Lopez', photo: 'https://randomuser.me/api/portraits/women/13.jpg' },
      { id: 3, name: 'Alex Kim', photo: 'https://randomuser.me/api/portraits/men/14.jpg' },
    ],
  },
   {
    id: 2,
    title: 'VIP Event Security',
    date: 'Sat, Jun 22, 9:00 PM - 2:00 AM',
    location: 'Nightclub XYZ, Downtown',
    requiredGuards: 3,
    guards: [
      { id: 1, name: 'John Carter', photo: 'https://randomuser.me/api/portraits/men/11.jpg' },
      { id: 2, name: 'Maria Lopez', photo: 'https://randomuser.me/api/portraits/women/13.jpg' },
      { id: 3, name: 'Alex Kim', photo: 'https://randomuser.me/api/portraits/men/14.jpg' },
    ],
  },
];

function JobCard({ job, navigation }: { job: any; navigation: any }) {
  const maxAvatars = 2;
  const extraCount = job.guards.length - maxAvatars;
  const isAssigned = job.guards.length >= job.requiredGuards;
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobCardHeader}>
        <Text style={styles.jobCardTitle}>{job.title}</Text>
        <View style={styles.tagsRow}>
          {isAssigned ? (
            <View style={[styles.jobTag, styles.assignedTag, { flexDirection: 'row', alignItems: 'center' }]}> 
              <Feather name="check-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Assigned</Text>
            </View>
          ) : (
            <Text style={[styles.jobTag, styles.activeTag]}>Active</Text>
          )}
        </View>
      </View>
      <Text style={styles.jobCardDate}>{job.date}</Text>
      <Text style={styles.jobCardLocation}>{job.location}</Text>
      <View style={styles.jobCardFooter}>
        <View style={styles.avatarsRow}>
          {job.guards.slice(0, maxAvatars).map((guard: any, idx: number) => (
            <Image
              key={guard.id}
              source={{ uri: guard.photo }}
              style={[styles.guardAvatarSmall, { marginLeft: idx === 0 ? 0 : -12 }]}
            />
          ))}
          {extraCount > 0 && (
            <View style={[styles.guardAvatarSmall, styles.extraAvatar]}>
              <Text style={styles.extraAvatarText}>+{extraCount}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }} />
        <Text
          style={styles.trackBtnText}
          onPress={() => navigation && navigation.navigate('TrackJob', { jobId: job.id })}
        >
          Track
        </Text>
      </View>
    </View>
  );
} 