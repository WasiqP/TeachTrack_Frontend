import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import BottomTab from '../components/BottomTab';
import TabScreenHeaderBar from '../components/TabScreenHeaderBar';
import { fonts as F, radius, useThemeMode } from '../theme';
import { languageLabel, useAppSettings } from '../context/AppSettingsContext';
import { useAuth } from '../context/AuthContext';
import { usePulseAlert } from '../context/AlertModalContext';
import ScreenFrame from '../components/layout/ScreenFrame';
import { useResponsive } from '../ui/responsive';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const packageJson = require('../../package.json') as { version: string };

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  embedded?: boolean;
};

const Settings: React.FC<Props> = ({ navigation, embedded }) => {
  const { ink, theme, scheme, toggleScheme, isDark } = useThemeMode();
  const r = useResponsive();
  const { language } = useAppSettings();
  const { logout } = useAuth();
  const { showAlert } = usePulseAlert();
  const appVersion = packageJson.version ?? '0.0.1';

  const confirmLogout = useCallback(() => {
    showAlert({
      variant: 'warning',
      title: 'Log out?',
      message: 'You will need to sign in again to use PulseBox.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            void logout().finally(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'GetStarted' }],
              });
            });
          },
        },
      ],
    });
  }, [navigation, showAlert, logout]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        content: {
          flex: 1,
          paddingHorizontal: 0,
          paddingTop: 8,
        },
        title: {
          fontSize: 32,
          lineHeight: 38,
          fontFamily: F.outfitBlack,
          color: ink.ink,
          letterSpacing: -0.8,
          marginBottom: 8,
        },
        subtitle: {
          fontSize: 16,
          lineHeight: 24,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 0,
        },
        scrollContent: {
          paddingHorizontal: r.gutter,
          paddingTop: 24,
          paddingBottom: 100,
          width: '100%',
          maxWidth: r.contentMaxWidth,
          alignSelf: 'center',
        },
        settingsSection: {
          marginBottom: 28,
        },
        sectionTitle: {
          fontSize: 11,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
        },
        settingItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: ink.canvas,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.card,
          paddingHorizontal: 16,
          paddingVertical: 16,
          marginBottom: 10,
        },
        settingLabel: {
          fontSize: 16,
          fontFamily: F.dmMedium,
          color: ink.ink,
        },
        settingArrow: {
          fontSize: 22,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
        },
        settingValue: {
          fontSize: 14,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
        },
        logoutButton: {
          backgroundColor: theme.primary,
          borderRadius: radius.btn,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: 12,
        },
        logoutText: {
          fontSize: 17,
          fontFamily: F.outfitBold,
          color: theme.white,
        },
      }),
    [ink, theme, r.gutter, r.contentMaxWidth],
  );

  return (
    <ScreenFrame style={styles.container} edges={['top']} framed={false}>
      <View style={styles.content}>
        <TabScreenHeaderBar
          navigation={navigation}
          paddingHorizontal={r.gutter}
          onBackFallback={() => navigation.navigate('Home', { tab: 'Home' })}
        >
          <View>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your account and preferences</Text>
          </View>
        </TabScreenHeaderBar>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Account</Text>

            <Pressable
              style={styles.settingItem}
              android_ripple={{ color: ink.pressTint }}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.settingLabel}>Profile</Text>
              <Text style={styles.settingArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.settingItem}
              android_ripple={{ color: ink.pressTint }}
              onPress={() => navigation.navigate('NotificationSettings')}
            >
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>General</Text>

            <Pressable
              style={styles.settingItem}
              android_ripple={{ color: ink.pressTint }}
              onPress={toggleScheme}
              accessibilityRole="button"
              accessibilityLabel={`Switch theme. Currently ${scheme} mode.`}
            >
              <Text style={styles.settingLabel}>Appearance</Text>
              <Text style={styles.settingValue}>{isDark ? 'Dark' : 'Light'}</Text>
            </Pressable>

            <Pressable
              style={styles.settingItem}
              android_ripple={{ color: ink.pressTint }}
              onPress={() => navigation.navigate('LanguageSettings')}
            >
              <Text style={styles.settingLabel}>Language</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.settingValue}>{languageLabel(language)}</Text>
                <Text style={[styles.settingArrow, { marginLeft: 6 }]}>›</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.settingItem}
              android_ripple={{ color: ink.pressTint }}
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <Text style={styles.settingLabel}>Help & Support</Text>
              <Text style={styles.settingArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>About</Text>

            <Pressable
              style={styles.settingItem}
              android_ripple={{ color: ink.pressTint }}
              onPress={() => navigation.navigate('TermsOfService')}
            >
              <Text style={styles.settingLabel}>Terms of Service</Text>
              <Text style={styles.settingArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.settingItem}
              android_ripple={{ color: ink.pressTint }}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.settingArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.settingItem}
              android_ripple={{ color: ink.pressTint }}
              onPress={() => navigation.navigate('AboutApp')}
            >
              <Text style={styles.settingLabel}>App version</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.settingValue}>{appVersion}</Text>
                <Text style={[styles.settingArrow, { marginLeft: 6 }]}>›</Text>
              </View>
            </Pressable>
          </View>

          <Pressable
            style={styles.logoutButton}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            onPress={confirmLogout}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </ScrollView>
      </View>

      {!embedded && <BottomTab navigation={navigation} currentRoute="Settings" />}
    </ScreenFrame>
  );
};

export default Settings;
