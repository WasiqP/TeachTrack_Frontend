import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LAYOUT,
  authGutter,
  isCompactWidth,
  isShortHeight,
  isTabletWidth,
  pageGutter,
  scaleFont,
} from './layout';

/** Live window size + insets. Updates on rotation, fold, and multi-window. */
export function useLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = isCompactWidth(width);
  const short = isShortHeight(height);
  const tablet = isTabletWidth(width);

  return {
    width,
    height,
    fontScale,
    insets,
    compact,
    short,
    tablet,
    gutter: pageGutter(width),
    authGutter: authGutter(width),
    contentMax: LAYOUT.contentMax,
    minTap: LAYOUT.minTap,
    fs: (size: number) => scaleFont(size, width),
  };
}
