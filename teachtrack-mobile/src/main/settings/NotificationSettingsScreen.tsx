import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { fonts as F, radius, useThemeMode } from '../../theme';
import { useAppSettings } from '../../context/AppSettingsContext';
import SettingsStackScreenLayout from './SettingsStackScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

const NotificationSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { ink, theme } = useThemeMode();
  const { notifications, setNotificationPrefs } = useAppSettings();

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
          paddingVertical: 14,
          marginBottom: 10,
        },
        rowTexts: { flex: 1, paddingRight: 12 },
        rowTitle: {
          fontSize: 16,
          fontFamily: F.dmSemi,
          color: ink.ink,
          marginBottom: 4,
        },
        rowSub: {
          fontSize: 13,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          lineHeight: 18,
        },
        footnote: {
          marginTop: 16,
          fontSize: 13,
          lineHeight: 19,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
        },
      }),
    [ink, theme],
  );

  const toggle = useCallback(
    (key: keyof typeof notifications, value: boolean) => {
      void setNotificationPrefs({ [key]: value });
    },
    [setNotificationPrefs],
  );

  return (
    <SettingsStackScreenLayout navigation={navigation} title="Notifications">
      <Text style={styles.lead}>
        Choose what you want to be notified about. Push delivery will be available when TeachTrack
        connects to a notification service.
      </Text>

      <View style={styles.row}>
        <View style={styles.rowTexts}>
          <Text style={styles.rowTitle}>Task reminders</Text>
          <Text style={styles.rowSub}>Due dates and upcoming tasks you create.</Text>
        </View>
        <Switch
          value={notifications.taskReminders}
          onValueChange={v => toggle('taskReminders', v)}
          trackColor={{ false: ink.rowDivider, true: theme.primarySoft }}
          thumbColor={
            Platform.OS === 'android'
              ? notifications.taskReminders
                ? theme.primary
                : ink.inkSoft
              : undefined
          }
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowTexts}>
          <Text style={styles.rowTitle}>Grade updates</Text>
          <Text style={styles.rowSub}>When grades or rubrics change for your classes.</Text>
        </View>
        <Switch
          value={notifications.gradeUpdates}
          onValueChange={v => toggle('gradeUpdates', v)}
          trackColor={{ false: ink.rowDivider, true: theme.primarySoft }}
          thumbColor={
            Platform.OS === 'android'
              ? notifications.gradeUpdates
                ? theme.primary
                : ink.inkSoft
              : undefined
          }
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowTexts}>
          <Text style={styles.rowTitle}>Class announcements</Text>
          <Text style={styles.rowSub}>Broadcasts and highlights from your home screen.</Text>
        </View>
        <Switch
          value={notifications.classAnnouncements}
          onValueChange={v => toggle('classAnnouncements', v)}
          trackColor={{ false: ink.rowDivider, true: theme.primarySoft }}
          thumbColor={
            Platform.OS === 'android'
              ? notifications.classAnnouncements
                ? theme.primary
                : ink.inkSoft
              : undefined
          }
        />
      </View>

      <Text style={styles.footnote}>
        Preferences are saved on this device. They do not sync across devices yet.
      </Text>
    </SettingsStackScreenLayout>
  );
};

export default NotificationSettingsScreen;
