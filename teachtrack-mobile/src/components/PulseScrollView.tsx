import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import { useThemeMode } from '../theme';

const THUMB_MIN = 28;
const TRACK_W = 6;
/** Ignore sub-pixel noise; custom track only when content truly overflows. */
const OVERFLOW_EPS = 3;

export type PulseScrollViewProps = ScrollViewProps & {
  /** When false, plain vertical ScrollView (no purple track). Default true. */
  customTrack?: boolean;
};

/**
 * Vertical ScrollView with optional purple scrollbar (custom thumb + track).
 * Track renders only when content height exceeds the viewport. Horizontal mode passes through unchanged.
 */
export const PulseScrollView = forwardRef<ScrollView, PulseScrollViewProps>(function PulseScrollView(
  {
    style,
    horizontal,
    onScroll,
    onContentSizeChange,
    onLayout,
    children,
    showsVerticalScrollIndicator = false,
    scrollEventThrottle = 16,
    customTrack = true,
    ...rest
  },
  ref,
) {
  const { theme } = useThemeMode();
  const primary = theme.primary;

  const scrollStyles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          position: 'absolute',
          right: 2,
          top: 6,
          bottom: 6,
          width: TRACK_W,
          borderRadius: TRACK_W / 2,
          backgroundColor: theme.rippleLight,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.rippleMedium,
        },
        thumb: {
          position: 'absolute',
          left: 0,
          right: 0,
          borderRadius: TRACK_W / 2,
          backgroundColor: primary,
          shadowColor: primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.45,
          shadowRadius: 4,
          elevation: 3,
        },
      }),
    [primary, theme.rippleLight, theme.rippleMedium],
  );

  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollY(e.nativeEvent.contentOffset.y);
      onScroll?.(e);
    },
    [onScroll],
  );

  if (horizontal) {
    return (
      <ScrollView
        ref={ref}
        horizontal
        style={style}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  if (!customTrack) {
    return (
      <ScrollView
        ref={ref}
        style={style}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        scrollEventThrottle={scrollEventThrottle}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  const showBar = contentH > viewportH + OVERFLOW_EPS && viewportH > 0;
  const maxScroll = Math.max(contentH - viewportH, 1);
  const thumbH = Math.min(
    Math.max((viewportH / contentH) * viewportH, THUMB_MIN),
    viewportH,
  );
  const maxThumbTop = Math.max(viewportH - thumbH, 0);
  const thumbTop = (scrollY / maxScroll) * maxThumbTop;

  return (
    <View style={[styles.wrap, style]}>
      <ScrollView
        ref={ref}
        style={styles.flex}
        horizontal={false}
        {...rest}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        scrollEventThrottle={scrollEventThrottle}
        onScroll={handleScroll}
        onContentSizeChange={(w, h) => {
          setContentH(h);
          onContentSizeChange?.(w, h);
        }}
        onLayout={(e: LayoutChangeEvent) => {
          setViewportH(e.nativeEvent.layout.height);
          onLayout?.(e);
        }}
      >
        {children}
      </ScrollView>
      {showBar && (
        <View style={scrollStyles.track} pointerEvents="none">
          <View style={[scrollStyles.thumb, { height: thumbH, top: thumbTop }]} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
