import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import BackButton from './Reusable-Components/BackButton';
import { useThemeMode } from '../theme';

/** Minimal navigation shape for back affordance on tab-root screens */
export type TabHeaderNavigation = {
  canGoBack: () => boolean;
  goBack: () => void;
};

type Props = {
  navigation: TabHeaderNavigation;
  children: React.ReactNode;
  right?: React.ReactNode;
  /** Extra top inset so headers sit slightly below the safe area */
  paddingTop?: number;
  paddingHorizontal?: number;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_PADDING_TOP = 18;

/**
 * Shared header for tab screens: back control + title area + optional trailing action.
 */
export default function TabScreenHeaderBar({
  navigation,
  children,
  right,
  paddingTop = DEFAULT_PADDING_TOP,
  paddingHorizontal = 20,
  style,
}: Props) {
  const { ink } = useThemeMode();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: 16,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.rowDivider,
          backgroundColor: ink.canvas,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
        },
        main: {
          flex: 1,
          minWidth: 0,
          paddingLeft: 2,
          justifyContent: 'center',
        },
        rightSlot: {
          marginLeft: 4,
        },
        rightSpacer: {
          width: 40,
        },
        backMuted: {
          opacity: 0.32,
        },
      }),
    [ink],
  );

  const canBack = navigation.canGoBack();
  return (
    <View style={[styles.wrap, { paddingTop, paddingHorizontal }, style]}>
      <View style={styles.row}>
        <BackButton
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          style={!canBack ? styles.backMuted : undefined}
        />
        <View style={styles.main}>{children}</View>
        {right != null ? <View style={styles.rightSlot}>{right}</View> : <View style={styles.rightSpacer} />}
      </View>
    </View>
  );
}
