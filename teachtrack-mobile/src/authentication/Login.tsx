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
import { fonts as F, radius, STACK_SAFE_EDGES, useLayout, useThemeMode } from '../theme';
import BackButton from '../components/Reusable-Components/BackButton';
import { enterMainApp } from '../navigation/enterMainApp';
import { PulseScrollView } from '../components/PulseScrollView';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { usePulseAlert } from '../context/AlertModalContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const Login: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { ink, theme } = useThemeMode();
  const { login } = useAuth();
  const { showAlert } = usePulseAlert();
  const layout = useLayout();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flex: { flex: 1 },
        screen: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        scrollContent: {
          paddingHorizontal: layout.authGutter,
          paddingTop: 0,
          paddingBottom: 18,
          maxWidth: layout.contentMax,
          width: '100%',
          alignSelf: 'center',
        },
        backBtn: {
          alignSelf: 'flex-start',
          marginBottom: 2,
        },
        brandRow: {
          alignItems: 'center',
          marginTop: layout.short ? -4 : -8,
          marginBottom: 4,
        },
        logo: {
          width: layout.compact ? 132 : 172,
          height: layout.compact ? 112 : 146,
          maxWidth: '100%',
        },
        heading: {
          fontSize: layout.fs(36),
          lineHeight: layout.fs(40),
          fontFamily: F.outfitBlack,
          color: ink.ink,
          marginTop: 4,
          marginBottom: 10,
          letterSpacing: -0.8,
        },
        subtitle: {
          fontSize: layout.fs(16),
          lineHeight: layout.fs(24),
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: layout.short ? 14 : 22,
          maxWidth: 360,
        },
        input: {
          width: '100%',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          paddingHorizontal: 16,
          paddingVertical: Platform.OS === 'ios' ? 14 : 12,
          fontSize: 15,
          fontFamily: F.dmRegular,
          color: ink.ink,
          marginTop: 12,
          backgroundColor: ink.canvas,
        },
        inputFirst: {
          marginTop: 0,
        },
        primaryBtn: {
          marginTop: 26,
          backgroundColor: theme.primary,
          paddingVertical: 16,
          borderRadius: radius.btn,
          alignItems: 'center',
          minHeight: layout.minTap + 8,
          justifyContent: 'center',
        },
        primaryLabel: {
          color: theme.white,
          fontSize: 17,
          fontFamily: F.outfitBold,
        },
        forgot: {
          marginTop: 14,
          fontSize: 13,
          fontFamily: F.dmMedium,
          color: ink.inkSoft,
          textAlign: 'center',
        },
        alt: {
          marginTop: 16,
          fontSize: 14,
          textAlign: 'center',
          color: ink.inkSoft,
          fontFamily: F.dmRegular,
        },
        socialHint: {
          marginTop: 26,
          fontSize: 13,
          textAlign: 'center',
          color: ink.inkSoft,
          fontFamily: F.dmMedium,
        },
        socialRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 20,
          marginTop: 14,
        },
        socialBtn: {
          backgroundColor: ink.borderInk,
          flex: 1,
          maxWidth: 140,
          paddingVertical: 14,
          borderRadius: radius.btn,
          alignItems: 'center',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        socialText: {
          color: theme.white,
          fontSize: 18,
          fontFamily: F.dmBold,
        },
        altLink: {
          color: theme.primary,
          fontFamily: F.outfitBold,
        },
      }),
    [ink, theme, layout],
  );

  const handleLogin = async () => {
    const e = email.trim();
    if (!e || !password) {
      showAlert({
        variant: 'warning',
        title: 'Missing information',
        message: 'Enter your email and password.',
      });
      return;
    }
    setBusy(true);
    try {
      await login(e, password);
      enterMainApp(navigation);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      if (code === 'EMAIL_NOT_VERIFIED') {
        navigation.navigate('VerifyOtp', { email: e, purpose: 'signup' });
        return;
      }
      showAlert({
        variant: 'error',
        title: 'Couldn’t sign in',
        message: err instanceof Error ? err.message : 'Check your email and password.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('GetStarted');
    }
  };

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
          <BackButton onPress={handleBack} style={styles.backBtn} />
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/images/logo-transparent.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="App logo"
            />
          </View>
          <Text style={styles.heading} maxFontSizeMultiplier={1.2}>
            Welcome back
          </Text>
          <Text style={styles.subtitle}>
            Sign in to access your classes, quizzes, and attendance in one place.
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={ink.inkSoft}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, styles.inputFirst]}
            maxFontSizeMultiplier={1.3}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={ink.inkSoft}
            secureTextEntry
            style={styles.input}
            maxFontSizeMultiplier={1.3}
          />
          <Pressable
            style={[styles.primaryBtn, busy && { opacity: 0.55 }]}
            android_ripple={{ color: theme.rippleLight }}
            disabled={busy}
            onPress={handleLogin}
          >
            <Text style={styles.primaryLabel}>{busy ? 'Signing in…' : 'Log In'}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('SignUp')} hitSlop={8}>
            <Text style={styles.alt}>
              {"Don't have an account? "}
              <Text style={styles.altLink}>Sign Up</Text>
            </Text>
          </Pressable>
          <Text style={styles.socialHint}>Log in with socials</Text>
          <View style={styles.socialRow}>
            <Pressable style={styles.socialBtn} android_ripple={{ color: 'rgba(255,255,255,0.15)' }}>
              <Text style={styles.socialText}>G</Text>
            </Pressable>
            <Pressable style={styles.socialBtn} android_ripple={{ color: 'rgba(255,255,255,0.15)' }}>
              <Text style={styles.socialText}>f</Text>
            </Pressable>
          </View>
        </PulseScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
