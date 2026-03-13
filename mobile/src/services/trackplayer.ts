/**
 * Track Player background service configuration.
 *
 * This file is registered in index.js and runs in a headless
 * Android foreground service — even when the app is backgrounded.
 */

import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
} from 'react-native-track-player';

/**
 * Called once when the service is first created.
 */
export async function setupTrackPlayer(): Promise<void> {
  try {
    await TrackPlayer.setupPlayer({
      // Buffer size in seconds — balance between memory and skip-free playback
      minBuffer: 30,
      maxBuffer: 120,
      playBuffer: 5,
      backBuffer: 30,
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      // Notification metadata is set per-track via the artwork/title/artist fields
    });

    await TrackPlayer.setRepeatMode(RepeatMode.Off);

    console.log('[TrackPlayer] Setup complete');
  } catch (err) {
    console.warn('[TrackPlayer] Setup error:', err);
  }
}

/**
 * Playback service — handles remote events (lock screen, notification controls).
 */
export async function PlaybackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });
}
