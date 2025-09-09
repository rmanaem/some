import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get environment variables (works for both Expo and Next.js)
const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
