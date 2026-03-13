/**
 * AppUpdater — checks the backend /version endpoint and prompts
 * the user to download a new APK when available.
 */

import { Alert, Linking, Platform } from 'react-native';
import { version as currentVersion } from '../../package.json';

const VERSION_URL = 'https://sonicstream-kpji.onrender.com/version';

interface VersionInfo {
  latest_version: string;
  download_url: string;
  force_update: boolean;
  changelog?: string;
}

/**
 * Compare two semver strings: returns 1 if a > b, -1 if a < b, 0 if equal.
 */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/**
 * Check for updates and show an alert if a new version is available.
 * Call this once on app startup (e.g. in App.tsx useEffect).
 */
export async function checkForUpdate(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(VERSION_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return;

    const info: VersionInfo = await res.json();

    if (compareSemver(info.latest_version, currentVersion) <= 0) {
      return; // Already up to date
    }

    const message = info.changelog
      ? `Version ${info.latest_version} is available.\n\n${info.changelog}`
      : `Version ${info.latest_version} is available.`;

    if (info.force_update) {
      Alert.alert('Update Required', message, [
        { text: 'Update Now', onPress: () => Linking.openURL(info.download_url) },
      ]);
    } else {
      Alert.alert('Update Available', message, [
        { text: 'Later', style: 'cancel' },
        { text: 'Update', onPress: () => Linking.openURL(info.download_url) },
      ]);
    }
  } catch {
    // Silently fail — update check is non-critical
  }
}
