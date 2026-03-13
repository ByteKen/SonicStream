/**
 * SearchScreen — search, play, and download tracks.
 */

import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from '../../components/AppText';
import GlassCard from '../../components/GlassCard';
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
    } catch (err) {
      console.warn('Search error:', err);
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

  const renderTrack = ({ item }: { item: Track }) => {
    const isActive = activeTrack?.id === item.video_id;
    const downloaded = checkDownloaded(item.video_id);
    const dlProgress = getProgress(item.video_id);
    const isDownloading = dlProgress?.status === 'downloading';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
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
                color={colors.success}
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
            <ActivityIndicator size="small" color={colors.secondary} />
          ) : downloaded ? (
            <Icon name="checkmark-circle" size={22} color={colors.success} />
          ) : (
            <Icon name="download-outline" size={22} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        {/* Play indicator */}
        {isActive && isPlaying ? (
          <Icon name="volume-high" size={20} color={colors.primary} />
        ) : (
          <Icon name="play-circle-outline" size={26} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#14141F']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <GlassCard style={styles.searchBar} padding={0}>
            <View style={styles.searchBarInner}>
              <Icon name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search songs, artists..."
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
          </GlassCard>
        </View>

        {/* Results */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
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
          </View>
        ) : (
          <View style={styles.centered}>
            <Icon name="musical-notes-outline" size={48} color={colors.textMuted} />
            <AppText variant="body" style={styles.emptyText}>
              Search for your favorite music
            </AppText>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingTop: 60 },
  searchBarWrapper: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  searchBar: { borderRadius: borderRadius.xl },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.body,
    marginLeft: spacing.sm,
  },
  listContent: { paddingBottom: 140 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  placeholderArt: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: { flex: 1, marginRight: spacing.sm },
  trackMeta: { flexDirection: 'row', alignItems: 'center' },
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
  emptyText: { marginTop: spacing.md, textAlign: 'center' },
});

export default SearchScreen;
