/**
 * MiniPlayer — persistent bottom bar showing current track + play/pause.
 * Tapping on it opens the NowPlaying modal.
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from './AppText';
import { colors, spacing, borderRadius } from '../theme';
import { usePlayer } from '../hooks/usePlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MiniPlayerProps {
  onPress: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const { activeTrack, isPlaying, isBuffering, togglePlayPause, progress } =
    usePlayer();

  if (!activeTrack) return null;

  const progressPercent =
    progress.duration > 0 ? (progress.position / progress.duration) * 100 : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={['rgba(20, 20, 31, 0.98)', 'rgba(10, 10, 15, 0.98)']}
        style={styles.container}
      >
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
            style={styles.playButton}
          >
            <Icon
              name={isBuffering ? 'hourglass' : isPlaying ? 'pause' : 'play'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
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
  container: {
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  progressBar: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  placeholderArt: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  playButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MiniPlayer;
