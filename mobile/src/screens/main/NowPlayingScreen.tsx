/**
 * NowPlayingScreen — full-screen player with Spotify-style controls and animations.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import AppText from '../../components/AppText';
import { colors, spacing, borderRadius } from '../../theme';
import { usePlayer } from '../../hooks/usePlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ART_SIZE = SCREEN_WIDTH - spacing.xl * 2;

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

  // Entrance animations
  const artScale = useRef(new Animated.Value(0.8)).current;
  const artOpacity = useRef(new Animated.Value(0)).current;
  const controlsSlide = useRef(new Animated.Value(30)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(artScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(artOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(controlsSlide, {
        toValue: 0,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate art scale on play/pause
  const playAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(playAnim, {
      toValue: isPlaying ? 1 : 0.92,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  const title = activeTrack?.title ?? 'No Track';
  const artist = activeTrack?.artist ?? 'Select a song';
  const artwork = activeTrack?.artwork as string | undefined;

  return (
    <LinearGradient
      colors={['#1A1A1A', '#121212', '#0A0A0A']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.topBarBtn}
        >
          <Icon name="chevron-down" size={28} color={colors.text} />
        </TouchableOpacity>
        <AppText variant="label">NOW PLAYING</AppText>
        <TouchableOpacity style={styles.topBarBtn}>
          <Icon name="ellipsis-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Album art - animated */}
      <Animated.View
        style={[
          styles.artContainer,
          {
            opacity: artOpacity,
            transform: [
              { scale: Animated.multiply(artScale, playAnim) },
            ],
          },
        ]}
      >
        {artwork ? (
          <Image source={{ uri: artwork }} style={styles.albumArt} />
        ) : (
          <LinearGradient
            colors={[colors.surfaceLight, colors.surface]}
            style={styles.albumArt}
          >
            <Icon name="musical-notes" size={64} color="rgba(255,255,255,0.15)" />
          </LinearGradient>
        )}
      </Animated.View>

      {/* Track info + controls - animated */}
      <Animated.View
        style={{
          opacity: controlsOpacity,
          transform: [{ translateY: controlsSlide }],
        }}
      >
        {/* Track info */}
        <View style={styles.trackInfo}>
          <View style={styles.trackTextContainer}>
            <AppText variant="title" numberOfLines={1} style={styles.titleText}>
              {title}
            </AppText>
            <AppText variant="body" numberOfLines={1} style={styles.artistText}>
              {artist}
            </AppText>
          </View>
          {/* Like button */}
          <TouchableOpacity style={styles.likeBtn}>
            <Icon name="heart-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
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
            thumbTintColor={colors.text}
          />
          <View style={styles.timeRow}>
            <AppText variant="caption">{formatTime(progress.position)}</AppText>
            <AppText variant="caption">{formatTime(progress.duration)}</AppText>
          </View>
        </View>

        {/* Transport controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.sideControlBtn}>
            <Icon name="shuffle" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={skipToPrevious} style={styles.skipBtn}>
            <Icon name="play-skip-back" size={28} color={colors.text} />
          </TouchableOpacity>
          {/* Main play/pause button */}
          <TouchableOpacity
            onPress={togglePlayPause}
            activeOpacity={0.8}
            style={styles.playButtonOuter}
          >
            <View style={styles.playButtonInner}>
              <Icon
                name={isBuffering ? 'hourglass' : isPlaying ? 'pause' : 'play'}
                size={30}
                color={colors.textInverse}
                style={isPlaying || isBuffering ? undefined : { marginLeft: 3 }}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={skipToNext} style={styles.skipBtn}>
            <Icon name="play-skip-forward" size={28} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideControlBtn}>
            <Icon name="repeat" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    paddingBottom: spacing.md,
  },
  topBarBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  albumArt: {
    width: ART_SIZE,
    height: ART_SIZE,
    maxWidth: 340,
    maxHeight: 340,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    // Spotify-style shadow
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  trackTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  titleText: {
    marginBottom: 2,
  },
  artistText: {
    marginTop: spacing.xs,
  },
  likeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
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
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
    gap: spacing.lg,
  },
  sideControlBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  playButtonInner: {
    flex: 1,
    backgroundColor: colors.text,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NowPlayingScreen;
