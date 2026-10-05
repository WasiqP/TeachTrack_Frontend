/** TeachTrack — brand purple + slate neutrals */
export const palette = {
  ink: '#0F172A',
  white: '#FFFFFF',
  /** Primary actions, links, borders — brand purple (not indigo) */
  primary: '#A060FF',
  primaryDark: '#8B4CE6',
  primarySoft: 'rgba(160, 96, 255, 0.12)',
  teal: '#0D9488',
  surface: '#FFFFFF',
  surfaceAlt: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#64748B',
  hero: '#1A1428',
  heroElevated: '#261D38',
  brandLogoPurple: '#A060FF',
  brandOnDark: '#A060FF',
};

export const theme = {
  background: palette.surface,
  backgroundAlt: palette.surfaceAlt,
  primary: palette.primary,
  primarySoft: palette.primarySoft,
  primaryAlt: palette.teal,
  text: palette.ink,
  textDim: palette.muted,
  border: palette.border,
  card: palette.card,
  accent: palette.teal,
  white: palette.white,
  hero: palette.hero,
  heroElevated: palette.heroElevated,
  brandOnDark: palette.brandOnDark,
  brandLogoPurple: palette.brandLogoPurple,
  ripple: 'rgba(160, 96, 255, 0.2)',
  rippleLight: 'rgba(160, 96, 255, 0.12)',
  rippleMedium: 'rgba(160, 96, 255, 0.28)',
};

export type AppTheme = typeof theme;
