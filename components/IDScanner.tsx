/**
 * ID Scanner Component
 * Handles camera scanning for ID verification
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING } from '../theme';

interface IDScannerProps {
  visible: boolean;
  onClose: () => void;
  onIDScanned: (imageUri: string) => void;
  onError?: (error: string) => void;
}

const { width, height } = Dimensions.get('window');

export default function IDScanner({ visible, onClose, onIDScanned, onError }: IDScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission]);

  const requestCameraPermission = async () => {
    try {
      const result = await requestPermission();
      
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to scan ID documents.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      onError?.('Failed to request camera permission');
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isScanning) return;

    try {
      setIsScanning(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        onIDScanned(photo.uri);
        onClose();
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      onError?.('Failed to take picture');
    } finally {
      setIsScanning(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 2],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onIDScanned(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      onError?.('Failed to pick image from gallery');
    }
  };

  const toggleFlash = () => {
    setFlashMode(flashMode === 'off' ? 'on' : 'off');
  };

  const toggleCameraType = () => {
    setCameraType(cameraType === 'back' ? 'front' : 'back');
  };

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <MaterialIcons name="camera-alt" size={64} color="#ccc" />
          <Text style={styles.permissionText}>Camera access denied</Text>
          <Text style={styles.permissionSubtext}>
            Please enable camera access in your device settings to scan ID documents.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <StatusBar hidden />
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          flash={flashMode}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan ID Document</Text>
            <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
              <MaterialIcons 
                name={flashMode === 'on' ? "flash-on" : "flash-off"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Scanning Overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanningArea}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.instructionText}>
              Position the ID document within the frame
            </Text>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.controlButton} onPress={pickImageFromGallery}>
              <MaterialIcons name="photo-library" size={24} color="white" />
              <Text style={styles.controlButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.captureButton, isScanning && styles.captureButtonDisabled]} 
              onPress={takePicture}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
              <MaterialIcons name="flip-camera-ios" size={24} color="white" />
              <Text style={styles.controlButtonText}>Flip</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: SPACING.lg,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginTop: SPACING.lg,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningArea: {
    width: width * 0.8,
    height: width * 0.5,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.primary,
    borderWidth: 3,
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    top: 'auto',
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  },
});
