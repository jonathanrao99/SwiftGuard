import React, { memo, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Platform 
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming 
} from 'react-native-reanimated';
import { MaterialIcons, Feather } from '@expo/vector-icons';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    status: string;
    hourlyPay: number;
    totalAmount: number;
    requiredGuards: number;
    assignedGuards: number;
    guards?: Array<{
      id: string;
      name: string;
      photo: string;
    }>;
  };
  onPress?: (jobId: string) => void;
  onTrackPress?: (jobId: string) => void;
  variant?: 'client' | 'guard';
}

const ANIMATION_CONFIG = {
  damping: 20,
  stiffness: 400,
  mass: 0.8,
} as const;

const MAX_AVATARS = 2;

// Memoized status tag component for better performance
const StatusTag = memo<{ status: string; variant: 'client' | 'guard' }>(({ status, variant }) => {
  const tagStyles = useMemo(() => {
    const isClient = variant === 'client';
    const isAssigned = status === 'assigned' || status === 'completed';
    
    return {
      container: [
        styles.tag,
        isClient 
          ? (isAssigned ? styles.tagAssignedBlue : styles.tagActiveBlue)
          : (isAssigned ? styles.tagAssignedGreen : styles.tagPendingOrange)
      ],
      text: [
        styles.tagText,
        isClient 
          ? styles.tagTextBlue 
          : (isAssigned ? styles.tagTextGreen : styles.tagTextOrange)
      ]
    };
  }, [status, variant]);

  const icon = useMemo(() => {
    switch (status) {
      case 'assigned':
      case 'completed':
        return <Feather name="check-circle" size={12} color={variant === 'client' ? '#2563eb' : '#10b981'} />;
      case 'active':
      case 'in_progress':
        return <MaterialIcons name="access-time" size={12} color="#f59e0b" />;
      default:
        return null;
    }
  }, [status, variant]);

  const displayStatus = useMemo(() => {
    switch (status) {
      case 'assigned': return 'Assigned';
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      default: return status;
    }
  }, [status]);

  return (
    <View style={tagStyles.container}>
      {icon}
      <Text style={tagStyles.text}>{displayStatus}</Text>
    </View>
  );
});

// Memoized avatar row component
const AvatarRow = memo<{ guards: Array<{ id: string; name: string; photo: string }> }>(({ guards }) => {
  const displayGuards = guards.slice(0, MAX_AVATARS);
  const extraCount = guards.length - MAX_AVATARS;

  return (
    <View style={styles.avatarRow}>
      {displayGuards.map((guard, idx) => (
        <Image
          key={guard.id}
          source={{ uri: guard.photo }}
          style={[
            styles.avatarSmall, 
            { 
              marginLeft: idx === 0 ? 0 : -12, 
              borderColor: '#dbeafe' 
            }
          ]}
          accessibilityLabel={`${guard.name}'s photo`}
        />
      ))}
      {extraCount > 0 && (
        <View style={[styles.avatarSmall, styles.avatarExtra, { backgroundColor: '#dbeafe' }]}>
          <Text style={[styles.extraText, { color: '#2563eb' }]}>+{extraCount}</Text>
        </View>
      )}
    </View>
  );
});

// Main optimized job card component
const OptimizedJobCard: React.FC<JobCardProps> = ({
  job,
  onPress,
  onTrackPress,
  variant = 'client'
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  // Memoized computed values
  const isAssigned = useMemo(() => 
    job.assignedGuards >= job.requiredGuards, 
    [job.assignedGuards, job.requiredGuards]
  );

  const cardStyles = useMemo(() => [
    variant === 'client' ? styles.jobCardBlue : styles.jobCardWhite,
    Platform.OS === 'ios' && styles.shadowIOS,
    Platform.OS === 'android' && styles.shadowAndroid,
  ], [variant]);

  const textColor = useMemo(() => 
    variant === 'client' ? '#fff' : '#1f2937', 
    [variant]
  );

  const detailColor = useMemo(() => 
    variant === 'client' ? '#dbeafe' : '#6b7280', 
    [variant]
  );

  // Optimized animation handlers
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, ANIMATION_CONFIG);
    translateY.value = withSpring(-1, ANIMATION_CONFIG);
  }, [scale, translateY]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION_CONFIG);
    translateY.value = withSpring(0, ANIMATION_CONFIG);
  }, [scale, translateY]);

  const handlePress = useCallback(() => {
    if (onPress) {
      // Immediate press feedback
      scale.value = withTiming(1.01, { duration: 50 }, () => {
        scale.value = withSpring(1, ANIMATION_CONFIG);
      });
      onPress(job.id);
    }
  }, [onPress, job.id, scale]);

  const handleTrackPress = useCallback(() => {
    if (onTrackPress) {
      onTrackPress(job.id);
    }
  }, [onTrackPress, job.id]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }), []);

  return (
    <TouchableOpacity 
      style={cardStyles}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={`Job ${job.title}, ${isAssigned ? 'Assigned' : 'Active'}`}
    >
      <Animated.View style={animatedStyle}>
        {/* Header */}
        <View style={styles.jobHeader}>
          <Text style={[styles.jobTitle, { color: textColor }]} numberOfLines={2}>
            {job.title}
          </Text>
          <StatusTag status={job.status} variant={variant} />
        </View>

        {/* Job Details */}
        <View style={styles.jobDetailRow}>
          <MaterialIcons name="event" size={16} color={detailColor} />
          <Text style={[styles.jobDetailText, { color: detailColor }]}>
            {job.date}
          </Text>
          <MaterialIcons 
            name="access-time" 
            size={16} 
            color={detailColor} 
            style={{ marginLeft: 12 }} 
          />
          <Text style={[styles.jobDetailText, { color: detailColor }]}>
            {job.time}
          </Text>
        </View>

        {/* Location */}
        <View style={[styles.jobDetailRow, { marginTop: 4 }]}>
          <MaterialIcons name="location-on" size={16} color={detailColor} />
          <Text 
            style={[styles.jobDetailText, { color: detailColor }]} 
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {job.location}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.jobFooter}>
          <View style={styles.leftSection}>
            {/* Pay Information */}
            <Text style={[styles.payText, { color: textColor }]}>
              ${job.hourlyPay}/hr • ${job.totalAmount} total
            </Text>
            
            {/* Guards/Avatars */}
            {job.guards && job.guards.length > 0 ? (
              <AvatarRow guards={job.guards} />
            ) : (
              <Text style={[styles.guardsText, { color: detailColor }]}>
                {job.assignedGuards}/{job.requiredGuards} guards
              </Text>
            )}
          </View>

          {/* Track Button */}
          {onTrackPress && (
            <TouchableOpacity onPress={handleTrackPress}>
              <Text style={[
                styles.trackText, 
                { color: variant === 'client' ? '#dbeafe' : '#2563eb' }
              ]}>
                Track
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  jobCardBlue: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    width: '90%',
    alignSelf: 'center',
    marginTop: 12,
    padding: 16,
  },
  jobCardWhite: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    alignSelf: 'center',
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  shadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shadowAndroid: {
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
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
  tagAssignedGreen: {
    backgroundColor: '#d1fae5',
  },
  tagPendingOrange: {
    backgroundColor: '#fed7aa',
  },
  tagText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  tagTextBlue: {
    color: '#2563eb',
  },
  tagTextGreen: {
    color: '#10b981',
  },
  tagTextOrange: {
    color: '#f59e0b',
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  jobDetailText: {
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  leftSection: {
    flex: 1,
  },
  payText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  guardsText: {
    fontSize: 12,
    fontWeight: '500',
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
  trackText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default memo(OptimizedJobCard);
