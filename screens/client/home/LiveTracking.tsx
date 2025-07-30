import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../../design-system';
import { NavigationProps, GuardTracking, Job, User } from '../../../types';

interface LiveTrackingProps {
  navigation: NavigationProps;
  route?: {
    params?: {
      jobId?: string;
    };
  };
}

interface GuardStatus {
  guard: User;
  tracking: GuardTracking;
  job: Job;
  checkpointCount: number;
  lastCheckpoint?: string;
  batteryLevel?: number;
  isOnline: boolean;
}

export default function LiveTracking({ navigation, route }: LiveTrackingProps) {
  const [guards, setGuards] = useState<GuardStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<string | null>(null);

  useEffect(() => {
    loadGuardData();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadGuardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadGuardData = async () => {
    try {
      // Mock data - replace with real API calls
      const mockGuards: GuardStatus[] = [
        {
          guard: {
            id: 'guard-1',
            role: 'guard',
            email: 'john@swiftguard.com',
            first_name: 'John',
            last_name: 'Smith',
            status: 'active',
            created_at: new Date().toISOString(),
            experience_level: 'Expert',
          },
          tracking: {
            id: 'tracking-1',
            guard_id: 'guard-1',
            job_id: 'job-1',
            latitude: 37.7749,
            longitude: -122.4194,
            battery_level: 85,
            is_online: true,
            last_seen: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
            created_at: new Date().toISOString(),
          },
          job: {
            id: 'job-1',
            client_id: 'client-1',
            title: 'Corporate Office Security',
            location: '123 Business Ave, Downtown',
            venue_type: 'Corporate Office',
            recurring_mode: 'One-time',
            event_dates: ['2024-01-15'],
            start_time: '18:00',
            end_time: '06:00',
            duration: 12,
            num_guards: 1,
            hourly_pay: 25,
            total_amount: 300,
            manager_name: 'Sarah Johnson',
            manager_phone: '+1234567890',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          checkpointCount: 3,
          lastCheckpoint: 'Main Entrance - 15 minutes ago',
          batteryLevel: 85,
          isOnline: true,
        },
        {
          guard: {
            id: 'guard-2',
            role: 'guard',
            email: 'mike@swiftguard.com',
            first_name: 'Mike',
            last_name: 'Johnson',
            status: 'active',
            created_at: new Date().toISOString(),
            experience_level: 'Intermediate',
          },
          tracking: {
            id: 'tracking-2',
            guard_id: 'guard-2',
            job_id: 'job-2',
            latitude: 37.7750,
            longitude: -122.4195,
            battery_level: 62,
            is_online: true,
            last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
            created_at: new Date().toISOString(),
          },
          job: {
            id: 'job-2',
            client_id: 'client-1',
            title: 'Warehouse Night Shift',
            location: '456 Industrial Way',
            venue_type: 'Warehouse',
            recurring_mode: 'Multiple Days',
            event_dates: ['2024-01-16'],
            start_time: '22:00',
            end_time: '06:00',
            duration: 8,
            num_guards: 2,
            hourly_pay: 28,
            total_amount: 224,
            manager_name: 'Mike Thompson',
            manager_phone: '+1987654321',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          checkpointCount: 1,
          lastCheckpoint: 'Loading Dock - 25 minutes ago',
          batteryLevel: 62,
          isOnline: true,
        },
      ];

      setGuards(mockGuards);
    } catch (error) {
      console.error('Error loading guard data:', error);
      Alert.alert('Error', 'Failed to load tracking data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGuardData();
    setRefreshing(false);
  };

  const getStatusColor = (isOnline: boolean, lastSeen: string) => {
    if (!isOnline) return '#ef4444';
    
    const minutesAgo = Math.floor((Date.now() - new Date(lastSeen).getTime()) / (1000 * 60));
    if (minutesAgo <= 5) return '#22c55e';
    if (minutesAgo <= 15) return '#f59e42';
    return '#ef4444';
  };

  const getStatusText = (isOnline: boolean, lastSeen: string) => {
    if (!isOnline) return 'Offline';
    
    const minutesAgo = Math.floor((Date.now() - new Date(lastSeen).getTime()) / (1000 * 60));
    if (minutesAgo <= 5) return 'Online';
    if (minutesAgo <= 15) return `${minutesAgo}m ago`;
    return 'Not responding';
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return '#64748b';
    if (level > 50) return '#22c55e';
    if (level > 20) return '#f59e42';
    return '#ef4444';
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const contactGuard = (guard: GuardStatus) => {
    Alert.alert(
      'Contact Guard',
      `How would you like to contact ${guard.guard.first_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Message',
          onPress: () => navigation.navigate('ClientMessages', { guardId: guard.guard.id }),
        },
        {
          text: 'Call',
          onPress: () => {
            // Implement phone call
            Alert.alert('Calling', `Calling ${guard.guard.first_name}...`);
          },
        },
      ]
    );
  };

  const viewFullMap = () => {
    navigation.navigate('MapView', { guards });
  };

  if (guards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <TouchableOpacity style={styles.mapButton} onPress={viewFullMap}>
            <MaterialIcons name="map" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        <View style={styles.emptyState}>
          <MaterialIcons name="location-off" size={64} color="#64748b" />
          <Text style={styles.emptyTitle}>No Active Guards</Text>
          <Text style={styles.emptyText}>
            No guards are currently on duty for your security jobs
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <TouchableOpacity style={styles.mapButton} onPress={viewFullMap}>
          <MaterialIcons name="map" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Status Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <MaterialIcons name="security" size={20} color="#22c55e" />
          <Text style={styles.overviewTitle}>Security Status</Text>
        </View>
        <Text style={styles.overviewText}>
          {guards.length} guard{guards.length > 1 ? 's' : ''} actively monitoring your properties
        </Text>
        <View style={styles.overviewStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{guards.filter(g => g.isOnline).length}</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {guards.reduce((sum, g) => sum + g.checkpointCount, 0)}
            </Text>
            <Text style={styles.statLabel}>Checkpoints</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(guards.reduce((sum, g) => sum + (g.batteryLevel || 0), 0) / guards.length)}%
            </Text>
            <Text style={styles.statLabel}>Avg Battery</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {guards.map((guardStatus) => (
          <View key={guardStatus.guard.id} style={styles.guardCard}>
            {/* Guard Header */}
            <View style={styles.guardHeader}>
              <View style={styles.guardInfo}>
                <Text style={styles.guardName}>
                  {guardStatus.guard.first_name} {guardStatus.guard.last_name}
                </Text>
                <Text style={styles.jobTitle}>{guardStatus.job.title}</Text>
              </View>
              
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: getStatusColor(
                        guardStatus.isOnline,
                        guardStatus.tracking.last_seen
                      ),
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {getStatusText(guardStatus.isOnline, guardStatus.tracking.last_seen)}
                </Text>
              </View>
            </View>

            {/* Location & Battery */}
            <View style={styles.guardDetails}>
              <View style={styles.detailRow}>
                <MaterialIcons name="location-on" size={16} color="#64748b" />
                <Text style={styles.detailText}>
                  {formatCoordinates(
                    guardStatus.tracking.latitude,
                    guardStatus.tracking.longitude
                  )}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialIcons
                  name="battery-full"
                  size={16}
                  color={getBatteryColor(guardStatus.batteryLevel)}
                />
                <Text style={styles.detailText}>
                  {guardStatus.batteryLevel || 'Unknown'}% battery
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialIcons name="check-circle" size={16} color="#64748b" />
                <Text style={styles.detailText}>
                  {guardStatus.checkpointCount} checkpoints completed
                </Text>
              </View>
              
              {guardStatus.lastCheckpoint && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="place" size={16} color="#64748b" />
                  <Text style={styles.detailText}>{guardStatus.lastCheckpoint}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.guardActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.messageButton]}
                onPress={() => contactGuard(guardStatus)}
              >
                <MaterialIcons name="chat" size={16} color="#2563eb" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.trackButton]}
                onPress={() => setSelectedGuard(
                  selectedGuard === guardStatus.guard.id ? null : guardStatus.guard.id
                )}
              >
                <MaterialIcons
                  name={selectedGuard === guardStatus.guard.id ? 'visibility-off' : 'visibility'}
                  size={16}
                  color="#22c55e"
                />
                <Text style={styles.trackButtonText}>
                  {selectedGuard === guardStatus.guard.id ? 'Hide' : 'Track'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Expanded Tracking Details */}
            {selectedGuard === guardStatus.guard.id && (
              <View style={styles.expandedDetails}>
                <View style={styles.expandedHeader}>
                  <MaterialIcons name="timeline" size={20} color="#2563eb" />
                  <Text style={styles.expandedTitle}>Recent Activity</Text>
                </View>
                
                <View style={styles.activityList}>
                  <View style={styles.activityItem}>
                    <Text style={styles.activityTime}>15:30</Text>
                    <Text style={styles.activityText}>Checkpoint: Main Entrance</Text>
                  </View>
                  <View style={styles.activityItem}>
                    <Text style={styles.activityTime}>15:15</Text>
                    <Text style={styles.activityText}>Patrol started</Text>
                  </View>
                  <View style={styles.activityItem}>
                    <Text style={styles.activityTime}>15:00</Text>
                    <Text style={styles.activityText}>Checked in for shift</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#222',
  },
  mapButton: {
    padding: 8,
    marginRight: -8,
  },
  overviewCard: {
    ...theme.components.card.base,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#222',
    marginLeft: 8,
  },
  overviewText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#222',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  guardCard: {
    ...theme.components.card.base,
    marginBottom: 16,
  },
  guardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  guardInfo: {
    flex: 1,
  },
  guardName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#222',
  },
  jobTitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
  },
  guardDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#4b5563',
    marginLeft: 8,
  },
  guardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  messageButton: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  messageButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#2563eb',
    marginLeft: 4,
  },
  trackButton: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  trackButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#22c55e',
    marginLeft: 4,
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  expandedTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#222',
    marginLeft: 8,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    minWidth: 60,
  },
  activityText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#4b5563',
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#222',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
  },
}); 