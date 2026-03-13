/**
 * GlassCard — subtle elevated container with Spotify-style dark surface.
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  padding = spacing.md,
}) => {
  return (
    <View style={[styles.container, { padding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
});

export default GlassCard;
