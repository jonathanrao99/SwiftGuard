import Constants from 'expo-constants';

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  API_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  GOOGLE_PLACES_API_KEY: string;
  SENTRY_DSN?: string;
  ANALYTICS_ENABLED: boolean;
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  FEATURE_FLAGS: {
    ENHANCED_SECURITY: boolean;
    REAL_TIME_TRACKING: boolean;
    ADVANCED_ANALYTICS: boolean;
    PAYMENT_PROCESSING: boolean;
    BACKGROUND_CHECKS: boolean;
  };
}

const getEnvironment = (): Environment => {
  const env = Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT;
  
  if (__DEV__) return 'development';
  if (env === 'staging') return 'staging';
  if (env === 'production') return 'production';
  
  return 'development';
};

const configurations: Record<Environment, EnvironmentConfig> = {
  development: {
    API_URL: 'http://localhost:3000/api',
    SUPABASE_URL: Constants.expoConfig?.extra?.SUPABASE_URL || 'http://localhost:54321',
    SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '',
    STRIPE_PUBLISHABLE_KEY: Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY || '',
    GOOGLE_PLACES_API_KEY: Constants.expoConfig?.extra?.GOOGLE_PLACES_API_KEY || '',
    ANALYTICS_ENABLED: false,
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    FEATURE_FLAGS: {
      ENHANCED_SECURITY: true,
      REAL_TIME_TRACKING: true,
      ADVANCED_ANALYTICS: false,
      PAYMENT_PROCESSING: true,
      BACKGROUND_CHECKS: false,
    },
  },
  
  staging: {
    API_URL: 'https://staging-api.swiftguard.com/api',
    SUPABASE_URL: Constants.expoConfig?.extra?.SUPABASE_URL_STAGING || '',
    SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.SUPABASE_ANON_KEY_STAGING || '',
    STRIPE_PUBLISHABLE_KEY: Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY_STAGING || '',
    GOOGLE_PLACES_API_KEY: Constants.expoConfig?.extra?.GOOGLE_PLACES_API_KEY || '',
    SENTRY_DSN: Constants.expoConfig?.extra?.SENTRY_DSN_STAGING,
    ANALYTICS_ENABLED: true,
    DEBUG_MODE: false,
    LOG_LEVEL: 'warn',
    FEATURE_FLAGS: {
      ENHANCED_SECURITY: true,
      REAL_TIME_TRACKING: true,
      ADVANCED_ANALYTICS: true,
      PAYMENT_PROCESSING: true,
      BACKGROUND_CHECKS: true,
    },
  },
  
  production: {
    API_URL: 'https://api.swiftguard.com/api',
    SUPABASE_URL: Constants.expoConfig?.extra?.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '',
    STRIPE_PUBLISHABLE_KEY: Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY || '',
    GOOGLE_PLACES_API_KEY: Constants.expoConfig?.extra?.GOOGLE_PLACES_API_KEY || '',
    SENTRY_DSN: Constants.expoConfig?.extra?.SENTRY_DSN,
    ANALYTICS_ENABLED: true,
    DEBUG_MODE: false,
    LOG_LEVEL: 'error',
    FEATURE_FLAGS: {
      ENHANCED_SECURITY: true,
      REAL_TIME_TRACKING: true,
      ADVANCED_ANALYTICS: true,
      PAYMENT_PROCESSING: true,
      BACKGROUND_CHECKS: true,
    },
  },
};

export const currentEnvironment = getEnvironment();
export const config = configurations[currentEnvironment];

// Validation
const requiredKeys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;

for (const key of requiredKeys) {
  if (!config[key]) {
    throw new Error(`Missing required environment variable: ${key} for environment: ${currentEnvironment}`);
  }
}

// Feature flag utilities
export const isFeatureEnabled = (feature: keyof typeof config.FEATURE_FLAGS): boolean => {
  return config.FEATURE_FLAGS[feature];
};

// Logging utilities
export const shouldLog = (level: typeof config.LOG_LEVEL): boolean => {
  const levels = ['error', 'warn', 'info', 'debug'];
  const currentLevelIndex = levels.indexOf(config.LOG_LEVEL);
  const requestedLevelIndex = levels.indexOf(level);
  
  return requestedLevelIndex <= currentLevelIndex;
};

// Environment helpers
export const isDevelopment = () => currentEnvironment === 'development';
export const isStaging = () => currentEnvironment === 'staging';
export const isProduction = () => currentEnvironment === 'production';

// API helpers
export const getApiUrl = (endpoint: string): string => {
  return `${config.API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

// Security helpers
export const getSecurityConfig = () => ({
  enableBiometrics: isFeatureEnabled('ENHANCED_SECURITY'),
  enableRealTimeTracking: isFeatureEnabled('REAL_TIME_TRACKING'),
  enableAdvancedAnalytics: isFeatureEnabled('ADVANCED_ANALYTICS'),
  maxRetries: isProduction() ? 3 : 1,
  timeoutMs: isProduction() ? 10000 : 5000,
});

// Debug helpers
export const debugLog = (message: string, data?: any) => {
  if (config.DEBUG_MODE && shouldLog('debug')) {
    console.log(`[SwiftGuard Debug] ${message}`, data);
  }
};

export const errorLog = (message: string, error?: any) => {
  if (shouldLog('error')) {
    console.error(`[SwiftGuard Error] ${message}`, error);
  }
};

export const warnLog = (message: string, data?: any) => {
  if (shouldLog('warn')) {
    console.warn(`[SwiftGuard Warning] ${message}`, data);
  }
};

export default config;
