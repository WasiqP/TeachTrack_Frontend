import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { fonts as F, radius, useThemeMode } from '../../theme';
import {
  LANGUAGE_OPTIONS,
  useAppSettings,
  type AppLanguageCode,
} from '../../context/AppSettingsContext';
import { usePulseAlert } from '../../context/AlertModalContext';
import SettingsStackScreenLayout from './SettingsStackScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSettings'>;

const LanguageSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { ink, theme } = useThemeMode();
  const { language, setLanguage } = useAppSettings();
  const { showAlert } = usePulseAlert();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        lead: {
          fontSize: 15,
          lineHeight: 22,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 22,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.white,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.card,
          paddingHorizontal: 16,
          paddingVertical: 16,
          marginBottom: 10,
        },
        rowDisabled: {
          opacity: 0.55,
        },
        rowLeft: { flex: 1, paddingRight: 12 },
        rowTitle: {
          fontSize: 16,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        rowNative: {
          fontSize: 14,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginTop: 4,
        },
        check: {
          fontSize: 20,
          fontFamily: F.outfitBold,
          color: theme.primary,
        },
        soon: {
          fontSize: 12,
          fontFamily: F.dmMedium,
          color: ink.inkSoft,
        },
      }),
    [ink, theme],
  );

  const onSelect = useCallback(
    (code: AppLanguageCode, ready: boolean) => {
      if (!ready) {
        showAlert({
          variant: 'info',
          title: 'Coming soon',
          message:
            'This language will be available in a future update. The app stays in English for now.',
        });
        return;
      }
      void setLanguage(code);
    },
    [setLanguage, showAlert],
  );

  return (
    <SettingsStackScreenLayout navigation={navigation} title="Language">
      <Text style={styles.lead}>
        Choose your preferred language. Additional translations will roll out over time.
      </Text>

      {LANGUAGE_OPTIONS.map(opt => {
        const selected = language === opt.code;
        return (
          <Pressable
            key={opt.code}
            style={[styles.row, !opt.ready && styles.rowDisabled]}
            onPress={() => onSelect(opt.code, opt.ready)}
            android_ripple={{ color: ink.pressTint }}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>{opt.label}</Text>
              <Text style={styles.rowNative}>{opt.nativeLabel}</Text>
              {!opt.ready ? (
                <Text style={[styles.soon, { marginTop: 6 }]}>Coming soon</Text>
              ) : null}
            </View>
            {selected ? <Text style={styles.check}>✓</Text> : null}
            {!selected && !opt.ready ? <Text style={styles.soon}>—</Text> : null}
          </Pressable>
        );
      })}
    </SettingsStackScreenLayout>
  );
};

export default LanguageSettingsScreen;
