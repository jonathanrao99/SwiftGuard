import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../design-system';
import { NavigationProps, Incident } from '../../types';
import { supabase } from '../../supabaseClient';

interface IncidentReportScreenProps {
  navigation: NavigationProps;
  route: {
    params?: {
      jobId?: string;
    };
  };
}

const incidentTypes = [
  { id: 'security_breach', label: 'Security Breach', icon: 'security', color: '#dc2626' },
  { id: 'medical_emergency', label: 'Medical Emergency', icon: 'local-hospital', color: '#ef4444' },
  { id: 'fire', label: 'Fire Emergency', icon: 'local-fire-department', color: '#f97316' },
  { id: 'theft', label: 'Theft/Burglary', icon: 'gavel', color: '#7c2d12' },
  { id: 'disturbance', label: 'Disturbance', icon: 'warning', color: '#f59e0b' },
  { id: 'other', label: 'Other', icon: 'help-outline', color: '#64748b' },
];

const severityLevels = [
  { id: 'low', label: 'Low', color: '#22c55e' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#ef4444' },
  { id: 'critical', label: 'Critical', color: '#dc2626' },
];

export default function IncidentReportScreen({ navigation, route }: IncidentReportScreenProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [policeInvolved, setPoliceInvolved] = useState(false);
  const [policeReportNumber, setPoliceReportNumber] = useState('');
  const [medicalAttention, setMedicalAttention] = useState(false);
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const jobId = route.params?.jobId;

  const handleSubmit = async () => {
    if (!selectedType || !severity || !title || !description) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);

      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      let currentLocation = 'Location not available';
      
      if (status === 'granted') {
        const locationData = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude,
        });
        
        if (address[0]) {
          currentLocation = `${address[0].street || ''} ${address[0].city || ''}, ${address[0].region || ''}`.trim();
        }
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Create incident record
      const incident: Partial<Incident> = {
        job_id: jobId,
        guard_id: user.id,
        incident_type: selectedType as any,
        severity: severity as any,
        title,
        description,
        location: location || currentLocation,
        evidence_photos: evidencePhotos,
        witnesses: witnesses.split(',').map(w => w.trim()).filter(w => w),
        police_involved: policeInvolved,
        police_report_number: policeReportNumber || undefined,
        medical_attention_required: medicalAttention,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('incidents')
        .insert([incident]);

      if (error) throw error;

      Alert.alert(
        'Incident Reported',
        'Your incident report has been submitted successfully. The client and emergency contacts have been notified.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting incident:', error);
      Alert.alert('Error', 'Failed to submit incident report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setEvidencePhotos([...evidencePhotos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = evidencePhotos.filter((_, i) => i !== index);
    setEvidencePhotos(newPhotos);
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Incident</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Incident Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incident Type *</Text>
            <View style={styles.typeGrid}>
              {incidentTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    selectedType === type.id && { 
                      backgroundColor: `${type.color}20`,
                      borderColor: type.color 
                    }
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <MaterialIcons 
                    name={type.icon as any} 
                    size={24} 
                    color={selectedType === type.id ? type.color : '#64748b'} 
                  />
                  <Text style={[
                    styles.typeLabel,
                    selectedType === type.id && { color: type.color }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Severity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Severity Level *</Text>
            <View style={styles.severityRow}>
              {severityLevels.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.severityButton,
                    severity === level.id && { 
                      backgroundColor: level.color,
                    }
                  ]}
                  onPress={() => setSeverity(level.id)}
                >
                  <Text style={[
                    styles.severityText,
                    severity === level.id && { color: '#fff' }
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incident Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Brief description of the incident"
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detailed Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide detailed information about what happened, when, and any actions taken..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specific Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Specific location within the premises (optional)"
            />
          </View>

          {/* Witnesses */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Witnesses</Text>
            <TextInput
              style={styles.input}
              value={witnesses}
              onChangeText={setWitnesses}
              placeholder="Names of witnesses (comma separated)"
            />
          </View>

          {/* Police Involvement */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setPoliceInvolved(!policeInvolved)}
            >
              <MaterialIcons 
                name={policeInvolved ? "check-box" : "check-box-outline-blank"} 
                size={24} 
                color="#2563eb" 
              />
              <Text style={styles.checkboxText}>Police were involved</Text>
            </TouchableOpacity>
            
            {policeInvolved && (
              <TextInput
                style={[styles.input, { marginTop: theme.spacing.sm }]}
                value={policeReportNumber}
                onChangeText={setPoliceReportNumber}
                placeholder="Police report number (if available)"
              />
            )}
          </View>

          {/* Medical Attention */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setMedicalAttention(!medicalAttention)}
            >
              <MaterialIcons 
                name={medicalAttention ? "check-box" : "check-box-outline-blank"} 
                size={24} 
                color="#2563eb" 
              />
              <Text style={styles.checkboxText}>Medical attention was required</Text>
            </TouchableOpacity>
          </View>

          {/* Evidence Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidence Photos</Text>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <MaterialIcons name="camera-alt" size={24} color="#2563eb" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            {evidencePhotos.length > 0 && (
              <View style={styles.photosContainer}>
                {evidencePhotos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Text style={styles.photoName}>Photo {index + 1}</Text>
                    <TouchableOpacity onPress={() => removePhoto(index)}>
                      <MaterialIcons name="delete" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedType || !severity || !title || !description || loading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!selectedType || !severity || !title || !description || loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Incident Report'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  
  headerTitle: {
    ...theme.typography.h3,
    color: '#222',
  },
  
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['6xl'],
  },
  
  section: {
    marginBottom: theme.spacing.xl,
  },
  
  sectionTitle: {
    ...theme.typography.bodyMedium,
    color: '#222',
    marginBottom: theme.spacing.md,
  },
  
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  
  typeButton: {
    width: '48%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  
  typeLabel: {
    ...theme.typography.small,
    color: '#64748b',
    textAlign: 'center',
  },
  
  severityRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  
  severityButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  
  severityText: {
    ...theme.typography.smallMedium,
    color: '#222',
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: '#222',
  },
  
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  
  checkboxText: {
    ...theme.typography.body,
    color: '#222',
  },
  
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: theme.borderRadius.md,
    borderStyle: 'dashed',
  },
  
  photoButtonText: {
    ...theme.typography.bodyMedium,
    color: '#2563eb',
  },
  
  photosContainer: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  
  photoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: '#f9fafb',
    borderRadius: theme.borderRadius.sm,
  },
  
  photoName: {
    ...theme.typography.small,
    color: '#64748b',
  },
  
  submitButton: {
    backgroundColor: '#2563eb',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  
  submitButtonText: {
    ...theme.typography.button,
    color: '#fff',
  },
}); 