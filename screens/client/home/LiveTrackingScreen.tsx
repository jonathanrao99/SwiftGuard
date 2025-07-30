import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

interface LiveTrackingScreenProps {
  navigation: any;
}

interface GuardLocation {
  id: string;
  name: string;
  jobTitle: string;
  status: 'on_duty' | 'off_duty' | 'on_break';
  lastSeen: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  batteryLevel: number;
  checkpoints: number;
}

export default function LiveTrackingScreen({ navigation }: LiveTrackingScreenProps) {
  const [guards, setGuards] = useState<GuardLocation[]>([]);
  const [selectedGuard, setSelectedGuard] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGuardLocations();
    
    // Set up real-time updates
    const interval = setInterval(loadGuardLocations, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadGuardLocations = async () => {
    try {
      // Mock data - replace with real API call
      const mockGuards: GuardLocation[] = [
        {
          id: 'guard-1',
          name: 'John Smith',
          jobTitle: 'Corporate Office Security',
          status: 'on_duty',
          lastSeen: new Date().toISOString(),
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Business Ave, Downtown',
          },
          batteryLevel: 85,
          checkpoints: 4,
        },
        {
          id: 'guard-2',
          name: 'Sarah Johnson',
          jobTitle: 'Warehouse Night Shift',
          status: 'on_break',
          lastSeen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          location: {
            latitude: 40.7589,
            longitude: -73.9851,
            address: '456 Industrial Way',
          },
          batteryLevel: 92,
          checkpoints: 2,
        },
      ];

      setGuards(mockGuards);
    } catch (error) {
      console.error('Error loading guard locations:', error);
      Alert.alert('Error', 'Failed to load guard locations.');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_duty':
        return '#22c55e';
      case 'on_break':
        return '#f59e0b';
      case 'off_duty':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on_duty':
        return 'On Duty';
      case 'on_break':
        return 'On Break';
      case 'off_duty':
        return 'Off Duty';
      default:
        return 'Unknown';
    }
  };

  const formatLastSeen = (timestamp: string) => {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000);

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours}h ago`;
    }
  };

  const contactGuard = (guardId: string) => {
    Alert.alert(
      'Contact Guard',
      'How would you like to contact this guard?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Alert.alert('Calling guard...') },
        { text: 'Message', onPress: () => navigation.navigate('GuardMessages', { guardId }) },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGuardLocations();
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <TouchableOpacity onPress={onRefresh}>
            <MaterialIcons name="refresh" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Status Overview */}
        <View style={styles.statusOverview}>
          <View style={styles.statusCard}>
            <Text style={styles.statusNumber}>{guards.filter(g => g.status === 'on_duty').length}</Text>
            <Text style={styles.statusLabel}>On Duty</Text>
            <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusNumber}>{guards.filter(g => g.status === 'on_break').length}</Text>
            <Text style={styles.statusLabel}>On Break</Text>
            <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusNumber}>{guards.reduce((acc, g) => acc + g.checkpoints, 0)}</Text>
            <Text style={styles.statusLabel}>Checkpoints</Text>
            <View style={[styles.statusDot, { backgroundColor: '#3b82f6' }]} />
          </View>
        </View>

        {/* Guards List */}
        <ScrollView style={styles.guardsList}>
          {guards.map((guard) => (
            <View key={guard.id} style={styles.guardCard}>
              <View style={styles.guardHeader}>
                <View style={styles.guardInfo}>
                  <Text style={styles.guardName}>{guard.name}</Text>
                  <Text style={styles.guardJob}>{guard.jobTitle}</Text>
                </View>
                <View style={styles.guardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => contactGuard(guard.id)}
                  >
                    <MaterialIcons name="chat" size={20} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('Calling guard...')}
                  >
                    <MaterialIcons name="phone" size={20} color="#22c55e" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(guard.status) }]} />
                  <Text style={styles.statusText}>{getStatusText(guard.status)}</Text>
                </View>
                <Text style={styles.lastSeen}>Last seen: {formatLastSeen(guard.lastSeen)}</Text>
              </View>

              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={16} color="#64748b" />
                <Text style={styles.locationText}>{guard.location.address}</Text>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <MaterialIcons name="check-circle" size={16} color="#22c55e" />
                  <Text style={styles.metricText}>{guard.checkpoints} checkpoints</Text>
                </View>
                <View style={styles.metric}>
                  <MaterialIcons 
                    name="battery-full" 
                    size={16} 
                    color={guard.batteryLevel > 20 ? '#22c55e' : '#ef4444'} 
                  />
                  <Text style={styles.metricText}>{guard.batteryLevel}%</Text>
                </View>
              </View>

              {guard.status === 'on_duty' && (
                <TouchableOpacity
                  style={styles.viewMapButton}
                  onPress={() => Alert.alert('Map View', 'Opening map view for this guard...')}
                >
                  <MaterialIcons name="map" size={16} color="#2563eb" />
                  <Text style={styles.viewMapText}>View on Map</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>

        {guards.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="location-off" size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Active Guards</Text>
            <Text style={styles.emptyDescription}>
              No guards are currently on duty for tracking.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  
  statusOverview: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  
  statusCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  
  statusNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  
  statusLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  
  statusDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  guardsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  guardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  
  guardJob: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  
  guardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    marginLeft: 6,
  },
  
  lastSeen: {
    fontSize: 12,
    color: '#64748b',
  },
  
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  locationText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 6,
    flex: 1,
  },
  
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  metricText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 8,
  },
  
  viewMapText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
    marginLeft: 4,
  },
  
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  
  emptyDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
}); 