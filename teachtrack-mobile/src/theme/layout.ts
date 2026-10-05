import { PixelRatio } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

/**
 * Layout tokens for every Android size — not Pixel 8 (≈412×915) alone.
 * Common phones sit near 360dp; compact devices drop to ~320; tablets start ~600.
 */
export const LAYOUT = {
  /** Design reference: mid-size phone, slightly under Pixel 8 width. */
  baselineWidth: 390,
  compactWidth: 360,
  tabletWidth: 600,
  shortHeight: 680,
  contentMax: 520,
  minTap: 44,
} as const;

export const TAB_SAFE_EDGES: Edge[] = ['top', 'left', 'right'];
export const STACK_SAFE_EDGES: Edge[] = ['top', 'bottom', 'left', 'right'];

export function pageGutter(width: number): number {
  if (width < 340) return 16;
  if (width < 400) return 20;
  if (width >= LAYOUT.tabletWidth) return 32;
  return 20;
}

/** Auth / onboarding side inset — keeps Pixel 8 at 28. */
export function authGutter(width: number): number {
  if (width < 360) return 20;
  if (width >= LAYOUT.tabletWidth) return 40;
  return 28;
}

/** Scale type down on small phones; never enlarge past the Pixel-class design. */
export function scaleFont(size: number, width: number): number {
  const ratio = width / LAYOUT.baselineWidth;
  const max = width >= LAYOUT.tabletWidth ? 1.06 : 1;
  const clamped = Math.min(max, Math.max(0.86, ratio));
  return Math.round(PixelRatio.roundToNearestPixel(size * clamped));
}

export function isCompactWidth(width: number) {
  return width < LAYOUT.compactWidth;
}

export function isShortHeight(height: number) {
  return height < LAYOUT.shortHeight;
}

export function isTabletWidth(width: number) {
  return width >= LAYOUT.tabletWidth;
}
