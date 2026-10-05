import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, radius, useThemeMode } from '../theme';
import BackButton from '../components/Reusable-Components/BackButton';
import { PulseScrollView } from '../components/PulseScrollView';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPassword: React.FC<Props> = ({ navigation, route }) => {
  const { ink, theme } = useThemeMode();
  const initialEmail = route.params?.email ?? '';
  const [email, setEmail] = useState(initialEmail);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flex: { flex: 1 },
        screen: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        backBtn: {
          alignSelf: 'flex-start',
          marginBottom: 2,
        },
        scrollContent: {
          paddingHorizontal: 28,
          paddingTop: 0,
          paddingBottom: 24,
          maxWidth: 480,
          width: '100%',
          alignSelf: 'center',
        },
        brandRow: {
          alignItems: 'center',
          marginBottom: 6,
        },
        logo: {
          width: 118,
          height: 100,
          maxWidth: '100%',
        },
        inner: {
          width: '100%',
        },
        sub: {
          fontSize: 15,
          fontFamily: F.dmMedium,
          color: ink.inkSoft,
          marginBottom: 4,
        },
        heading: {
          fontSize: 34,
          lineHeight: 40,
          fontFamily: F.outfitBlack,
          color: ink.ink,
          marginBottom: 10,
          letterSpacing: -0.8,
        },
        lede: {
          fontSize: 15,
          lineHeight: 22,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 18,
          maxWidth: 360,
        },
        input: {
          width: '100%',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          paddingHorizontal: 16,
          paddingVertical: Platform.OS === 'ios' ? 12 : 10,
          fontSize: 15,
          fontFamily: F.dmRegular,
          color: ink.ink,
          marginTop: 10,
          backgroundColor: ink.canvas,
        },
        inputFirst: {
          marginTop: 0,
        },
        primaryBtn: {
          marginTop: 20,
          backgroundColor: theme.primary,
          paddingVertical: 14,
          borderRadius: radius.btn,
          alignItems: 'center',
        },
        primaryBtnDisabled: {
          opacity: 0.45,
        },
        primaryLabel: {
          color: theme.white,
          fontSize: 17,
          fontFamily: F.outfitBold,
        },
        loginRow: {
          marginTop: 22,
          paddingBottom: 8,
          alignItems: 'center',
        },
        alt: {
          fontSize: 14,
          textAlign: 'center',
          color: ink.inkSoft,
          fontFamily: F.dmRegular,
        },
        altLink: {
          color: theme.primary,
          fontFamily: F.outfitBold,
        },
      }),
    [ink, theme],
  );

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Login');
  };

  const handleSendCode = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    navigation.navigate('VerifyOtp', {
      email: trimmed,
      purpose: 'reset',
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <PulseScrollView
          customTrack={false}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <BackButton onPress={handleBack} style={styles.backBtn} />

          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/images/logo-transparent.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="App logo"
            />
          </View>

          <View style={styles.inner}>
            <Text style={styles.sub}>Account recovery</Text>
            <Text style={styles.heading}>Forgot password?</Text>
            <Text style={styles.lede}>
              Enter the email for your TeachTrack account. We’ll send a one-time code to verify it’s you.
            </Text>

            <TextInput
              style={[styles.input, styles.inputFirst]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={ink.inkSoft}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              style={[styles.primaryBtn, !email.trim() && styles.primaryBtnDisabled]}
              android_ripple={{ color: theme.rippleLight }}
              disabled={!email.trim()}
              onPress={handleSendCode}
            >
              <Text style={styles.primaryLabel}>Send verification code</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={styles.loginRow}
              hitSlop={8}
            >
              <Text style={styles.alt}>
                Remember your password? <Text style={styles.altLink}>Log In</Text>
              </Text>
            </Pressable>
          </View>
        </PulseScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
