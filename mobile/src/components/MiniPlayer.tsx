/**
 * MiniPlayer — persistent bottom bar with animated entry and Spotify-style design.
 * Tapping opens the NowPlaying modal.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from './AppText';
import { colors, spacing, borderRadius } from '../theme';
import { usePlayer } from '../hooks/usePlayer';

interface MiniPlayerProps {
  onPress: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const { activeTrack, isPlaying, isBuffering, togglePlayPause, progress, skipToNext } =
    usePlayer();

  // Animated slide-up entry
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeTrack) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeTrack, slideAnim, opacityAnim]);

  if (!activeTrack) return null;

  const progressPercent =
    progress.duration > 0 ? (progress.position / progress.duration) * 100 : 0;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onPress}
        style={styles.touchable}
      >
        <View style={styles.container}>
          {/* Progress bar across the top */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.content}>
            {/* Artwork */}
            {activeTrack.artwork ? (
              <Image
                source={{ uri: activeTrack.artwork as string }}
                style={styles.artwork}
              />
            ) : (
              <View style={[styles.artwork, styles.placeholderArt]}>
                <Icon name="musical-note" size={18} color={colors.textMuted} />
              </View>
            )}

            {/* Track info */}
            <View style={styles.info}>
              <AppText variant="body" color={colors.text} numberOfLines={1}>
                {activeTrack.title}
              </AppText>
              <AppText variant="caption" numberOfLines={1}>
                {activeTrack.artist}
              </AppText>
            </View>

            {/* Play/Pause */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                togglePlayPause();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.controlButton}
            >
              <Icon
                name={isBuffering ? 'hourglass' : isPlaying ? 'pause' : 'play'}
                size={22}
                color={colors.text}
              />
            </TouchableOpacity>

            {/* Skip next */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                skipToNext();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.controlButton}
            >
              <Icon name="play-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 60, // sits just above the tab bar
    left: 0,
    right: 0,
    zIndex: 100,
  },
  touchable: {
    marginHorizontal: spacing.sm,
  },
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    // Subtle shadow
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  artwork: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  placeholderArt: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginRight: spacing.xs,
  },
  controlButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MiniPlayer;
