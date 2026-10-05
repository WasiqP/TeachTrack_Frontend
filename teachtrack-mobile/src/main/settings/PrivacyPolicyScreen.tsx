import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { fonts as F, useThemeMode } from '../../theme';
import SettingsStackScreenLayout from './SettingsStackScreenLayout';
import { PRIVACY_POLICY } from './legalCopy';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

const PrivacyPolicyScreen: React.FC<Props> = ({ navigation }) => {
  const { ink } = useThemeMode();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          fontSize: 15,
          lineHeight: 24,
          fontFamily: F.dmRegular,
          color: ink.ink,
        },
      }),
    [ink],
  );

  return (
    <SettingsStackScreenLayout navigation={navigation} title="Privacy Policy" contentBottomPadding={48}>
      <Text style={styles.body}>{PRIVACY_POLICY}</Text>
    </SettingsStackScreenLayout>
  );
};

export default PrivacyPolicyScreen;
