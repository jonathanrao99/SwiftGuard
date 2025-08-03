import { Alert } from 'react-native';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle different types of errors
   */
  handleError(error: any, context?: string): AppError {
    const appError = this.normalizeError(error, context);
    
    // Log error
    this.logError(appError);
    
    // Handle based on severity
    switch (appError.severity) {
      case 'critical':
        this.handleCriticalError(appError);
        break;
      case 'high':
        this.handleHighError(appError);
        break;
      case 'medium':
        this.handleMediumError(appError);
        break;
      case 'low':
        this.handleLowError(appError);
        break;
    }

    return appError;
  }

  /**
   * Normalize different error types to AppError
   */
  private normalizeError(error: any, context?: string): AppError {
    if (error instanceof Error) {
      return {
        code: 'GENERIC_ERROR',
        message: error.message,
        details: { stack: error.stack, context },
        severity: 'medium',
      };
    }

    if (typeof error === 'string') {
      return {
        code: 'STRING_ERROR',
        message: error,
        details: { context },
        severity: 'low',
      };
    }

    if (error?.code && error?.message) {
      return {
        code: error.code,
        message: error.message,
        details: { ...error, context },
        severity: this.determineSeverity(error.code),
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: { error, context },
      severity: 'medium',
    };
  }

  /**
   * Determine error severity based on error code
   */
  private determineSeverity(code: string): AppError['severity'] {
    const criticalCodes = ['AUTH_FAILED', 'NETWORK_ERROR', 'DATABASE_ERROR'];
    const highCodes = ['VALIDATION_ERROR', 'PERMISSION_DENIED'];
    const lowCodes = ['WARNING', 'INFO'];

    if (criticalCodes.includes(code)) return 'critical';
    if (highCodes.includes(code)) return 'high';
    if (lowCodes.includes(code)) return 'low';
    return 'medium';
  }

  /**
   * Handle critical errors
   */
  private handleCriticalError(error: AppError) {
    console.error('🚨 CRITICAL ERROR:', error);
    
    Alert.alert(
      'Critical Error',
      'A critical error has occurred. Please restart the app or contact support.',
      [
        { text: 'OK', onPress: () => this.reportError(error) },
      ]
    );
  }

  /**
   * Handle high severity errors
   */
  private handleHighError(error: AppError) {
    console.error('⚠️ HIGH ERROR:', error);
    
    Alert.alert(
      'Error',
      error.message || 'Something went wrong. Please try again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => this.retryAction(error) },
      ]
    );
  }

  /**
   * Handle medium severity errors
   */
  private handleMediumError(error: AppError) {
    console.warn('⚠️ MEDIUM ERROR:', error);
    
    // Show toast or subtle notification
    // For now, just log to console
  }

  /**
   * Handle low severity errors
   */
  private handleLowError(error: AppError) {
    console.log('ℹ️ LOW ERROR:', error);
    // Just log, no user notification needed
  }

  /**
   * Log error for debugging
   */
  private logError(error: AppError) {
    this.errorLog.push({
      ...error,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }

  /**
   * Report error to external service
   */
  private reportError(error: AppError) {
    // In a real app, you'd send this to your error reporting service
    console.log('📤 Reporting error:', error);
  }

  /**
   * Retry action (placeholder)
   */
  private retryAction(error: AppError) {
    console.log('🔄 Retrying action for error:', error);
    // Implement retry logic based on error context
  }

  /**
   * Get error log
   */
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Handle network errors specifically
   */
  handleNetworkError(error: any) {
    const networkError: AppError = {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet connection.',
      details: error,
      severity: 'high',
    };

    return this.handleError(networkError, 'Network');
  }

  /**
   * Handle authentication errors specifically
   */
  handleAuthError(error: any) {
    const authError: AppError = {
      code: 'AUTH_FAILED',
      message: 'Authentication failed. Please log in again.',
      details: error,
      severity: 'critical',
    };

    return this.handleError(authError, 'Authentication');
  }

  /**
   * Handle validation errors specifically
   */
  handleValidationError(field: string, message: string) {
    const validationError: AppError = {
      code: 'VALIDATION_ERROR',
      message: `${field}: ${message}`,
      details: { field, message },
      severity: 'medium',
    };

    return this.handleError(validationError, 'Validation');
  }

  /**
   * Handle database errors specifically
   */
  handleDatabaseError(error: any) {
    const dbError: AppError = {
      code: 'DATABASE_ERROR',
      message: 'Database operation failed. Please try again.',
      details: error,
      severity: 'high',
    };

    return this.handleError(dbError, 'Database');
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: any, context?: string) => 
  errorHandler.handleError(error, context);

export const handleNetworkError = (error: any) => 
  errorHandler.handleNetworkError(error);

export const handleAuthError = (error: any) => 
  errorHandler.handleAuthError(error);

export const handleValidationError = (field: string, message: string) => 
  errorHandler.handleValidationError(field, message);

export const handleDatabaseError = (error: any) => 
  errorHandler.handleDatabaseError(error); 