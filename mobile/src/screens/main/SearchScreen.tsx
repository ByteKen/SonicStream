/**
 * SearchScreen — Spotify-style search with animated results and press feedback.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from '../../components/AppText';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { searchTracks, Track } from '../../services/api';
import { usePlayer } from '../../hooks/usePlayer';
import { useDownloads } from '../../hooks/useDownloads';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const { playWithQueue, activeTrack, isPlaying } = usePlayer();
  const { download, checkDownloaded, getProgress } = useDownloads();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const tracks = await searchTracks(query.trim());
      setResults(tracks);
    } catch (err: any) {
      console.warn('Search error:', err);
      Alert.alert('Search Error', err?.message || 'Failed to connect to server');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handlePlayTrack = useCallback(
    (track: Track) => {
      playWithQueue(track, results);
    },
    [results, playWithQueue],
  );

  const handleDownload = useCallback(
    (track: Track) => {
      if (checkDownloaded(track.video_id)) {
        Alert.alert('Already Downloaded', 'This track is already saved offline.');
        return;
      }
      download(track);
    },
    [download, checkDownloaded],
  );

  const renderTrack = ({ item, index }: { item: Track; index: number }) => {
    const isActive = activeTrack?.id === item.video_id;
    const downloaded = checkDownloaded(item.video_id);
    const dlProgress = getProgress(item.video_id);
    const isDownloading = dlProgress?.status === 'downloading';

    return (
      <TouchableOpacity
        activeOpacity={0.6}
        style={styles.trackRow}
        onPress={() => handlePlayTrack(item)}
      >
        {item.thumbnail?.url ? (
          <Image source={{ uri: item.thumbnail.url }} style={styles.thumbnail} />
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
          <View style={styles.trackMeta}>
            {downloaded && (
              <Icon
                name="arrow-down-circle"
                size={14}
                color={colors.primary}
                style={styles.downloadedIcon}
              />
            )}
            <AppText variant="caption" numberOfLines={1}>
              {item.artists.map((a) => a.name).join(', ')}
              {item.duration ? ` · ${item.duration}` : ''}
            </AppText>
          </View>
        </View>

        {/* Download button */}
        <TouchableOpacity
          onPress={() => handleDownload(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.downloadBtn}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : downloaded ? (
            <Icon name="checkmark-circle" size={22} color={colors.primary} />
          ) : (
            <Icon name="download-outline" size={22} color={colors.textMuted} />
          )}
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
        <View style={styles.headerSection}>
          <AppText variant="title">Search</AppText>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color={colors.textInverse} />
            <TextInput
              style={styles.searchInput}
              placeholder="What do you want to listen to?"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setResults([]);
                  setSearched(false);
                }}
              >
                <Icon name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText variant="body" style={styles.loadingText}>
              Searching...
            </AppText>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.video_id}
            renderItem={renderTrack}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : searched ? (
          <View style={styles.centered}>
            <Icon name="search-outline" size={48} color={colors.textMuted} />
            <AppText variant="body" style={styles.emptyText}>
              No results found
            </AppText>
            <AppText variant="caption" style={styles.emptySubtext}>
              Try different keywords
            </AppText>
          </View>
        ) : (
          <View style={styles.centered}>
            <Icon name="musical-notes-outline" size={56} color={colors.textMuted} />
            <AppText variant="subtitle" style={styles.emptyText}>
              Search for music
            </AppText>
            <AppText variant="body" style={styles.emptySubtext}>
              Find songs, artists, and more
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
  content: { flex: 1, paddingTop: 56 },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchBarWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text,  // White search bar like Spotify
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: colors.textInverse,
    fontSize: typography.sizes.body,
    marginLeft: spacing.sm,
    fontWeight: '500',
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
  trackMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  downloadedIcon: { marginRight: 4 },
  downloadBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textMuted,
  },
  emptyText: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.text,
  },
  emptySubtext: {
    marginTop: spacing.xs,
    textAlign: 'center',
    color: colors.textMuted,
  },
});

export default SearchScreen;
