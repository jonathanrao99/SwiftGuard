import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Incident, NavigationProps } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import ErrorBoundary from '../../components/ErrorBoundary';

interface IncidentReportProps {
  navigation: NavigationProps;
}

export default function IncidentReport({ navigation }: IncidentReportProps) {
  const { user } = useAuth();
  const [incidentType, setIncidentType] = useState<string>('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [witnesses, setWitnesses] = useState('');
  const [policeNotified, setPoliceNotified] = useState(false);
  const [policeCase, setPoliceCase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incidentTypes = [
    { id: 'theft', label: 'Theft', icon: 'security' },
    { id: 'vandalism', label: 'Vandalism', icon: 'build' },
    { id: 'trespassing', label: 'Trespassing', icon: 'person-off' },
    { id: 'medical', label: 'Medical', icon: 'medical-services' },
    { id: 'fire', label: 'Fire', icon: 'local-fire-department' },
    { id: 'suspicious_activity', label: 'Suspicious', icon: 'warning' },
    { id: 'other', label: 'Other', icon: 'more-horiz' },
  ];

  const severityLevels = [
    { id: 'low', label: 'Low', color: '#10b981' },
    { id: 'medium', label: 'Medium', color: '#f59e0b' },
    { id: 'high', label: 'High', color: '#ef4444' },
    { id: 'critical', label: 'Critical', color: '#dc2626' },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to report incidents.');
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!incidentType) {
      Alert.alert('Missing Information', 'Please select an incident type.');
      return false;
    }
    if (!title.trim()) {
      Alert.alert('Missing Information', 'Please enter a title for the incident.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please enter a description of the incident.');
      return false;
    }
    if (!location) {
      Alert.alert('Missing Information', 'Location is required. Please allow location access.');
      return false;
    }
    return true;
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];

    const uploadedUrls: string[] = [];
    
    for (const photoUri of photos) {
      try {
        const fileName = `incidents/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const { data, error } = await supabase.storage
          .from('photos')
          .upload(fileName, {
            uri: photoUri,
            type: 'image/jpeg',
            name: fileName,
          } as any);

        if (error) {
          console.error('Error uploading photo:', error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error('Error in photo upload:', error);
      }
    }

    return uploadedUrls;
  };

  const submitIncident = async () => {
    if (!validateForm()) return;
    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to report an incident.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photos first
      const photoUrls = await uploadPhotos();

      // Create incident object
      const incidentData = {
        guard_id: user.id,
        type: incidentType as any,
        severity,
        title: title.trim(),
        description: description.trim(),
        location: {
          latitude: location!.latitude,
          longitude: location!.longitude,
        },
        photos: photoUrls,
        witnesses: witnesses.trim() ? witnesses.split('\n').filter(w => w.trim()) : [],
        police_notified: policeNotified,
        police_case_number: policeCase.trim() || undefined,
        status: 'reported',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Submit to Supabase
      const { error } = await supabase
        .from('incidents')
        .insert([incidentData]);

      if (error) {
        console.error('Error submitting incident:', error);
        Alert.alert('Error', 'Failed to submit incident report. Please try again.');
        return;
      }

      Alert.alert(
        'Incident Reported',
        'Your incident report has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit incident report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Incident</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Incident Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Type</Text>
          <View style={styles.typeGrid}>
            {incidentTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  incidentType === type.id && styles.typeButtonSelected,
                ]}
                onPress={() => setIncidentType(type.id)}
              >
                <MaterialIcons
                  name={type.icon as any}
                  size={20}
                  color={
                    incidentType === type.id
                      ? 'white'
                      : '#64748b'
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    incidentType === type.id && styles.typeButtonTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Severity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity Level</Text>
          <View style={styles.severityGrid}>
            {severityLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.severityButton,
                  { borderColor: level.color },
                  severity === level.id && { backgroundColor: level.color },
                ]}
                onPress={() => setSeverity(level.id as any)}
              >
                <Text
                  style={[
                    styles.severityButtonText,
                    { color: severity === level.id ? 'white' : level.color },
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Title</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Brief description of the incident"
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Provide a detailed description of what happened, when it occurred, and any relevant details..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Police Involvement */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.sectionTitle}>Police Notified</Text>
            <Switch
              value={policeNotified}
              onValueChange={setPoliceNotified}
              trackColor={{ false: '#64748b', true: '#2563eb' }}
              thumbColor={policeNotified ? '#2563eb' : '#64748b'}
            />
          </View>
          {policeNotified && (
            <TextInput
              style={styles.textInput}
              value={policeCase}
              onChangeText={setPoliceCase}
              placeholder="Police case number (if available)"
            />
          )}
        </View>

        {/* Witnesses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Witnesses</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={witnesses}
            onChangeText={setWitnesses}
            placeholder="List witness names, one per line (optional)"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Photo Evidence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Evidence</Text>
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <MaterialIcons name="camera-alt" size={24} color="#2563eb" />
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </TouchableOpacity>
          
          {photos.length > 0 && (
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Text style={styles.photoText}>Photo {index + 1}</Text>
                  <TouchableOpacity
                    style={styles.removePhoto}
                    onPress={() => removePhoto(index)}
                  >
                    <MaterialIcons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Location Info */}
        {location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationCard}>
              <MaterialIcons name="location-on" size={20} color="#2563eb" />
              <Text style={styles.locationText}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!validateForm() || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={submitIncident}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#222',
    flex: 1,
    textAlign: 'center',
    marginRight: 10,
  },
  headerSpacer: {
    width: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#222',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: '48%',
  },
  typeButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
    marginLeft: 8,
  },
  typeButtonTextSelected: {
    color: 'white',
  },
  severityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  severityButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 100,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
    borderWidth: 2,
    borderColor: '#a0d7ff',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    marginBottom: 12,
  },
  photoButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563eb',
    marginLeft: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    position: 'relative',
  },
  photoText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#4b5563',
  },
  removePhoto: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#4b5563',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    textAlign: 'center',
  },
}); 