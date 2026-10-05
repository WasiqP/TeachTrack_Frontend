import { theme as staticTheme } from './Colors';
export * from './Colors';
export * from './typography';
export * from './palettes';
export { ui } from './uiStyles';

/** @deprecated Prefer `useThemeMode().theme` for runtime appearance */
export const useTheme = () => staticTheme;

export { ThemeProvider, useThemeMode, useThemeModeOptional } from '../context/ThemeContext';
