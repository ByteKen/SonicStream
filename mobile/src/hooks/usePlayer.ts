/**
 * usePlayer — hook that exposes playback state and controls.
 */

import { useState, useEffect, useCallback } from 'react';
import TrackPlayer, {
  Track as TPTrack,
  usePlaybackState,
  useProgress,
  useActiveTrack,
  State,
  AddTrack,
} from 'react-native-track-player';
import { Track, getAudioProxyUrl } from '../services/api';
import { getLocalFileUri } from '../services/downloadManager';

export interface PlayerTrack {
  videoId: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
}

/**
 * Convert our API Track model to a react-native-track-player Track.
 */
function toTPTrack(track: Track): AddTrack {
  // Prefer local file for offline playback
  const localUri = getLocalFileUri(track.video_id);
  return {
    id: track.video_id,
    url: localUri ?? getAudioProxyUrl(track.video_id),
    title: track.title,
    artist: track.artists.map((a) => a.name).join(', '),
    artwork: track.thumbnail?.url,
    duration: track.duration_seconds,
  };
}

export function usePlayer() {
  const playbackState = usePlaybackState();
  const progress = useProgress(250); // update every 250ms
  const activeTrack = useActiveTrack();

  const isPlaying = playbackState.state === State.Playing;
  const isBuffering =
    playbackState.state === State.Buffering ||
    playbackState.state === State.Loading;

  /**
   * Play a single track (replaces queue).
   */
  const play = useCallback(async (track: Track) => {
    await TrackPlayer.reset();
    await TrackPlayer.add(toTPTrack(track));
    await TrackPlayer.play();
  }, []);

  /**
   * Play a track and enqueue the rest of the list after it.
   */
  const playWithQueue = useCallback(
    async (track: Track, queue: Track[]) => {
      await TrackPlayer.reset();
      // Add the tapped track first
      await TrackPlayer.add(toTPTrack(track));
      // Add remaining tracks (excluding the current one)
      const rest = queue
        .filter((t) => t.video_id !== track.video_id)
        .map(toTPTrack);
      if (rest.length > 0) {
        await TrackPlayer.add(rest);
      }
      await TrackPlayer.play();
    },
    [],
  );

  const pause = useCallback(async () => {
    await TrackPlayer.pause();
  }, []);

  const resume = useCallback(async () => {
    await TrackPlayer.play();
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }, [isPlaying]);

  const seekTo = useCallback(async (seconds: number) => {
    await TrackPlayer.seekTo(seconds);
  }, []);

  const skipToNext = useCallback(async () => {
    try {
      await TrackPlayer.skipToNext();
    } catch {
      // No next track
    }
  }, []);

  const skipToPrevious = useCallback(async () => {
    try {
      // If more than 3 seconds in, restart current track
      if (progress.position > 3) {
        await TrackPlayer.seekTo(0);
      } else {
        await TrackPlayer.skipToPrevious();
      }
    } catch {
      await TrackPlayer.seekTo(0);
    }
  }, [progress.position]);

  const getQueue = useCallback(async (): Promise<TPTrack[]> => {
    return TrackPlayer.getQueue();
  }, []);

  return {
    // State
    isPlaying,
    isBuffering,
    activeTrack,
    progress: {
      position: progress.position,
      duration: progress.duration,
      buffered: progress.buffered,
    },

    // Controls
    play,
    playWithQueue,
    pause,
    resume,
    togglePlayPause,
    seekTo,
    skipToNext,
    skipToPrevious,
    getQueue,
  };
}
