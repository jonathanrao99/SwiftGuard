
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../../supabaseClient';
import { COLORS, SPACING } from '../../theme';
import ErrorBoundary from '../../components/ErrorBoundary';

interface IncidentType {
  id: string;
  title: string;
  description: string;
  icon: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const INCIDENT_TYPES: IncidentType[] = [
  {
    id: '1',
    title: 'Theft',
    description: 'Property theft or burglary',
    icon: 'security',
    severity: 'high'
  },
  {
    id: '2',
    title: 'Assault',
    description: 'Physical assault or violence',
    icon: 'warning',
    severity: 'critical'
  },
  {
    id: '3',
    title: 'Medical Emergency',
    description: 'Health-related emergency',
    icon: 'local-hospital',
    severity: 'critical'
  },
  {
    id: '4',
    title: 'Fire/Safety',
    description: 'Fire hazard or safety concern',
    icon: 'local-fire-department',
    severity: 'high'
  },
  {
    id: '5',
    title: 'Trespassing',
    description: 'Unauthorized access',
    icon: 'person-off',
    severity: 'medium'
  },
  {
    id: '6',
    title: 'Other',
    description: 'Other incident type',
    icon: 'more-horiz',
    severity: 'low'
  }
];

export default function ReportIncidentScreen({ navigation }: { navigation: any }) {
  const [selectedIncidentType, setSelectedIncidentType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIncidentDropdown, setShowIncidentDropdown] = useState(false);

  useEffect(() => {
    fetchCurrentJob();
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
    if (status === 'granted') {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchCurrentJob = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: jobGuards, error } = await supabase
        .from('job_guards')
        .select(`
          *,
          jobs (*)
        `)
        .eq('guard_id', user.id)
        .eq('status', 'accepted')
        .order('assigned_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching current job:', error);
        return;
      }

      // Handle case when no job is found
      if (jobGuards && jobGuards.length > 0) {
        setCurrentJob(jobGuards[0].jobs);
      } else {
        setCurrentJob(null);
      }
    } catch (error) {
      console.error('Error fetching current job:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedIncidentType) {
      Alert.alert('Error', 'Please select an incident type');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload photos if any
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const fileName = `incident_photos/${user.id}/${Date.now()}_${Math.random()}.jpg`;
        const { data, error } = await supabase.storage
          .from('incident-photos')
          .upload(fileName, {
            uri: photo,
            type: 'image/jpeg',
            name: fileName,
          } as any);

        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('incident-photos')
          .getPublicUrl(fileName);
        
        photoUrls.push(publicUrl);
      }

      // Create incident report
      const { error } = await supabase
        .from('incidents')
        .insert({
          guard_id: user.id,
          job_id: currentJob?.id,
          incident_type: selectedIncidentType.title,
          description: description.trim(),
          severity: selectedIncidentType.severity,
          photos: photoUrls,
          location: currentLocation ? {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          } : null,
          status: 'reported'
        });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Incident reported successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting incident:', error);
      Alert.alert('Error', 'Failed to submit incident report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#22c55e';
      default:
        return '#64748b';
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Incident</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setShowIncidentDropdown(false)}
        >
          {/* Current Job Info */}
          {currentJob && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Assignment</Text>
              <View style={styles.jobCard}>
                <Text style={styles.jobTitle}>{currentJob.title}</Text>
                <Text style={styles.jobLocation}>{currentJob.location}</Text>
              </View>
            </View>
          )}

          {/* Incident Type Selection */}
          <View style={[styles.section, { zIndex: 100000 }]}>
            <Text style={styles.sectionTitle}>Incident Type *</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowIncidentDropdown(!showIncidentDropdown)}
              >
                <View style={styles.dropdownContent}>
                  {selectedIncidentType ? (
                    <Text style={styles.dropdownText}>{selectedIncidentType.title}</Text>
                  ) : (
                    <Text style={styles.dropdownPlaceholder}>Select incident type</Text>
                  )}
                </View>
                <MaterialIcons 
                  name={showIncidentDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={20} 
                  color={COLORS.textSecondary} 
                />
              </TouchableOpacity>
              
              {showIncidentDropdown && (
                <View style={styles.dropdownMenu}>
                  {INCIDENT_TYPES.map((incidentType) => (
                    <TouchableOpacity
                      key={incidentType.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedIncidentType(incidentType);
                        setShowIncidentDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{incidentType.title}</Text>
                      <View style={[
                        styles.severityBadge,
                        { backgroundColor: getSeverityColor(incidentType.severity) }
                      ]}>
                        <Text style={styles.severityText}>{incidentType.severity.toUpperCase()}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description *</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe the incident..."
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos (Optional)</Text>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <MaterialIcons name="camera-alt" size={20} color={COLORS.primary} />
                <Text style={styles.photoButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <MaterialIcons name="photo-library" size={20} color={COLORS.primary} />
                <Text style={styles.photoButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            
            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <MaterialIcons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Location Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationRow}>
                <MaterialIcons 
                  name={locationPermission ? "location-on" : "location-off"} 
                  size={20} 
                  color={locationPermission ? COLORS.success : COLORS.error} 
                />
                <Text style={styles.locationStatus}>
                  {locationPermission ? 'Location captured' : 'Location access required'}
                </Text>
              </View>
              {!locationPermission && (
                <TouchableOpacity 
                  style={styles.permissionButton}
                  onPress={requestLocationPermission}
                >
                  <Text style={styles.permissionButtonText}>Enable Location</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <MaterialIcons name="report" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Report Incident</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  container: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  scrollContent: { 
    paddingHorizontal: SPACING.lg, 
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl * 2,
    zIndex: 1,
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
  section: {
    marginBottom: SPACING.lg,
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  jobLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 100000,
    overflow: 'visible',
    marginBottom: SPACING.lg,
    backgroundColor: 'transparent',
  },
  dropdownButton: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 100001,
    overflow: 'hidden',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.textDark,
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: COLORS.textMuted,
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    maxHeight: 300,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 100002,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.textDark,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  descriptionInput: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.textDark,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  photoButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  photoContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  locationStatus: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  submitSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
