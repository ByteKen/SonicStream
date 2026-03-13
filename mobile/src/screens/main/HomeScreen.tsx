/**
 * HomeScreen — greeting + horizontal carousels.
 */

import React from 'react';
import { View, ScrollView, StyleSheet, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppText from '../../components/AppText';
import GlassCard from '../../components/GlassCard';
import IconButton from '../../components/IconButton';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import OfflineBanner from '../../components/OfflineBanner';

const HomeScreen = () => {
  const { user, signOut } = useAuth();
  const greeting = getGreeting();

  return (
    <LinearGradient colors={['#0A0A0F', '#14141F']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText variant="body" color={colors.textSecondary}>
              {greeting}
            </AppText>
            <AppText variant="title">
              {user?.user_metadata?.name || 'Music Lover'}
            </AppText>
          </View>
          <IconButton
            name="log-out-outline"
            onPress={signOut}
            backgroundColor={colors.glass}
          />
        </View>

        {/* Recently Played (placeholder section) */}
        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.sectionTitle}>
            Recently Played
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3, 4].map((i) => (
              <GlassCard key={i} style={styles.recentCard}>
                <View style={styles.recentArt}>
                  <LinearGradient
                    colors={i % 2 === 0 ? ['#6366F1', '#8B5CF6'] : ['#22D3EE', '#6366F1']}
                    style={styles.artGradient}
                  />
                </View>
                <AppText variant="body" numberOfLines={1} color={colors.text}>
                  Track {i}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  Artist
                </AppText>
              </GlassCard>
            ))}
          </ScrollView>
        </View>

        {/* Trending (placeholder section) */}
        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.sectionTitle}>
            Trending Now
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3, 4, 5].map((i) => (
              <GlassCard key={i} style={styles.trendCard}>
                <View style={styles.trendArt}>
                  <LinearGradient
                    colors={i % 2 === 0 ? ['#F472B6', '#6366F1'] : ['#FBBF24', '#F472B6']}
                    style={styles.artGradient}
                  />
                </View>
                <AppText variant="body" numberOfLines={1} color={colors.text}>
                  Trending #{i}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  Various Artists
                </AppText>
              </GlassCard>
            ))}
          </ScrollView>
        </View>

        {/* Quick Picks */}
        <View style={styles.section}>
          <AppText variant="subtitle" style={styles.sectionTitle}>
            Quick Picks
          </AppText>
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} style={styles.quickPick}>
              <View style={styles.quickPickContent}>
                <View style={styles.quickPickArt}>
                  <LinearGradient
                    colors={['#6366F1', '#22D3EE']}
                    style={styles.artGradient}
                  />
                </View>
                <View style={styles.quickPickInfo}>
                  <AppText variant="body" color={colors.text} numberOfLines={1}>
                    Song Title {i}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    Artist Name · 3:45
                  </AppText>
                </View>
                <IconButton name="play-circle" size={28} color={colors.primary} />
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  recentCard: {
    width: 140,
    marginLeft: spacing.lg,
    padding: spacing.sm,
  },
  recentArt: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  trendCard: {
    width: 160,
    marginLeft: spacing.lg,
    padding: spacing.sm,
  },
  trendArt: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  artGradient: { flex: 1 },
  quickPick: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  quickPickContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickPickArt: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  quickPickInfo: { flex: 1 },
});

export default HomeScreen;
