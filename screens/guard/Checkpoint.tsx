import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { theme } from '../../design-system';
import { COLORS } from '../../theme';
import { NavigationProps } from '../../types';
import CheckpointService, { CheckpointLocation } from '../../services/CheckpointService';
import { useAuth } from '../../contexts/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';

interface CheckpointProps {
  navigation: NavigationProps;
}

export default function Checkpoint({ navigation }: CheckpointProps) {
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [checkpointName, setCheckpointName] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [checkpoints, setCheckpoints] = useState<CheckpointLocation[]>([]);
  const [nearestCheckpoint, setNearestCheckpoint] = useState<(CheckpointLocation & { distance: number }) | null>(null);
  const { user } = useAuth();

  // Get job ID from navigation params or use default
  const jobId = navigation.getState()?.routes?.find(route => route.name === 'Checkpoint')?.params?.jobId || 'default-job';

  useEffect(() => {
    getCurrentLocation();
    loadCheckpoints();
  }, [jobId]);

  const loadCheckpoints = async () => {
    try {
      const checkpointLocations = await CheckpointService.loadCheckpointLocations(jobId);
      setCheckpoints(checkpointLocations);
    } catch (error) {
      console.error('Error loading checkpoints:', error);
      Alert.alert('Error', 'Failed to load checkpoint locations');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setLocationAccuracy(location.coords.accuracy || null);
      } else {
        Alert.alert('Location Required', 'Please enable location services to record checkpoints.');
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const getNearestCheckpoint = () => {
    if (!currentLocation || !checkpoints.length) return null;

    const nearest = CheckpointService.findNearestCheckpoint(
      currentLocation.latitude,
      currentLocation.longitude,
      checkpoints
    );

    setNearestCheckpoint(nearest);
    return nearest;
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const submitCheckpoint = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location is required to record checkpoint');
      return;
    }

    if (!checkpointName.trim()) {
      Alert.alert('Error', 'Please enter a checkpoint name');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const nearestCheckpoint = getNearestCheckpoint();
    if (nearestCheckpoint && nearestCheckpoint.required_photo && !photo) {
      Alert.alert('Error', 'Photo is required for this checkpoint');
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl: string | undefined;
      
      // Upload photo if provided
      if (photo) {
        photoUrl = await CheckpointService.uploadCheckpointPhoto(photo, user.id, jobId);
        if (!photoUrl) {
          Alert.alert('Error', 'Failed to upload photo. Please try again.');
          return;
        }
      }

      // Submit checkpoint to backend
      const success = await CheckpointService.submitCheckpoint({
        guard_id: user.id,
        job_id: jobId,
        checkpoint_id: nearestCheckpoint?.id || 'manual',
        checkpoint_name: checkpointName.trim(),
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        photo_url: photoUrl,
        notes: notes.trim() || undefined,
        checked_at: new Date().toISOString(),
      });

      if (!success) {
        Alert.alert('Error', 'Failed to submit checkpoint. Please try again.');
        return;
      }

      Alert.alert(
        'Checkpoint Recorded',
        'Your checkpoint has been recorded successfully.',
        [
          {
            text: 'Record Another',
            onPress: () => {
              setCheckpointName('');
              setNotes('');
              setPhoto(null);
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to record checkpoint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nearestCheckpoint = getNearestCheckpoint();

  return (
    <ErrorBoundary>
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkpoint</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={getCurrentLocation}
          >
            <MaterialIcons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Location Status */}
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MaterialIcons
                name="location-on"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.locationTitle}>
                {currentLocation ? 'Location Acquired' : 'Getting Location...'}
              </Text>
            </View>
            
            {currentLocation && (
              <View style={styles.locationDetails}>
                <Text style={styles.coordinatesText}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
                {locationAccuracy && (
                  <Text style={styles.accuracyText}>
                    Accuracy: ±{Math.round(locationAccuracy)}m
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Nearest Checkpoint */}
          {nearestCheckpoint && (
            <View style={styles.nearestCard}>
              <View style={styles.nearestHeader}>
                <MaterialIcons
                  name="place"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.nearestTitle}>Nearest Checkpoint</Text>
              </View>
              <Text style={styles.nearestName}>{nearestCheckpoint.name}</Text>
              <Text style={styles.nearestDistance}>
                {Math.round(nearestCheckpoint.distance)}m away
              </Text>
              {nearestCheckpoint.required_photo && (
                <View style={styles.photoRequiredBadge}>
                  <MaterialIcons name="camera-alt" size={12} color="white" />
                  <Text style={styles.photoRequiredText}>Photo Required</Text>
                </View>
              )}
            </View>
          )}

          {/* Checkpoint Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checkpoint Name</Text>
            <TextInput
              style={styles.textInput}
              value={checkpointName}
              onChangeText={setCheckpointName}
              placeholder={nearestCheckpoint ? nearestCheckpoint.name : "Enter checkpoint name"}
              autoFocus={!nearestCheckpoint}
            />
            {nearestCheckpoint && (
              <TouchableOpacity
                style={styles.useNearestButton}
                onPress={() => setCheckpointName(nearestCheckpoint.name)}
              >
                <Text style={styles.useNearestText}>Use "{nearestCheckpoint.name}"</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Photo */}
          <View style={styles.section}>
            <View style={styles.photoHeader}>
              <Text style={styles.sectionTitle}>Photo Evidence</Text>
              {nearestCheckpoint?.required_photo && (
                <Text style={styles.requiredLabel}>Required</Text>
              )}
            </View>
            
            {photo ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={takePhoto}
                >
                  <MaterialIcons name="camera-alt" size={16} color={COLORS.primary} />
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
                <MaterialIcons name="camera-alt" size={32} color={COLORS.primary} />
                <Text style={styles.cameraButtonText}>Take Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any observations or notes about this checkpoint..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Quick Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Notes</Text>
            <View style={styles.quickNotesGrid}>
              {['All Clear', 'Door Secured', 'Area Patrolled', 'No Issues', 'Equipment Check', 'Perimeter Clear'].map((note) => (
                <TouchableOpacity
                  key={note}
                  style={styles.quickNoteButton}
                  onPress={() => setNotes(prev => prev ? `${prev}\n• ${note}` : `• ${note}`)}
                >
                  <Text style={styles.quickNoteText}>{note}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!currentLocation || !checkpointName.trim() || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={submitCheckpoint}
            disabled={!currentLocation || !checkpointName.trim() || isSubmitting}
          >
            <MaterialIcons
              name="check-circle"
              size={20}
              color="white"
              style={styles.submitIcon}
            />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Recording...' : 'Record Checkpoint'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      </>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: theme.spacing[2],
    marginLeft: -theme.spacing[2],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: COLORS.textDark,
  },
  refreshButton: {
    padding: theme.spacing[2],
    marginRight: -theme.spacing[2],
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },
  locationCard: {
    ...theme.components.card.base,
    marginTop: theme.spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  locationTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semibold,
    color: COLORS.textDark,
    marginLeft: theme.spacing[2],
  },
  locationDetails: {
    paddingLeft: theme.spacing[8],
  },
  coordinatesText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: COLORS.textSecondary,
  },
  accuracyText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: COLORS.textSecondary,
    marginTop: theme.spacing[1],
  },
  nearestCard: {
    ...theme.components.card.base,
    marginTop: theme.spacing[4],
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nearestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  nearestTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: COLORS.primary,
    marginLeft: theme.spacing[2],
  },
  nearestName: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: COLORS.textDark,
    marginBottom: theme.spacing[1],
  },
  nearestDistance: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: COLORS.textSecondary,
  },
  photoRequiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: theme.spacing[2],
  },
  photoRequiredText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: 'white',
    marginLeft: theme.spacing[1],
  },
  section: {
    marginTop: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semibold,
    color: COLORS.textDark,
    marginBottom: theme.spacing[3],
  },
  textInput: {
    ...theme.components.input.base,
  },
  useNearestButton: {
    marginTop: theme.spacing[2],
  },
  useNearestText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: COLORS.primary,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  requiredLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: COLORS.error,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.sm,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.base,
    backgroundColor: COLORS.primaryLight,
  },
  retakeButton: {
    position: 'absolute',
    bottom: theme.spacing[2],
    right: theme.spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.base,
  },
  retakeText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: COLORS.primary,
    marginLeft: theme.spacing[1],
  },
  cameraButton: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.base,
    paddingVertical: theme.spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: COLORS.textSecondary,
    marginTop: theme.spacing[2],
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  quickNotesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  quickNoteButton: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickNoteText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    ...theme.components.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[4],
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.primaryLight,
  },
  submitIcon: {
    marginRight: theme.spacing[2],
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semibold,
    color: 'white',
  },
}); 