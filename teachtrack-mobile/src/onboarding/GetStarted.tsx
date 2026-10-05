import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, useLayout, useThemeMode } from '../theme';
import { PulseScrollView } from '../components/PulseScrollView';

type Props = NativeStackScreenProps<RootStackParamList, 'GetStarted'>;

const GetStarted: React.FC<Props> = ({ navigation }) => {
  const { ink, theme } = useThemeMode();
  const layout = useLayout();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        scrollInner: {
          flexGrow: 1,
          paddingHorizontal: layout.authGutter,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 20,
          justifyContent: 'center',
          alignItems: 'center',
        },
        hero: {
          width: '100%',
          maxWidth: layout.contentMax,
          alignItems: 'center',
        },
        logoWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: layout.short ? 16 : 28,
        },
        logo: {
          width: layout.compact ? 160 : 200,
          height: layout.compact ? 140 : 176,
          maxWidth: '72%',
        },
        eyebrow: {
          fontSize: 12,
          letterSpacing: 2,
          textTransform: 'uppercase',
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          textAlign: 'center',
          marginBottom: 10,
        },
        title: {
          fontSize: layout.fs(40),
          lineHeight: layout.fs(44),
          fontFamily: F.outfitBlack,
          letterSpacing: -1.2,
          textAlign: 'center',
          marginBottom: 14,
        },
        titleTeach: {
          color: ink.ink,
        },
        titleTrack: {
          color: theme.brandLogoPurple,
        },
        lede: {
          fontSize: layout.fs(16),
          lineHeight: layout.fs(24),
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          textAlign: 'center',
          maxWidth: Math.min(300, layout.width - layout.authGutter * 2),
        },
        divider: {
          width: 48,
          height: 3,
          borderRadius: 2,
          backgroundColor: theme.primarySoft,
          marginTop: 32,
          marginBottom: 28,
        },
        buttonZone: {
          width: '100%',
          maxWidth: 320,
          alignItems: 'center',
          gap: 12,
        },
        primaryBtn: {
          width: '100%',
          backgroundColor: theme.primary,
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: 'center',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        secondaryBtn: {
          width: '100%',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          paddingVertical: 15,
          borderRadius: 14,
          alignItems: 'center',
          backgroundColor: ink.canvas,
        },
        pressed: {
          opacity: 0.88,
        },
        primaryLabel: {
          color: theme.white,
          fontSize: 17,
          fontFamily: F.outfitBold,
        },
        secondaryLabel: {
          color: ink.ink,
          fontSize: 17,
          fontFamily: F.outfitBold,
        },
      }),
    [ink, theme, layout],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <PulseScrollView
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/images/logo-transparent.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.eyebrow}>Welcome to TeachTrack</Text>

          <Text style={styles.title}>
            <Text style={styles.titleTeach}>Teach</Text>
            <Text style={styles.titleTrack}>Track</Text>
          </Text>

          <Text style={styles.lede}>
            Complete personal assistant for teachers. Plan classes, run quizzes, and track
            attendance—without jumping between apps.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.buttonZone}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            android_ripple={{ color: theme.rippleLight }}
            onPress={() => navigation.navigate('Onboarding01')}
          >
            <Text style={styles.primaryLabel}>Get Started</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryLabel}>Log In</Text>
          </Pressable>
        </View>
      </PulseScrollView>
    </SafeAreaView>
  );
};

export default GetStarted;
