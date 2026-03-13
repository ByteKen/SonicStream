/**
 * Supabase client for React Native.
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { storage } from './storage';

const SUPABASE_URL = 'https://gkzeahgmvtuoernjdslx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pXIKypNbWWtHuPDz9lDclA_dlIxGXjx';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use MMKV for session persistence instead of AsyncStorage
    storage: {
      getItem: (key: string) => {
        const value = storage.getString(key);
        return Promise.resolve(value ?? null);
      },
      setItem: (key: string, value: string) => {
        storage.set(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        storage.remove(key);
        return Promise.resolve();
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
