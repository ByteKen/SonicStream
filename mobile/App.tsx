/**
 * SonicStream — Spotify Clone
 * Root application component.
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { setupTrackPlayer } from './src/services/trackplayer';
import { checkForUpdate } from './src/services/appUpdater';

function App() {
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    setupTrackPlayer().then(() => setPlayerReady(true));
    // Check for app updates on launch
    checkForUpdate();
  }, []);

  if (!playerReady) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default App;
