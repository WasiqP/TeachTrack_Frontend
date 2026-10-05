import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { fonts as F, radius, useThemeMode } from '../../theme';
import SettingsStackScreenLayout from './SettingsStackScreenLayout';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const packageJson = require('../../../package.json') as { version: string };

type Props = NativeStackScreenProps<RootStackParamList, 'AboutApp'>;

const AboutAppScreen: React.FC<Props> = ({ navigation }) => {
  const { ink, theme } = useThemeMode();
  const version = packageJson.version ?? '0.0.1';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        logoWrap: {
          alignItems: 'center',
          marginBottom: 24,
        },
        logo: { width: 140, height: 120 },
        name: {
          fontSize: 28,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.5,
          textAlign: 'center',
          marginBottom: 8,
        },
        versionPill: {
          alignSelf: 'center',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: theme.primarySoft,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          marginBottom: 24,
        },
        versionText: {
          fontSize: 14,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        para: {
          fontSize: 15,
          lineHeight: 24,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 16,
        },
        card: {
          marginTop: 8,
          padding: 16,
          borderRadius: radius.card,
          backgroundColor: theme.white,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        cardTitle: {
          fontSize: 13,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
        },
        cardLine: {
          fontSize: 14,
          fontFamily: F.dmRegular,
          color: ink.ink,
          marginBottom: 4,
        },
      }),
    [ink, theme],
  );

  return (
    <SettingsStackScreenLayout navigation={navigation} title="About TeachTrack" contentBottomPadding={48}>
      <View style={styles.logoWrap}>
        <Image
          source={require('../../../assets/images/logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="TeachTrack logo"
        />
      </View>
      <Text style={styles.name}>TeachTrack</Text>
      <View style={styles.versionPill}>
        <Text style={styles.versionText}>Version {version}</Text>
      </View>
      <Text style={styles.para}>
        TeachTrack helps teachers run classes, tasks, quizzes, and grades in one focused workspace—built
        for clarity on the go.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Build</Text>
        <Text style={styles.cardLine}>React Native</Text>
        <Text style={styles.cardLine}>© {new Date().getFullYear()} TeachTrack</Text>
      </View>
    </SettingsStackScreenLayout>
  );
};

export default AboutAppScreen;
