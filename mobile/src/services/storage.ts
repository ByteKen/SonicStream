/**
 * MMKV storage — fast key-value store for auth tokens & local metadata.
 * react-native-mmkv v4 uses createMMKV() factory.
 */

import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'spotify-clone-storage',
});
