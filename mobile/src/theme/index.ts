/**
 * Global design tokens — Spotify-inspired dark palette with premium feel.
 */

export const colors = {
  // ── Core palette (Spotify-style true blacks) ──
  background: '#121212',
  surface: '#181818',
  surfaceLight: '#282828',
  surfaceElevated: '#333333',
  card: 'rgba(255, 255, 255, 0.07)',
  glass: 'rgba(255, 255, 255, 0.10)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',

  // ── Accent (Spotify Brand Green) ──────────────
  primary: '#1DB954',         // Spotify Green
  primaryLight: '#1ED760',
  primaryDark: '#1AA34A',
  secondary: '#B3B3B3',       // Soft grey for secondary elements
  accent: '#E91E63',          // Pink for explicit/special tags

  // ── Text ─────────────────────────────────────
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#727272',
  textInverse: '#121212',

  // ── Semantic ─────────────────────────────────
  success: '#1DB954',
  error: '#F15E6C',
  warning: '#F59B42',

  // ── Gradients ────────────────────────────────
  gradientPrimary: ['#1DB954', '#1ED760'],
  gradientDark: ['#121212', '#181818'],
  gradientCard: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)'],
  gradientPlayer: ['#121212', '#1A1A1A', '#0D0D0D'],
  gradientSurface: ['#282828', '#181818'],
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
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  // System font — looks native on both platforms
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
