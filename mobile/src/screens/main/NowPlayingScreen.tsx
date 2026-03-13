/**
 * NowPlayingScreen — full-screen player with live playback controls.
 */

import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import AppText from '../../components/AppText';
import IconButton from '../../components/IconButton';
import { colors, spacing, borderRadius } from '../../theme';
import { usePlayer } from '../../hooks/usePlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ART_SIZE = SCREEN_WIDTH - spacing.xxl * 2;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const NowPlayingScreen = ({ navigation }: any) => {
  const {
    activeTrack,
    isPlaying,
    isBuffering,
    progress,
    togglePlayPause,
    seekTo,
    skipToNext,
    skipToPrevious,
  } = usePlayer();

  const title = activeTrack?.title ?? 'No Track';
  const artist = activeTrack?.artist ?? 'Select a song';
  const artwork = activeTrack?.artwork as string | undefined;

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton
          name="chevron-down"
          size={28}
          onPress={() => navigation.goBack()}
        />
        <AppText variant="label">NOW PLAYING</AppText>
        <IconButton name="ellipsis-horizontal" size={22} />
      </View>

      {/* Album art */}
      <View style={styles.artContainer}>
        {artwork ? (
          <Image source={{ uri: artwork }} style={styles.albumArt} />
        ) : (
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#22D3EE']}
            style={styles.albumArt}
          >
            <Icon name="musical-notes" size={64} color="rgba(255,255,255,0.3)" />
          </LinearGradient>
        )}
      </View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <AppText variant="title" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="body" numberOfLines={1} style={styles.artistText}>
          {artist}
        </AppText>
      </View>

      {/* Seek slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={progress.duration || 1}
          value={progress.position}
          onSlidingComplete={seekTo}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor="rgba(255,255,255,0.15)"
          thumbTintColor={colors.primaryLight}
        />
        <View style={styles.timeRow}>
          <AppText variant="caption">{formatTime(progress.position)}</AppText>
          <AppText variant="caption">{formatTime(progress.duration)}</AppText>
        </View>
      </View>

      {/* Transport controls */}
      <View style={styles.controls}>
        <IconButton name="shuffle" size={24} color={colors.textMuted} />
        <IconButton name="play-skip-back" size={28} onPress={skipToPrevious} />
        <TouchableOpacity
          onPress={togglePlayPause}
          activeOpacity={0.8}
          style={styles.playButtonOuter}
        >
          <LinearGradient
            colors={colors.gradientPrimary as [string, string]}
            style={styles.playButtonGradient}
          >
            <Icon
              name={isBuffering ? 'hourglass' : isPlaying ? 'pause' : 'play'}
              size={32}
              color="#FFF"
              style={isPlaying ? undefined : { marginLeft: 4 }}
            />
          </LinearGradient>
        </TouchableOpacity>
        <IconButton name="play-skip-forward" size={28} onPress={skipToNext} />
        <IconButton name="repeat" size={24} color={colors.textMuted} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
  },
  artContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  albumArt: {
    width: ART_SIZE,
    height: ART_SIZE,
    maxWidth: 320,
    maxHeight: 320,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  trackInfo: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  artistText: { marginTop: spacing.xs },
  sliderContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
  },
  playButtonOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  playButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NowPlayingScreen;
