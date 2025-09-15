import CryptoJS from 'crypto-js';

// Get encryption key from environment or generate a default one
const getEncryptionKey = (): string => {
  const key = process.env.LOCATION_ENCRYPTION_KEY || 'swiftguard-location-key-2024';
  return CryptoJS.SHA256(key).toString();
};

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface EncryptedLocationData {
  encrypted: string;
  iv: string;
}

/**
 * Encrypt location data for secure storage
 */
export const encryptLocationData = (location: LocationData): EncryptedLocationData => {
  try {
    const key = getEncryptionKey();
    const iv = CryptoJS.lib.WordArray.random(128/8);
    
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(location),
      key,
      { iv: iv }
    );

    return {
      encrypted: encrypted.toString(),
      iv: iv.toString()
    };
  } catch (error) {
    // Log error through proper logging service
    throw new Error(`Location encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt location data
 */
export const decryptLocationData = (encryptedData: EncryptedLocationData): LocationData => {
  try {
    const key = getEncryptionKey();
    const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
    
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData.encrypted,
      key,
      { iv: iv }
    );

    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Failed to decrypt location data');
    }

    return JSON.parse(decryptedString);
  } catch (error) {
    // Log error through proper logging service
    throw new Error(`Location decryption failed: ${error.message}`);
  }
};

/**
 * Encrypt location data for database storage
 */
export const encryptLocationForStorage = (location: LocationData): string => {
  const encrypted = encryptLocationData(location);
  return JSON.stringify(encrypted);
};

/**
 * Decrypt location data from database storage
 */
export const decryptLocationFromStorage = (encryptedString: string): LocationData => {
  const encryptedData = JSON.parse(encryptedString);
  return decryptLocationData(encryptedData);
};

/**
 * Check if a string is encrypted location data
 */
export const isEncryptedLocationData = (data: string): boolean => {
  try {
    const parsed = JSON.parse(data);
    return parsed.encrypted && parsed.iv;
  } catch {
    return false;
  }
};
