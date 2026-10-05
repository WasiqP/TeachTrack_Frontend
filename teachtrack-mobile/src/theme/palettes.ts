/**
 * Light + dark semantic tokens. Use via ThemeContext (`useThemeMode`) — not static imports.
 */

export type InkTokens = {
  canvas: string;
  ink: string;
  inkSoft: string;
  placeholder: string;
  iconMuted: string;
  borderInk: string;
  borderWidth: number;
  rowDivider: string;
  iconWell: string;
  pressTint: string;
};

/** Mirrors `theme` from Colors.ts — values swap for dark surfaces */
export type AppThemeTokens = {
  background: string;
  backgroundAlt: string;
  primary: string;
  primarySoft: string;
  primaryAlt: string;
  text: string;
  textDim: string;
  border: string;
  card: string;
  accent: string;
  white: string;
  hero: string;
  heroElevated: string;
  brandOnDark: string;
  brandLogoPurple: string;
  ripple: string;
  rippleLight: string;
  rippleMedium: string;
};

export type ThemePalette = {
  scheme: 'light' | 'dark';
  ink: InkTokens;
  appTheme: AppThemeTokens;
  statusBarStyle: 'light-content' | 'dark-content';
};

const BW = 2;

export const lightPalette: ThemePalette = {
  scheme: 'light',
  statusBarStyle: 'dark-content',
  ink: {
    canvas: '#FFFFFF',
    ink: '#050508',
    inkSoft: '#1A1A22',
    placeholder: 'rgba(26, 26, 34, 0.45)',
    iconMuted: 'rgba(26, 26, 34, 0.32)',
    borderInk: '#000000',
    borderWidth: BW,
    rowDivider: 'rgba(0, 0, 0, 0.12)',
    iconWell: 'rgba(160, 96, 255, 0.14)',
    pressTint: 'rgba(160, 96, 255, 0.07)',
  },
  appTheme: {
    background: '#FFFFFF',
    backgroundAlt: '#FFFFFF',
    primary: '#A060FF',
    primarySoft: 'rgba(160, 96, 255, 0.12)',
    primaryAlt: '#0D9488',
    text: '#0F172A',
    textDim: '#64748B',
    border: '#E2E8F0',
    card: '#FFFFFF',
    accent: '#0D9488',
    white: '#FFFFFF',
    hero: '#1A1428',
    heroElevated: '#261D38',
    brandOnDark: '#A060FF',
    brandLogoPurple: '#A060FF',
    ripple: 'rgba(160, 96, 255, 0.2)',
    rippleLight: 'rgba(160, 96, 255, 0.12)',
    rippleMedium: 'rgba(160, 96, 255, 0.28)',
  },
};

export const darkPalette: ThemePalette = {
  scheme: 'dark',
  statusBarStyle: 'light-content',
  ink: {
    canvas: '#0B0B0F',
    ink: '#F2F2F7',
    inkSoft: '#A8A8B8',
    placeholder: 'rgba(242, 242, 247, 0.42)',
    iconMuted: 'rgba(242, 242, 247, 0.28)',
    borderInk: '#3A3A48',
    borderWidth: BW,
    rowDivider: 'rgba(255, 255, 255, 0.09)',
    iconWell: 'rgba(160, 96, 255, 0.22)',
    pressTint: 'rgba(160, 96, 255, 0.12)',
  },
  appTheme: {
    background: '#0B0B0F',
    backgroundAlt: '#12121A',
    primary: '#C49FFF',
    primarySoft: 'rgba(196, 159, 255, 0.16)',
    primaryAlt: '#2DD4BF',
    text: '#F2F2F7',
    textDim: '#9CA3AF',
    border: '#2E2E3A',
    card: '#14141C',
    accent: '#2DD4BF',
    white: '#FFFFFF',
    hero: '#0B0B0F',
    heroElevated: '#16161F',
    brandOnDark: '#C49FFF',
    brandLogoPurple: '#C49FFF',
    ripple: 'rgba(196, 159, 255, 0.28)',
    rippleLight: 'rgba(196, 159, 255, 0.14)',
    rippleMedium: 'rgba(196, 159, 255, 0.36)',
  },
};

export function getPaletteForScheme(scheme: 'light' | 'dark'): ThemePalette {
  return scheme === 'dark' ? darkPalette : lightPalette;
}
