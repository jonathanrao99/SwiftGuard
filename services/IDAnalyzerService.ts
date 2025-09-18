/**
 * ID Analyzer Service
 * Handles ID verification using ID Analyzer API
 */

import Constants from 'expo-constants';

interface IDAnalyzerConfig {
  apiKey: string;
  restrictedApiKey: string;
  baseUrl: string;
}

interface IDVerificationResult {
  success: boolean;
  data?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    documentNumber?: string;
    documentType?: string;
    expirationDate?: string;
    address?: string;
    nationality?: string;
    gender?: string;
    confidence?: number;
    isVerified?: boolean;
    rawResponse?: any;
  };
  error?: string;
}

class IDAnalyzerService {
  private config: IDAnalyzerConfig;

  constructor() {
    this.config = {
      apiKey: Constants.expoConfig?.extra?.ID_ANALYZER_SERVER_API_KEY || '',
      restrictedApiKey: Constants.expoConfig?.extra?.ID_ANALYZER_RESTRICTED_API_KEY || '',
      baseUrl: 'https://api.idanalyzer.com'
    };
  }

  /**
   * Verify ID document using ID Analyzer API
   */
  async verifyID(imageUri: string): Promise<IDVerificationResult> {
    try {
      if (!this.config.apiKey) {
        throw new Error('ID Analyzer API key not configured');
      }

      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);

      // Prepare form data for ID Analyzer API
      const formData = new FormData();
      formData.append('apikey', this.config.apiKey);
      formData.append('file_base64', base64Image);
      formData.append('country', 'US'); // Default to US, can be made configurable
      formData.append('outputformat', 'json');
      formData.append('verify_enabled', 'true');
      formData.append('verify_documentno', 'true');
      formData.append('verify_dob', 'true');
      formData.append('verify_expiry', 'true');

      console.log('🔍 Sending ID verification request to ID Analyzer...');

      const response = await fetch(`${this.config.baseUrl}/coreapi`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      console.log('📋 ID Analyzer response:', result);

      if (result.error) {
        return {
          success: false,
          error: result.error.message || 'ID verification failed'
        };
      }

      // Extract relevant information from the response
      const extractedData = this.extractIDData(result);

      return {
        success: true,
        data: extractedData
      };

    } catch (error) {
      console.error('❌ ID verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Convert image URI to base64 string
   */
  private async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data:image/jpeg;base64, prefix
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to convert image to base64');
    }
  }

  /**
   * Extract relevant data from ID Analyzer response
   */
  private extractIDData(response: any): any {
    const result = response.result || {};
    const document = result.document || {};
    const verification = result.verification || {};

    return {
      firstName: document.firstName || document.givenName,
      lastName: document.lastName || document.surname,
      dateOfBirth: document.dateOfBirth || document.dob,
      documentNumber: document.documentNumber || document.documentno,
      documentType: document.documentType || document.type,
      expirationDate: document.expirationDate || document.expiry,
      address: document.address || document.fullAddress,
      nationality: document.nationality || document.country,
      gender: document.gender || document.sex,
      confidence: result.confidence || 0,
      isVerified: verification.verified || false,
      rawResponse: response
    };
  }

  /**
   * Get service status
   */
  getStatus(): { configured: boolean; hasApiKey: boolean } {
    return {
      configured: !!this.config.apiKey && !!this.config.restrictedApiKey,
      hasApiKey: !!this.config.apiKey
    };
  }
}

// Export singleton instance
export const idAnalyzerService = new IDAnalyzerService();
export default idAnalyzerService;
