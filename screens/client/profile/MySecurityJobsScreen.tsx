import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../../theme';
import { NavigationProps } from '../../../types';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay
} from 'react-native-reanimated';

interface Job {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  guardName?: string;
  guardImage?: string;
  hourlyRate: number;
  totalHours: number;
}

interface MySecurityJobsScreenProps {
  navigation: NavigationProps;
}

export default function MySecurityJobsScreen({ navigation }: MySecurityJobsScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const filterOpacity = useSharedValue(0);
  const filterTranslateY = useSharedValue(20);
  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(30);

  useEffect(() => {
    // Start animations when component mounts
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    
    filterOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    filterTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
    
    listOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    listTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  const jobs: Job[] = [
    {
      id: '1',
      title: 'Event Security - Corporate Conference',
      location: 'Downtown Convention Center',
      date: 'Jan 15, 2025',
      time: '9:00 AM - 5:00 PM',
      status: 'active',
      guardName: 'John Carter',
      guardImage: 'https://randomuser.me/api/portraits/men/20.jpg',
      hourlyRate: 25,
      totalHours: 8,
    },
    {
      id: '2',
      title: 'VIP Protection - Business Meeting',
      location: 'Financial District',
      date: 'Jan 12, 2025',
      time: '2:00 PM - 6:00 PM',
      status: 'completed',
      guardName: 'Maria Lopez',
      guardImage: 'https://randomuser.me/api/portraits/women/13.jpg',
      hourlyRate: 35,
      totalHours: 4,
    },
    {
      id: '3',
      title: 'Wedding Security',
      location: 'Grand Hotel',
      date: 'Jan 20, 2025',
      time: '4:00 PM - 12:00 AM',
      status: 'pending',
      hourlyRate: 30,
      totalHours: 8,
    },
    {
      id: '4',
      title: 'Construction Site Security',
      location: 'Industrial Zone',
      date: 'Jan 10, 2025',
      time: '6:00 AM - 2:00 PM',
      status: 'cancelled',
      hourlyRate: 22,
      totalHours: 8,
    },
  ];

  const filteredJobs = jobs.filter(job => {
    if (selectedFilter === 'all') return true;
    return job.status === selectedFilter;
  });

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const filterAnimatedStyle = useAnimatedStyle(() => ({
    opacity: filterOpacity.value,
    transform: [{ translateY: filterTranslateY.value }],
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'active':
        return { bg: COLORS.successLight, text: COLORS.success };
      case 'completed':
        return { bg: COLORS.infoLight, text: COLORS.info };
      case 'cancelled':
        return { bg: COLORS.errorLight, text: COLORS.error };
      default:
        return { bg: COLORS.border, text: COLORS.textSecondary };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderJobCard = ({ item }: { item: Job }) => {
    const statusColors = getStatusColor(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.jobCard}
        onPress={() => navigation.navigate('JobDetails', { jobId: item.id })}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleContainer}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialIcons name="event" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.date} • {item.time}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="attach-money" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>${item.hourlyRate}/hr • {item.totalHours}h</Text>
          </View>
        </View>

        {item.guardName && (
          <View style={styles.guardSection}>
            <Text style={styles.guardLabel}>Assigned Guard:</Text>
            <View style={styles.guardInfo}>
              <Image source={{ uri: item.guardImage }} style={styles.guardAvatar} />
              <Text style={styles.guardName}>{item.guardName}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('TrackJob', { jobId: item.id })}
          >
            <MaterialIcons name="location-on" size={16} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Track</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('GuardChat', { jobId: item.id })}
          >
            <MaterialIcons name="chat" size={16} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const filterOptions = [
    { key: 'all', label: 'All Jobs' },
    { key: 'pending', label: 'Pending' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Security Jobs</Text>
        <TouchableOpacity onPress={() => navigation.navigate('JobTemplateSelector')}>
          <MaterialIcons name="add" size={24} color="#222" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.container}>
        {/* Filter Tabs */}
        <Animated.View style={[styles.filterContainer, filterAnimatedStyle]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterTab,
                  selectedFilter === option.key && styles.filterTabActive
                ]}
                onPress={() => setSelectedFilter(option.key)}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedFilter === option.key && styles.filterTabTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Jobs List */}
        <Animated.View style={listAnimatedStyle}>
          <FlatList
            data={filteredJobs}
            renderItem={renderJobCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  container: { 
    flex: 1, 
    backgroundColor: COLORS.backgroundLight 
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
  filterContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: SPACING.lg,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: {
    marginBottom: SPACING.md,
  },
  jobTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  jobDetails: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  guardSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  guardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  guardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guardAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: SPACING.sm,
  },
  guardName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
}); 