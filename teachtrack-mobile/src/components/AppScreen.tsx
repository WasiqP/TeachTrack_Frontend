import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STACK_SAFE_EDGES, TAB_SAFE_EDGES } from '../theme/layout';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Tab roots: bottom inset is owned by BottomTab (3-button + gesture nav). */
  withTabBar?: boolean;
};

/**
 * Safe area that includes left/right (fold, landscape, punch-hole) and
 * bottom on stack screens (3-button nav, gesture bar — not Pixel-8-only).
 */
export default function AppScreen({ children, style, withTabBar = false }: Props) {
  return (
    <SafeAreaView style={style} edges={withTabBar ? TAB_SAFE_EDGES : STACK_SAFE_EDGES}>
      {children}
    </SafeAreaView>
  );
}
