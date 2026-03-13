/**
 * LibraryScreen — Spotify-style library with downloaded tracks.
 */

import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from '../../components/AppText';
import { colors, spacing, borderRadius } from '../../theme';
import { useDownloads } from '../../hooks/useDownloads';
import { usePlayer } from '../../hooks/usePlayer';
import { DownloadedTrack } from '../../services/downloadStore';
import TrackPlayer, { AddTrack } from 'react-native-track-player';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const LibraryScreen = () => {
  const { downloads, remove } = useDownloads();
  const { activeTrack, isPlaying } = usePlayer();

  const handlePlay = useCallback(
    async (track: DownloadedTrack) => {
      await TrackPlayer.reset();
      const tpTrack: AddTrack = {
        id: track.videoId,
        url: `file://${track.filePath}`,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        duration: track.duration,
      };
      await TrackPlayer.add(tpTrack);
      await TrackPlayer.play();
    },
    [],
  );

  const handlePlayAll = useCallback(async () => {
    if (downloads.length === 0) return;
    await TrackPlayer.reset();
    const tracks: AddTrack[] = downloads.map((dl) => ({
      id: dl.videoId,
      url: `file://${dl.filePath}`,
      title: dl.title,
      artist: dl.artist,
      artwork: dl.artwork,
      duration: dl.duration,
    }));
    await TrackPlayer.add(tracks);
    await TrackPlayer.play();
  }, [downloads]);

  const handleDelete = useCallback(
    (track: DownloadedTrack) => {
      Alert.alert(
        'Delete Download',
        `Remove "${track.title}" from downloads?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => remove(track.videoId),
          },
        ],
      );
    },
    [remove],
  );

  const renderTrack = ({ item }: { item: DownloadedTrack }) => {
    const isActive = activeTrack?.id === item.videoId;

    return (
      <TouchableOpacity
        activeOpacity={0.6}
        style={styles.trackRow}
        onPress={() => handlePlay(item)}
      >
        {item.artwork ? (
          <Image source={{ uri: item.artwork }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderArt]}>
            <Icon name="musical-note" size={20} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.trackInfo}>
          <AppText
            variant="body"
            color={isActive ? colors.primary : colors.text}
            numberOfLines={1}
          >
            {item.title}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {item.artist}
            {item.duration ? ` · ${formatDuration(item.duration)}` : ''}
            {` · ${formatFileSize(item.fileSize)}`}
          </AppText>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.actionBtn}
        >
          <Icon name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>

        {/* Play indicator */}
        {isActive && isPlaying ? (
          <Icon name="volume-high" size={20} color={colors.primary} />
        ) : (
          <Icon name="play" size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} translucent />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="title">Your Library</AppText>
          {downloads.length > 0 && (
            <AppText variant="caption" style={styles.trackCount}>
              {downloads.length} {downloads.length === 1 ? 'track' : 'tracks'} downloaded
            </AppText>
          )}
        </View>

        {downloads.length > 0 ? (
          <>
            {/* Play All button */}
            <TouchableOpacity
              onPress={handlePlayAll}
              activeOpacity={0.8}
              style={styles.playAllBtn}
            >
              <View style={styles.playAllInner}>
                <View style={styles.playAllIcon}>
                  <Icon name="play" size={18} color={colors.textInverse} />
                </View>
                <View>
                  <AppText variant="subtitle" color={colors.text}>
                    Play All
                  </AppText>
                  <AppText variant="caption">
                    Shuffle your downloads
                  </AppText>
                </View>
              </View>
            </TouchableOpacity>

            <FlatList
              data={downloads}
              keyExtractor={(item) => item.videoId}
              renderItem={renderTrack}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Icon name="download-outline" size={48} color={colors.primary} />
            </View>
            <AppText variant="subtitle" style={styles.emptyTitle}>
              No downloads yet
            </AppText>
            <AppText variant="body" style={styles.emptyBody}>
              Search for songs and tap the download button to save them offline.
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: { flex: 1, paddingTop: 60 },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  trackCount: {
    marginTop: spacing.xs,
  },
  playAllBtn: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  playAllInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playAllIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  listContent: { paddingBottom: 140 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  placeholderArt: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: { flex: 1, marginRight: spacing.sm },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { marginBottom: spacing.sm, textAlign: 'center' },
  emptyBody: { textAlign: 'center', color: colors.textMuted },
});

export default LibraryScreen;
