// Environment variables are loaded from .env file automatically by Expo
import appJson from './app.json';

// SECURITY: Validate critical environment variables
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
};

const optionalEnvVars = {
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
};

// Check for missing required environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export default {
  expo: {
    ...appJson.expo,
    plugins: [
      "expo-font",
      "expo-video"
    ],
    extra: {
      ...appJson.expo.extra,
      ...requiredEnvVars,
      ...optionalEnvVars,
    },
  },
}; 