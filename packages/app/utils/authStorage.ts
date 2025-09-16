import * as SecureStore from 'expo-secure-store';

const SUPABASE_TOKEN_KEY = 'sb-token';

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
