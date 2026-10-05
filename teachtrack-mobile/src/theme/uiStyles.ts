/**
 * Shared layout + type styles aligned with Home (Outfit + DM Sans, ink, black borders).
 * Compose with local StyleSheet where screens need extra rules.
 */
import { StyleSheet } from 'react-native';
import { theme } from './Colors';
import { fonts as F, radius } from './typography';
import { lightPalette } from './palettes';

const ink = lightPalette.ink;

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ink.canvas,
  },
  titleScreen: {
    fontFamily: F.outfitBlack,
    fontSize: 32,
    lineHeight: 38,
    color: ink.ink,
    letterSpacing: -0.8,
  },
  titleLarge: {
    fontFamily: F.outfitExtraBold,
    fontSize: 26,
    lineHeight: 32,
    color: ink.ink,
    letterSpacing: -0.5,
  },
  titleSection: {
    fontFamily: F.outfitExtraBold,
    fontSize: 22,
    lineHeight: 28,
    color: ink.ink,
    letterSpacing: -0.45,
  },
  subtitle: {
    fontFamily: F.dmRegular,
    fontSize: 16,
    lineHeight: 24,
    color: ink.inkSoft,
  },
  body: {
    fontFamily: F.dmRegular,
    fontSize: 15,
    lineHeight: 22,
    color: ink.inkSoft,
  },
  label: {
    fontFamily: F.dmMedium,
    fontSize: 13,
    color: ink.inkSoft,
  },
  sectionLabel: {
    fontFamily: F.dmSemi,
    fontSize: 11,
    letterSpacing: 1.2,
    color: ink.inkSoft,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: F.dmRegular,
    color: ink.ink,
    backgroundColor: ink.canvas,
  },
  card: {
    backgroundColor: theme.white,
    borderRadius: radius.card,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
  },
  primaryBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.btn,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: F.outfitBold,
    fontSize: 17,
    color: theme.white,
  },
});
