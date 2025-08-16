// Import WebSocket polyfill first
import './utils/websocketPolyfill';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';



// Get environment variables from Expo config
const extra = (Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra;

const SUPABASE_URL = extra?.SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = extra?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file and app.config.js');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Type-safe Supabase client
export type SupabaseClient = typeof supabase; 