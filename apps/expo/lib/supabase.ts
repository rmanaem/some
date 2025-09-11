/**
 * Mobile-specific Supabase client.
 * Polyfills URL/URLSearchParams for Hermes (React-Native engine) so Supabase
 * query strings and OAuth flows work correctly.
 */

import 'react-native-url-polyfill/auto'; // ① full WHATWG URL in RN
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

/* ------------------------- Environment validation ------------------------- */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Ensure EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY are set in apps/expo/.env.local'
  );
}

/* --------------------- Encrypted storage adapter -------------------------- */
/**
 * Implements the web Storage interface (getItem, setItem, removeItem) on top
 * of Expo SecureStore. Keys/values are encrypted at rest by the OS and survive
 * app restarts. Maximum value size = 2048 bytes (plenty for a JWT).
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};

/* ------------------------ Supabase client ----------------------- */
/**
 * Shared, typed client for the mobile app.
 * Auth sessions are persisted encrypted and auto-refreshed.
 * Imported wherever DB, Auth or Realtime calls are needed.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // ② enable after OAuth deep-links added
  },
});
