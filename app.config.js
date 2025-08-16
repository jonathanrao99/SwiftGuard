// Environment variables are loaded from .env file automatically by Expo
import appJson from './app.json';

export default {
  expo: {
    ...appJson.expo,
    plugins: [
      ...(appJson.expo.plugins || []),
      "expo-font"
    ],
    extra: {
      ...appJson.expo.extra,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    },
  },
}; 