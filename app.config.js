// Load environment variables from .env file
import { config } from 'dotenv';

// Load .env file
config();

// Import app.json using require for better compatibility
const appJson = require('./app.json');

// SECURITY: Validate critical environment variables
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
};

const optionalEnvVars = {
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  ID_ANALYZER_SERVER_API_KEY: process.env.ID_ANALYZER_SERVER_API_KEY,
  ID_ANALYZER_RESTRICTED_API_KEY: process.env.ID_ANALYZER_RESTRICTED_API_KEY,
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
    updates: {
      url: "https://u.expo.dev/61411682-2546-4ab5-b319-1bba68870668"
    },
    extra: {
      ...appJson.expo.extra,
      eas: {
        projectId: "61411682-2546-4ab5-b319-1bba68870668"
      },
      ...requiredEnvVars,
      ...optionalEnvVars,
    },
  },
}; 