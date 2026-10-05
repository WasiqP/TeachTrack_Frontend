import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppThemeTokens, InkTokens, ThemePalette } from '../theme/palettes';
import { getPaletteForScheme } from '../theme/palettes';

const STORAGE_KEY = '@pulsebox/theme-scheme';

type Scheme = 'light' | 'dark';

type ThemeContextValue = {
  scheme: Scheme;
  palette: ThemePalette;
  isDark: boolean;
  /** Semantic colors (replaces static `ink` from typography) */
  ink: InkTokens;
  /** App chrome colors (replaces static `theme` from Colors) */
  theme: AppThemeTokens;
  setScheme: (s: Scheme) => void;
  toggleScheme: () => void;
  /** Opacity wrapper for subtle crossfade when scheme changes */
  contentOpacity: Animated.Value;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<Scheme>('light');
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw === 'dark' || raw === 'light') {
          setSchemeState(raw);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (s: Scheme) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  }, []);

  const runTransition = useCallback(
    (next: Scheme) => {
      Animated.sequence([
        Animated.timing(contentOpacity, {
          toValue: 0.94,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      setSchemeState(next);
      void persist(next);
    },
    [contentOpacity, persist],
  );

  const setScheme = useCallback(
    (s: Scheme) => {
      if (s === scheme) return;
      runTransition(s);
    },
    [scheme, runTransition],
  );

  const toggleScheme = useCallback(() => {
    runTransition(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, runTransition]);

  const palette = useMemo(() => getPaletteForScheme(scheme), [scheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      palette,
      isDark: scheme === 'dark',
      ink: palette.ink,
      theme: palette.appTheme,
      setScheme,
      toggleScheme,
      contentOpacity,
    }),
    [scheme, palette, setScheme, toggleScheme, contentOpacity],
  );

  /** Avoid flash: optional brief hold until storage read */
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        /* could sync system appearance here if we add "system" mode */
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return ctx;
}

/** Safe for components that may render outside provider (e.g. tests) — falls back to light */
export function useThemeModeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
