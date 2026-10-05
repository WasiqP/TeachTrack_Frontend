import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Platform,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, radius, STACK_SAFE_EDGES, useThemeMode } from '../theme';
import BackButton from '../components/Reusable-Components/BackButton';
import { PulseScrollView } from '../components/PulseScrollView';
import { useAuth } from '../context/AuthContext';
import { usePulseAlert } from '../context/AlertModalContext';
import { enterMainApp } from '../navigation/enterMainApp';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyOtp'>;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const CELL = 48;

const VerifyOtp: React.FC<Props> = ({ navigation, route }) => {
  const { ink, theme } = useThemeMode();
  const { email, purpose, name: _name } = route.params;
  const { verifyOtp, resendOtp } = useAuth();
  const { showAlert, showSuccess } = usePulseAlert();

  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const code = digits.join('');

  const focusIndex = (i: number) => {
    const ref = inputRefs.current[i];
    if (ref) ref.focus();
  };

  const handleChange = (text: string, index: number) => {
    const only = text.replace(/\D/g, '');
    if (only.length > 1) {
      const next = [...digits];
      const chars = only.slice(0, OTP_LENGTH).split('');
      chars.forEach((c, j) => {
        if (index + j < OTP_LENGTH) next[index + j] = c;
      });
      setDigits(next);
      const last = Math.min(index + chars.length, OTP_LENGTH - 1);
      focusIndex(last);
      return;
    }
    const next = [...digits];
    next[index] = only.slice(-1);
    setDigits(next);
    if (only && index < OTP_LENGTH - 1) {
      focusIndex(index + 1);
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      focusIndex(index - 1);
    }
  };

  const handleVerify = async () => {
    if (code.length !== OTP_LENGTH) {
      showAlert({
        variant: 'warning',
        title: 'Incomplete code',
        message: `Enter all ${OTP_LENGTH} digits from your email.`,
      });
      return;
    }

    try {
      const result = await verifyOtp(email, code, purpose);
      if (purpose === 'signup') {
        showSuccess('You’re verified', 'Welcome to TeachTrack.', () => {
          enterMainApp(navigation);
        });
        return;
      }
      if (!result.resetToken) {
        showAlert({
          variant: 'error',
          title: 'Couldn’t continue',
          message: 'No reset token was returned. Request a new code and try again.',
        });
        return;
      }
      navigation.replace('ResetPassword', { resetToken: result.resetToken });
    } catch (err) {
      showAlert({
        variant: 'error',
        title: 'Invalid code',
        message: err instanceof Error ? err.message : 'Please check the code and try again.',
      });
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    try {
      await resendOtp(email, purpose);
      setResendIn(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      focusIndex(0);
      showAlert({
        variant: 'info',
        title: 'Code sent',
        message: `We sent a new code to ${email}. Check the API console in local development.`,
      });
    } catch (err) {
      showAlert({
        variant: 'error',
        title: 'Couldn’t resend',
        message: err instanceof Error ? err.message : 'Try again in a moment.',
      });
    }
  };

  const title = purpose === 'signup' ? 'Verify your email' : 'Enter verification code';
  const subtitle =
    purpose === 'signup'
      ? 'We sent a 6-digit code to your inbox. Enter it below to finish creating your account.'
      : 'We sent a 6-digit code to reset your password. Enter it below.';

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
          fontSize: 32,
          lineHeight: 36,
          fontFamily: F.outfitBlack,
          color: ink.ink,
          marginBottom: 2,
          letterSpacing: -0.8,
        },
        lede: {
          fontSize: 15,
          lineHeight: 22,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginTop: -2,
          marginBottom: 14,
          maxWidth: 360,
        },
        emailPill: {
          alignSelf: 'flex-start',
          maxWidth: '100%',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: radius.input,
          backgroundColor: theme.primarySoft,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          fontSize: 14,
          fontFamily: F.dmSemi,
          color: ink.ink,
          marginBottom: 20,
        },
        otpRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 22,
        },
        otpCell: {
          flex: 1,
          minWidth: 40,
          maxWidth: CELL + 8,
          height: CELL + 4,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          fontSize: 22,
          fontFamily: F.outfitBold,
          color: ink.ink,
          textAlign: 'center',
          paddingVertical: Platform.OS === 'ios' ? 12 : 10,
          backgroundColor: ink.canvas,
        },
        otpCellFilled: {
          borderColor: theme.primary,
          backgroundColor: 'rgba(160, 96, 255, 0.06)',
        },
        primaryBtn: {
          backgroundColor: theme.primary,
          paddingVertical: 14,
          borderRadius: radius.btn,
          alignItems: 'center',
        },
        primaryBtnDim: {
          opacity: 0.55,
        },
        primaryLabel: {
          color: theme.white,
          fontSize: 17,
          fontFamily: F.outfitBold,
        },
        resendRow: {
          marginTop: 18,
          alignItems: 'center',
          minHeight: 24,
        },
        resendMuted: {
          fontSize: 14,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
        },
        resendBold: {
          fontFamily: F.dmBold,
          color: ink.ink,
        },
        resendLink: {
          fontSize: 14,
          fontFamily: F.dmSemi,
          color: theme.primary,
        },
        loginRow: {
          marginTop: 20,
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

  return (
    <SafeAreaView style={styles.screen} edges={STACK_SAFE_EDGES}>
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
          <BackButton
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('Login');
            }}
            style={styles.backBtn}
          />

          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/images/logo-transparent.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="App logo"
            />
          </View>

          <View style={styles.inner}>
            <Text style={styles.sub}>{purpose === 'signup' ? 'Almost there' : 'Check your email'}</Text>
            <Text style={styles.heading}>{title}</Text>
            <Text style={styles.lede}>{subtitle}</Text>

            <Text style={styles.emailPill} numberOfLines={1}>
              {email}
            </Text>

            <View style={styles.otpRow}>
              {digits.map((d, index) => (
                <TextInput
                  key={index}
                  ref={(r) => {
                    inputRefs.current[index] = r;
                  }}
                  style={[styles.otpCell, d ? styles.otpCellFilled : null]}
                  value={d}
                  onChangeText={(t) => handleChange(t, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={index === 0 ? 6 : 1}
                  selectTextOnFocus
                  accessibilityLabel={`Digit ${index + 1}`}
                />
              ))}
            </View>

            <Pressable
              style={[styles.primaryBtn, code.length !== OTP_LENGTH && styles.primaryBtnDim]}
              android_ripple={{ color: theme.rippleLight }}
              disabled={code.length !== OTP_LENGTH}
              onPress={handleVerify}
            >
              <Text style={styles.primaryLabel}>
                {purpose === 'signup' ? 'Verify & continue' : 'Verify code'}
              </Text>
            </Pressable>

            <View style={styles.resendRow}>
              {resendIn > 0 ? (
                <Text style={styles.resendMuted}>
                  Resend code in <Text style={styles.resendBold}>{resendIn}s</Text>
                </Text>
              ) : (
                <Pressable onPress={handleResend} hitSlop={12}>
                  <Text style={styles.resendLink}>Didn’t get it? Resend code</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() =>
                purpose === 'signup' ? navigation.replace('SignUp') : navigation.replace('Login')
              }
              style={styles.loginRow}
              hitSlop={8}
            >
              <Text style={styles.alt}>
                Wrong email? <Text style={styles.altLink}>Go back</Text>
              </Text>
            </Pressable>
          </View>
        </PulseScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyOtp;
