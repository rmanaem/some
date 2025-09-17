import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const projectId = supabaseUrl.match(/^https?:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '';
const SUPABASE_TOKEN_KEY = `sb-${projectId}-auth-token`;

export const authStorage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(SUPABASE_TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    return SecureStore.setItemAsync(SUPABASE_TOKEN_KEY, token);
  },
  async removeToken(): Promise<void> {
    return SecureStore.deleteItemAsync(SUPABASE_TOKEN_KEY);
  },
};
