/**
 * AppText — themed typography component.
 */

import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

type Variant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

interface AppTextProps {
  children: React.ReactNode;
  variant?: Variant;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
}

const variantStyles: Record<Variant, TextStyle> = {
  hero: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  body: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  caption: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.textMuted,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
};

const AppText: React.FC<AppTextProps> = ({
  children,
  variant = 'body',
  color,
  style,
  numberOfLines,
}) => {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[variantStyles[variant], color ? { color } : undefined, style]}
    >
      {children}
    </Text>
  );
};

export default AppText;
