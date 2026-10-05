import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { fonts as F, radius, useThemeMode } from '../../theme';
import SettingsStackScreenLayout from './SettingsStackScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

const SUPPORT_EMAIL = 'support@pulsebox.app';

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'How do I create a class?',
    a: 'Open the My Classes tab, tap Create class, and fill in the details. You can add students and tasks from the class screen.',
  },
  {
    q: 'Where are my grades stored?',
    a: 'Class and task data are kept on this device. Back up your phone regularly, or export reports when you need a copy.',
  },
  {
    q: 'Can I use dark mode?',
    a: 'Yes. Go to Settings → Appearance and tap to switch between light and dark themes.',
  },
];

const HelpSupportScreen: React.FC<Props> = ({ navigation }) => {
  const { ink, theme } = useThemeMode();
  const [openId, setOpenId] = useState<number | null>(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionEyebrow: {
          fontSize: 11,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 12,
          marginTop: 8,
        },
        linkCard: {
          backgroundColor: theme.white,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.card,
          paddingHorizontal: 16,
          paddingVertical: 16,
          marginBottom: 10,
        },
        linkTitle: {
          fontSize: 16,
          fontFamily: F.dmBold,
          color: ink.ink,
          marginBottom: 4,
        },
        linkSub: {
          fontSize: 14,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
        },
        faqItem: {
          backgroundColor: theme.white,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.card,
          marginBottom: 10,
          overflow: 'hidden',
        },
        faqQ: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        faqQText: {
          flex: 1,
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: ink.ink,
          paddingRight: 12,
        },
        faqChevron: {
          fontSize: 18,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
        },
        faqA: {
          paddingHorizontal: 16,
          paddingBottom: 14,
          paddingTop: 0,
          fontSize: 14,
          lineHeight: 21,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
        },
      }),
    [ink, theme],
  );

  const openMail = useCallback(async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('TeachTrack support')}`;
    const can = await Linking.canOpenURL(url);
    if (can) await Linking.openURL(url);
  }, []);

  return (
    <SettingsStackScreenLayout navigation={navigation} title="Help & Support" contentBottomPadding={40}>
      <Text style={styles.sectionEyebrow}>Contact</Text>
      <Pressable
        style={styles.linkCard}
        onPress={() => void openMail()}
        android_ripple={{ color: ink.pressTint }}
      >
        <Text style={styles.linkTitle}>Email support</Text>
        <Text style={styles.linkSub}>{SUPPORT_EMAIL}</Text>
      </Pressable>

      <Text style={styles.sectionEyebrow}>Frequently asked</Text>
      {FAQ_ITEMS.map((item, i) => {
        const open = openId === i;
        return (
          <View key={item.q} style={styles.faqItem}>
            <Pressable
              style={styles.faqQ}
              onPress={() => setOpenId(open ? null : i)}
              android_ripple={{ color: ink.pressTint }}
            >
              <Text style={styles.faqQText}>{item.q}</Text>
              <Text style={styles.faqChevron}>{open ? '▾' : '▸'}</Text>
            </Pressable>
            {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
          </View>
        );
      })}

      <Text
        style={{
          marginTop: 20,
          fontSize: 13,
          lineHeight: 19,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
        }}
      >
        {Platform.OS === 'ios' ? 'iOS' : 'Android'} {Platform.Version}
      </Text>
    </SettingsStackScreenLayout>
  );
};

export default HelpSupportScreen;
