import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

interface BiometricConfig {
  promptMessage: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
  requireConfirmation?: boolean;
}

interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

export class BiometricAuth {
  private static readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private static readonly LAST_AUTH_KEY = 'last_biometric_auth';
  private static readonly AUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if biometric authentication is available
   */
  static async isAvailable(): Promise<{
    available: boolean;
    biometricTypes: LocalAuthentication.AuthenticationType[];
    error?: string;
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      
      if (!hasHardware) {
        return {
          available: false,
          biometricTypes: [],
          error: 'Biometric hardware not available',
        };
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isEnrolled) {
        return {
          available: false,
          biometricTypes: supportedTypes,
          error: 'No biometric data enrolled',
        };
      }

      return {
        available: true,
        biometricTypes: supportedTypes,
      };
    } catch (error) {
      return {
        available: false,
        biometricTypes: [],
        error: 'Error checking biometric availability',
      };
    }
  }

  /**
   * Authenticate using biometrics
   */
  static async authenticate(config: BiometricConfig): Promise<BiometricResult> {
    try {
      const availability = await this.isAvailable();
      
      if (!availability.available) {
        return {
          success: false,
          error: availability.error,
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: config.promptMessage,
        fallbackLabel: config.fallbackLabel,
        disableDeviceFallback: config.disableDeviceFallback ?? false,
        requireConfirmation: config.requireConfirmation ?? true,
      });

      if (result.success) {
        await this.recordSuccessfulAuth();
        return {
          success: true,
          biometricType: this.getBiometricTypeString(availability.biometricTypes[0]),
        };
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Biometric authentication error',
      };
    }
  }

  /**
   * Enable biometric authentication for the app
   */
  static async enableBiometricAuth(): Promise<boolean> {
    try {
      const availability = await this.isAvailable();
      
      if (!availability.available) {
        Alert.alert(
          'Biometric Authentication Unavailable',
          availability.error || 'Please set up biometric authentication in your device settings.'
        );
        return false;
      }

      const authResult = await this.authenticate({
        promptMessage: 'Enable biometric authentication for SwiftGuard',
        fallbackLabel: 'Use passcode',
      });

      if (authResult.success) {
        await AsyncStorage.setItem(this.BIOMETRIC_ENABLED_KEY, 'true');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication
   */
  static async disableBiometricAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.BIOMETRIC_ENABLED_KEY);
      await AsyncStorage.removeItem(this.LAST_AUTH_KEY);
    } catch (error) {
      console.error('Error disabling biometric auth:', error);
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(this.BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user needs to re-authenticate
   */
  static async needsReauth(): Promise<boolean> {
    try {
      const lastAuthStr = await AsyncStorage.getItem(this.LAST_AUTH_KEY);
      
      if (!lastAuthStr) return true;
      
      const lastAuth = parseInt(lastAuthStr, 10);
      const now = Date.now();
      
      return (now - lastAuth) > this.AUTH_TIMEOUT;
    } catch (error) {
      return true;
    }
  }

  /**
   * Prompt for biometric authentication if enabled and needed
   */
  static async promptIfNeeded(
    action: string = 'access this feature'
  ): Promise<boolean> {
    try {
      const isEnabled = await this.isBiometricEnabled();
      
      if (!isEnabled) return true;
      
      const needsAuth = await this.needsReauth();
      
      if (!needsAuth) return true;

      const result = await this.authenticate({
        promptMessage: `Use biometric authentication to ${action}`,
        fallbackLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('Error in biometric prompt:', error);
      return false;
    }
  }

  /**
   * Record successful authentication
   */
  private static async recordSuccessfulAuth(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.LAST_AUTH_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error recording auth time:', error);
    }
  }

  /**
   * Get human-readable biometric type
   */
  private static getBiometricTypeString(
    type: LocalAuthentication.AuthenticationType
  ): string {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Fingerprint';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'Face Recognition';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris Recognition';
      default:
        return 'Biometric';
    }
  }

  /**
   * Get security level for current biometric setup
   */
  static async getSecurityLevel(): Promise<{
    level: 'none' | 'low' | 'medium' | 'high';
    details: string;
  }> {
    try {
      const availability = await this.isAvailable();
      const isEnabled = await this.isBiometricEnabled();
      
      if (!availability.available || !isEnabled) {
        return {
          level: 'none',
          details: 'Biometric authentication not set up',
        };
      }

      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
      
      switch (securityLevel) {
        case LocalAuthentication.SecurityLevel.NONE:
          return {
            level: 'none',
            details: 'No biometric security',
          };
        case LocalAuthentication.SecurityLevel.SECRET:
          return {
            level: 'low',
            details: 'Basic biometric security',
          };
        case LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK:
          return {
            level: 'medium',
            details: 'Weak biometric security',
          };
        case LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG:
          return {
            level: 'high',
            details: 'Strong biometric security',
          };
        default:
          return {
            level: 'medium',
            details: 'Unknown security level',
          };
      }
    } catch (error) {
      return {
        level: 'none',
        details: 'Unable to determine security level',
      };
    }
  }

  /**
   * Show biometric setup guide
   */
  static showSetupGuide(): void {
    const isIOS = Platform.OS === 'ios';
    
    Alert.alert(
      'Set Up Biometric Authentication',
      `To use biometric authentication with SwiftGuard:\n\n${
        isIOS
          ? '1. Open Settings\n2. Go to Face ID & Passcode or Touch ID & Passcode\n3. Enable Face ID or Touch ID\n4. Return to SwiftGuard to enable'
          : '1. Open Settings\n2. Go to Security & location\n3. Go to Fingerprint\n4. Add your fingerprint\n5. Return to SwiftGuard to enable'
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            // In a real app, you'd use Linking.openSettings()
            console.log('Open device settings');
          }
        },
      ]
    );
  }
}

// Hook for easy biometric authentication
export const useBiometricAuth = () => {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const enabled = await BiometricAuth.isBiometricEnabled();
    setIsEnabled(enabled);
  };

  const enableBiometrics = async () => {
    setIsLoading(true);
    const success = await BiometricAuth.enableBiometricAuth();
    setIsEnabled(success);
    setIsLoading(false);
    return success;
  };

  const disableBiometrics = async () => {
    await BiometricAuth.disableBiometricAuth();
    setIsEnabled(false);
  };

  const authenticate = async (action?: string) => {
    setIsLoading(true);
    const success = await BiometricAuth.promptIfNeeded(action);
    setIsLoading(false);
    return success;
  };

  return {
    isEnabled,
    isLoading,
    enableBiometrics,
    disableBiometrics,
    authenticate,
    checkBiometricStatus,
  };
};

export default BiometricAuth;
