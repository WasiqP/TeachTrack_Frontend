/**
 * Outfit + DM Sans (linked via react-native.config.js → assets/Fonts).
 * Surface colors live in ThemeContext — use `useThemeMode().ink` / `.theme`.
 */
export const fonts = {
  outfitBlack: 'Outfit-Black',
  outfitExtraBold: 'Outfit-ExtraBold',
  outfitBold: 'Outfit-Bold',
  outfitSemi: 'Outfit-SemiBold',
  dmExtraBold: 'DMSans-ExtraBold',
  dmBold: 'DMSans-Bold',
  dmSemi: 'DMSans-SemiBold',
  dmMedium: 'DMSans-Medium',
  dmRegular: 'DMSans-Regular',
} as const;

export const radius = {
  card: 16,
  input: 12,
  btn: 14,
} as const;
