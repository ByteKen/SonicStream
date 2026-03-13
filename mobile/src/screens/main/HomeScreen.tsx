/**
 * HomeScreen — Spotify-style home with real content, animations, and pull-to-refresh.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from '../../components/AppText';
import GlassCard from '../../components/GlassCard';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayer } from '../../hooks/usePlayer';
import { searchTracks, Track } from '../../services/api';
import OfflineBanner from '../../components/OfflineBanner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Curated queries to populate home sections
const TRENDING_QUERIES = [
  'trending songs 2025',
  'top hits today',
  'popular music 2025',
];
const CHILL_QUERIES = [
  'chill vibes lofi',
  'relaxing acoustic songs',
];
const HIPHOP_QUERIES = [
  'hip hop hits 2025',
  'rap trending',
];

// Animated card component with scale press feedback
const PressableCard: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}> = ({ children, onPress, style }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Fade-in animated wrapper
const FadeInView: React.FC<{ delay?: number; children: React.ReactNode }> = ({
  delay = 0,
  children,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

const HomeScreen = () => {
  const { user, signOut } = useAuth();
  const { playWithQueue, activeTrack, isPlaying } = usePlayer();
  const greeting = getGreeting();

  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [chillTracks, setChillTracks] = useState<Track[]>([]);
  const [hiphopTracks, setHiphopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContent = useCallback(async () => {
    try {
      const trendingQuery = TRENDING_QUERIES[Math.floor(Math.random() * TRENDING_QUERIES.length)];
      const chillQuery = CHILL_QUERIES[Math.floor(Math.random() * CHILL_QUERIES.length)];
      const hiphopQuery = HIPHOP_QUERIES[Math.floor(Math.random() * HIPHOP_QUERIES.length)];

      const [trending, chill, hiphop] = await Promise.allSettled([
        searchTracks(trendingQuery, 10),
        searchTracks(chillQuery, 6),
        searchTracks(hiphopQuery, 6),
      ]);

      if (trending.status === 'fulfilled') setTrendingTracks(trending.value);
      if (chill.status === 'fulfilled') setChillTracks(chill.value);
      if (hiphop.status === 'fulfilled') setHiphopTracks(hiphop.value);
    } catch (err) {
      console.warn('Home content fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContent();
  }, [fetchContent]);

  const handlePlayTrack = useCallback(
    (track: Track, queue: Track[]) => {
      playWithQueue(track, queue);
    },
    [playWithQueue],
  );

  const renderHorizontalSection = (
    title: string,
    icon: string,
    tracks: Track[],
    cardWidth: number,
    delay: number,
  ) => {
    if (tracks.length === 0) return null;
    return (
      <FadeInView delay={delay}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="subtitle" style={styles.sectionTitle}>
              {title}
            </AppText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tracks.map((track) => {
              const isActive = activeTrack?.id === track.video_id;
              return (
                <PressableCard
                  key={track.video_id}
                  onPress={() => handlePlayTrack(track, tracks)}
                  style={[styles.card, { width: cardWidth }]}
                >
                  {track.thumbnail?.url ? (
                    <Image
                      source={{ uri: track.thumbnail.url }}
                      style={styles.cardArt}
                    />
                  ) : (
                    <View style={[styles.cardArt, styles.placeholderArt]}>
                      <Icon name="musical-note" size={24} color={colors.textMuted} />
                    </View>
                  )}
                  <AppText
                    variant="body"
                    numberOfLines={1}
                    color={isActive ? colors.primary : colors.text}
                    style={styles.trackTitle}
                  >
                    {track.title}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    {track.artists.map((a) => a.name).join(', ')}
                  </AppText>
                  {isActive && isPlaying && (
                    <View style={styles.nowPlayingBadge}>
                      <Icon name="volume-high" size={12} color={colors.primary} />
                    </View>
                  )}
                </PressableCard>
              );
            })}
            <View style={{ width: spacing.lg }} />
          </ScrollView>
        </View>
      </FadeInView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} translucent />
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {/* Header */}
        <FadeInView delay={0}>
          <View style={styles.header}>
            <View>
              <AppText variant="body" color={colors.textSecondary}>
                {greeting}
              </AppText>
              <AppText variant="title">
                {user?.user_metadata?.name || 'Music Lover'}
              </AppText>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn}>
                <Icon name="notifications-outline" size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={signOut}>
                <Icon name="settings-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </FadeInView>

        {loading ? (
          <View style={styles.loadingContainer}>
            {/* Skeleton-like loading */}
            <View style={styles.skeletonSection}>
              <View style={styles.skeletonTitle} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonCard}>
                    <View style={styles.skeletonArt} />
                    <View style={styles.skeletonLine1} />
                    <View style={styles.skeletonLine2} />
                  </View>
                ))}
              </ScrollView>
            </View>
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        ) : (
          <>
            {/* Trending */}
            {renderHorizontalSection(
              'Trending Now',
              'trending-up',
              trendingTracks.slice(0, 6),
              155,
              100,
            )}

            {/* Quick Picks — vertical list */}
            {trendingTracks.length > 6 && (
              <FadeInView delay={250}>
                <View style={styles.section}>
                  <AppText variant="subtitle" style={styles.sectionTitle}>
                    Quick Picks
                  </AppText>
                  {trendingTracks.slice(6).map((track) => {
                    const isActive = activeTrack?.id === track.video_id;
                    return (
                      <PressableCard
                        key={track.video_id}
                        onPress={() => handlePlayTrack(track, trendingTracks.slice(6))}
                        style={styles.quickPick}
                      >
                        {track.thumbnail?.url ? (
                          <Image
                            source={{ uri: track.thumbnail.url }}
                            style={styles.quickPickArt}
                          />
                        ) : (
                          <View style={[styles.quickPickArt, styles.placeholderArt]}>
                            <Icon name="musical-note" size={18} color={colors.textMuted} />
                          </View>
                        )}
                        <View style={styles.quickPickInfo}>
                          <AppText
                            variant="body"
                            color={isActive ? colors.primary : colors.text}
                            numberOfLines={1}
                          >
                            {track.title}
                          </AppText>
                          <AppText variant="caption" numberOfLines={1}>
                            {track.artists.map((a) => a.name).join(', ')}
                            {track.duration ? ` · ${track.duration}` : ''}
                          </AppText>
                        </View>
                        {isActive && isPlaying ? (
                          <Icon name="volume-high" size={20} color={colors.primary} />
                        ) : (
                          <Icon name="play" size={20} color={colors.text} />
                        )}
                      </PressableCard>
                    );
                  })}
                </View>
              </FadeInView>
            )}

            {/* Hip Hop Hits */}
            {renderHorizontalSection(
              'Hip Hop Hits',
              'flame',
              hiphopTracks,
              155,
              350,
            )}

            {/* Chill Vibes */}
            {renderHorizontalSection(
              'Chill Vibes',
              'cafe',
              chillTracks,
              145,
              500,
            )}

            {/* Empty state */}
            {trendingTracks.length === 0 && chillTracks.length === 0 && (
              <View style={styles.emptyContainer}>
                <Icon name="cloud-offline-outline" size={48} color={colors.textMuted} />
                <AppText variant="body" style={styles.emptyText}>
                  Couldn't load music right now
                </AppText>
                <AppText variant="caption" style={styles.emptyText}>
                  Pull down to refresh
                </AppText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: { paddingTop: 60, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Loading skeleton
  loadingContainer: {
    paddingTop: spacing.md,
  },
  skeletonSection: {
    paddingLeft: spacing.lg,
  },
  skeletonTitle: {
    width: 140,
    height: 16,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  skeletonCard: {
    width: 155,
    marginRight: spacing.md,
  },
  skeletonArt: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  skeletonLine1: {
    width: '80%',
    height: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  skeletonLine2: {
    width: '60%',
    height: 10,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  // Sections
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  // Horizontal cards
  card: {
    marginLeft: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  cardArt: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  placeholderArt: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackTitle: {
    marginBottom: 2,
  },
  nowPlayingBadge: {
    position: 'absolute',
    top: spacing.sm + 4,
    right: spacing.sm + 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 4,
  },
  // Quick picks
  quickPick: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  quickPickArt: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  quickPickInfo: { flex: 1, marginRight: spacing.sm },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default HomeScreen;
