/**
 * useNetwork — detects online/offline state.
 * Useful for showing offline banners and switching to local playback.
 */

import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// Simple connectivity check by pinging the backend health endpoint
async function checkConnectivity(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${baseUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export function useNetwork(baseUrl = 'http://10.0.2.2:8000') {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check on mount
    checkConnectivity(baseUrl).then(setIsOnline);

    // Re-check when app comes to foreground
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        checkConnectivity(baseUrl).then(setIsOnline);
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);

    // Periodic check every 30s
    const interval = setInterval(() => {
      checkConnectivity(baseUrl).then(setIsOnline);
    }, 30000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [baseUrl]);

  return { isOnline };
}
