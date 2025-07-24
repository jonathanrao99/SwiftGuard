import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

interface CheckpointScreenProps {
  navigation: any;
  route: {
    params?: {
      jobId?: string;
    };
  };
}

export default function CheckpointScreen({ navigation, route }: CheckpointScreenProps) {
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [checkpointName, setCheckpointName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const jobId = route.params?.jobId;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required for checkpoint verification.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setCurrentLocation({
        coords: location.coords,
        address: address[0],
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location.');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take checkpoint photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const submitCheckpoint = async () => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'Please enable location services to submit checkpoint.');
      return;
    }

    if (!photo) {
      Alert.alert('Photo Required', 'Please take a photo to verify the checkpoint.');
      return;
    }

    if (!checkpointName.trim()) {
      Alert.alert('Checkpoint Name Required', 'Please enter a name for this checkpoint.');
      return;
    }

    try {
      setLoading(true);

      // Here you would upload the photo and submit checkpoint data
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Checkpoint Recorded',
        'Your checkpoint has been successfully recorded and verified.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting checkpoint:', error);
      Alert.alert('Error', 'Failed to submit checkpoint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Address not available';
    return `${address.street || ''} ${address.name || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
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
          <Text style={styles.headerTitle}>Checkpoint Verification</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Location Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Location</Text>
            <View style={styles.locationCard}>
              <MaterialIcons name="location-on" size={24} color="#2563eb" />
              <View style={styles.locationText}>
                <Text style={styles.locationAddress}>
                  {currentLocation ? formatAddress(currentLocation.address) : 'Getting location...'}
                </Text>
                {currentLocation && (
                  <Text style={styles.locationCoords}>
                    {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={getCurrentLocation}>
                <MaterialIcons name="refresh" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Checkpoint Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checkpoint Name *</Text>
            <TextInput
              style={styles.input}
              value={checkpointName}
              onChangeText={setCheckpointName}
              placeholder="e.g., Main Entrance, Parking Lot A, Security Office"
              maxLength={50}
            />
          </View>

          {/* Photo Verification */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo Verification *</Text>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photoPreview} />
              ) : (
                <>
                  <MaterialIcons name="camera-alt" size={48} color="#2563eb" />
                  <Text style={styles.photoButtonText}>Take Checkpoint Photo</Text>
                </>
              )}
            </TouchableOpacity>
            {photo && (
              <TouchableOpacity style={styles.retakeButton} onPress={takePhoto}>
                <MaterialIcons name="camera-alt" size={20} color="#2563eb" />
                <Text style={styles.retakeText}>Retake Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any observations or notes about this checkpoint..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!currentLocation || !photo || !checkpointName.trim() || loading) && styles.submitButtonDisabled
            ]}
            onPress={submitCheckpoint}
            disabled={!currentLocation || !photo || !checkpointName.trim() || loading}
          >
            <MaterialIcons 
              name="check-circle" 
              size={24} 
              color="#ffffff" 
              style={{ marginRight: 8 }} 
            />
            <Text style={styles.submitButtonText}>
              {loading ? 'Recording Checkpoint...' : 'Record Checkpoint'}
            </Text>
          </TouchableOpacity>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialIcons name="info-outline" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Checkpoints help verify your location and patrol activities. Take a clear photo of your current location.
            </Text>
          </View>
        </View>
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
  
  content: {
    flex: 1,
    padding: 16,
  },
  
  section: {
    marginBottom: 24,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 12,
  },
  
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  locationText: {
    flex: 1,
    marginLeft: 12,
  },
  
  locationAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 4,
  },
  
  locationCoords: {
    fontSize: 14,
    color: '#64748b',
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  photoButton: {
    height: 200,
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
  },
  
  photoButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
    marginTop: 8,
  },
  
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
  },
  
  retakeText: {
    fontSize: 14,
    color: '#2563eb',
    marginLeft: 4,
  },
  
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  
  infoText: {
    fontSize: 14,
    color: '#1d4ed8',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
}); 