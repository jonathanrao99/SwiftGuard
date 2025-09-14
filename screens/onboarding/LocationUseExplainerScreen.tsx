/**
 * SwiftGuard Location Use Explainer Screen
 * Explains why we collect location data and how it's used
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { logger } from '../../utils/Logger';

export default function LocationUseExplainerScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    try {
      setLoading(true);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'SwiftGuard needs location access to provide security services. You can change this later in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        return;
      }

      // Request background location permissions
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus.status !== 'granted') {
        Alert.alert(
          'Background Location Permission',
          'Background location access is required for emergency services and shift tracking. You can enable this later in your device settings.',
          [
            { text: 'Skip for Now', onPress: () => navigation.navigate('OnboardingComplete' as never) },
            { text: 'Enable', onPress: () => Location.requestBackgroundPermissionsAsync() },
          ]
        );
        return;
      }

      logger.info('Location permissions granted', { 
        foreground: status, 
        background: backgroundStatus.status 
      });

      navigation.navigate('OnboardingComplete' as never);

    } catch (error) {
      logger.error('Failed to request location permissions', { error: (error as Error).message });
      Alert.alert('Error', 'Failed to request location permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Location Access',
      'You can enable location access later in your device settings. Some features may not work without location access.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => navigation.navigate('OnboardingComplete' as never) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.title}>Location Access</Text>
          <Text style={styles.subtitle}>
            SwiftGuard needs location access to provide security services
          </Text>
        </View>

        <View style={styles.content}>
          {/* Why we need location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why We Need Location Access</Text>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🛡️</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Emergency Response</Text>
                <Text style={styles.featureDescription}>
                  Send your exact location to emergency services and security teams when you need help
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>📍</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Guard Dispatch</Text>
                <Text style={styles.featureDescription}>
                  Help us send the nearest available guard to your location quickly
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>⏰</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Shift Tracking</Text>
                <Text style={styles.featureDescription}>
                  Track your work shifts and ensure you're in the right location
                </Text>
              </View>
            </View>
          </View>

          {/* How we use location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use Your Location</Text>
            
            <View style={styles.usageItem}>
              <Text style={styles.usageTitle}>• Precise Location (While on Shift)</Text>
              <Text style={styles.usageDescription}>
                We collect your exact location only when you're actively working a security shift
              </Text>
            </View>

            <View style={styles.usageItem}>
              <Text style={styles.usageTitle}>• Approximate Location (Always)</Text>
              <Text style={styles.usageDescription}>
                We collect your general area to show nearby guards and services
              </Text>
            </View>

            <View style={styles.usageItem}>
              <Text style={styles.usageTitle}>• Emergency Location (When Needed)</Text>
              <Text style={styles.usageDescription}>
                We share your exact location with emergency services when you request help
              </Text>
            </View>
          </View>

          {/* Privacy and security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Security</Text>
            
            <View style={styles.privacyItem}>
              <Text style={styles.privacyTitle}>🔒 Encrypted Storage</Text>
              <Text style={styles.privacyDescription}>
                All location data is encrypted and stored securely
              </Text>
            </View>

            <View style={styles.privacyItem}>
              <Text style={styles.privacyTitle}>⏱️ Automatic Cleanup</Text>
              <Text style={styles.privacyDescription}>
                Location data is automatically deleted after 30 days
              </Text>
            </View>

            <View style={styles.privacyItem}>
              <Text style={styles.privacyTitle}>👥 Limited Access</Text>
              <Text style={styles.privacyDescription}>
                Only authorized security personnel can access your location
              </Text>
            </View>

            <View style={styles.privacyItem}>
              <Text style={styles.privacyTitle}>🎯 Purpose Limitation</Text>
              <Text style={styles.privacyDescription}>
                Location data is only used for security services, never for marketing
              </Text>
            </View>
          </View>

          {/* Data retention */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Retention</Text>
            <Text style={styles.retentionText}>
              • Location data is retained for 30 days after collection
            </Text>
            <Text style={styles.retentionText}>
              • Emergency location data may be retained longer for legal purposes
            </Text>
            <Text style={styles.retentionText}>
              • You can request deletion of your location data at any time
            </Text>
            <Text style={styles.retentionText}>
              • Location data is never shared with third parties except emergency services
            </Text>
          </View>

          {/* Your rights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <Text style={styles.rightsText}>
              • You can disable location access at any time in your device settings
            </Text>
            <Text style={styles.rightsText}>
              • You can request a copy of your location data
            </Text>
            <Text style={styles.rightsText}>
              • You can request deletion of your location data
            </Text>
            <Text style={styles.rightsText}>
              • You can contact us with privacy questions at privacy@swiftguard.com
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Requesting Permission...' : 'Allow Location Access'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  usageItem: {
    marginBottom: 16,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  usageDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginLeft: 16,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
    minWidth: 120,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    flex: 1,
  },
  retentionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  rightsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  skipButton: {
    flex: 1,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  continueButton: {
    flex: 2,
    padding: 16,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});




