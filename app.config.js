// Environment variables are loaded from .env file automatically by Expo
import appJson from './app.json';

export default {
  expo: {
    ...appJson.expo,
<<<<<<< HEAD
    plugins: [
      "expo-font",
      "expo-video"
    ],
=======
>>>>>>> parent of c623858 (Enhance app configuration and payment functions: Updated app.config.js to include expo-font plugin, improved App.tsx with monitoring initialization, and refined metro.config.js for better module resolution. Enhanced Supabase functions with TypeScript interfaces for better type safety and error handling in payment methods and setup intent functions.)
    extra: {
      ...appJson.expo.extra,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    },
  },
}; 