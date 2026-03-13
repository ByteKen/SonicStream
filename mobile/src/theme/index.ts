/**
 * Global design tokens — dark palette with iOS-aesthetic glassmorphism.
 */

export const colors = {
  // ── Core palette ─────────────────────────────
  background: '#0A0A0F',
  surface: '#14141F',
  surfaceLight: '#1E1E2E',
  card: 'rgba(255, 255, 255, 0.05)',
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',

  // ── Accent ───────────────────────────────────
  primary: '#6366F1',       // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#22D3EE',     // Cyan accent
  accent: '#F472B6',        // Pink accent

  // ── Text ─────────────────────────────────────
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // ── Semantic ─────────────────────────────────
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',

  // ── Gradients ────────────────────────────────
  gradientPrimary: ['#6366F1', '#8B5CF6'],
  gradientDark: ['#0A0A0F', '#14141F'],
  gradientCard: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'],
  gradientPlayer: ['#1a1a2e', '#16213e', '#0f3460'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  // Using system font stack that mimics SF Pro on Android
  fontFamily: 'System',

  sizes: {
    xs: 11,
    sm: 13,
    body: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 32,
    hero: 40,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

const theme = { colors, spacing, borderRadius, typography };
export default theme;
