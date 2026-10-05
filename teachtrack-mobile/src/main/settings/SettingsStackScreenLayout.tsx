import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts as F, useThemeMode } from '../../theme';
import BackButton from '../../components/Reusable-Components/BackButton';
import { PulseScrollView } from '../../components/PulseScrollView';

type Props = {
  /** Only `goBack` is required; avoids incompatible `setParams` variance across stack screens. */
  navigation: { goBack(): void };
  title: string;
  children: React.ReactNode;
  /** Extra bottom padding when content is short (default 32). */
  contentBottomPadding?: number;
};

/**
 * Shared chrome for stack screens opened from Settings (back + title + scroll).
 */
const SettingsStackScreenLayout: React.FC<Props> = ({
  navigation,
  title,
  children,
  contentBottomPadding = 32,
}) => {
  const { ink } = useThemeMode();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: ink.canvas },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingLeft: 8,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.rowDivider,
          backgroundColor: ink.canvas,
        },
        headerTitle: {
          flex: 1,
          marginLeft: 2,
          fontSize: 20,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.3,
        },
        scroll: { flex: 1 },
        scrollInner: {
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: contentBottomPadding,
        },
      }),
    [ink, contentBottomPadding],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <PulseScrollView
        customTrack={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </PulseScrollView>
    </SafeAreaView>
  );
};

export default SettingsStackScreenLayout;
