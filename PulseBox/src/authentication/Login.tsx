import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, radius, useThemeMode } from '../theme';
import BackButton from '../components/Reusable-Components/BackButton';
import ScreenFrame from '../components/layout/ScreenFrame';
import { scaleFont, useResponsive } from '../ui/responsive';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { usePulseAlert } from '../context/AlertModalContext';
import { authErrorAlert } from '../api/errors';
import { ApiError } from '../api/client';
import { resolveAuthenticatedRoute } from '../utils/profileSetup';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const Login: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { ink, theme } = useThemeMode();
  const r = useResponsive();
  const { signIn } = useAuth();
  const { hydrateFromServer } = useUser();
  const { showAlert } = usePulseAlert();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: ink.canvas,
          paddingTop: 0,
        },
        backBtn: {
          alignSelf: 'flex-start',
          marginBottom: 2,
        },
        brandRow: {
          alignItems: 'center',
          marginTop: -8,
          marginBottom: 4,
        },
        logo: { width: 172, height: 146, maxWidth: '100%' },
        content: { flex: 1 },
        heading: {
          fontSize: scaleFont(36, r.titleScale),
          lineHeight: scaleFont(40, r.titleScale),
          fontFamily: F.outfitBlack,
          color: ink.ink,
          marginTop: 4,
          marginBottom: 10,
          letterSpacing: -0.8,
        },
        subtitle: {
          fontSize: 16,
          lineHeight: 24,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 22,
          maxWidth: 360,
        },
        input: {
          width: '100%',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          paddingHorizontal: 16,
          paddingVertical: 14,
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
          width: 110,
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
    [ink, theme, r.titleScale],
  );

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('GetStarted');
    }
  };

  const handleSignIn = async () => {
    const e = email.trim();
    const p = password;
    if (!e || !p) {
      showAlert({
        variant: 'warning',
        title: 'Missing information',
        message: 'Enter your email and password.',
      });
      return;
    }
    setBusy(true);
    try {
      await signIn(e, p);
      const fresh = await hydrateFromServer();
      const dest = resolveAuthenticatedRoute(
        fresh ?? {
          displayName: '',
          avatarUri: null,
          email: '',
          phone: '',
          country: '',
          city: '',
          address: '',
          institutionName: '',
          professionalTitle: '',
          subjectsTeach: '',
          timezone: '',
        },
      );
      navigation.reset({ index: 0, routes: [{ name: dest }] });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        showAlert({
          variant: 'warning',
          title: 'Verify your email',
          message: err.message,
        });
        navigation.navigate('VerifyOtp', { email: e, purpose: 'signup' });
        return;
      }
      const a = authErrorAlert(err);
      showAlert({ variant: 'error', title: a.title, message: a.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenFrame style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={handleBack} style={styles.backBtn} />
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/images/logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="App logo"
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.heading}>Welcome back</Text>
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
          editable={!busy}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor={ink.inkSoft}
          secureTextEntry
          style={styles.input}
          editable={!busy}
        />
        <Pressable
          style={[styles.primaryBtn, busy && { opacity: 0.7 }]}
          android_ripple={{ color: theme.rippleLight }}
          onPress={handleSignIn}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={theme.white} />
          ) : (
            <Text style={styles.primaryLabel}>Sign In</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() =>
            navigation.navigate('ForgotPassword', { email: email.trim() || undefined })
          }
        >
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.alt}>
            New here? <Text style={styles.altLink}>Create an account</Text>
          </Text>
        </Pressable>
        <Text style={styles.socialHint}>Or continue with</Text>
        <View style={styles.socialRow}>
          <Pressable style={styles.socialBtn} android_ripple={{ color: 'rgba(255,255,255,0.15)' }}>
            <Text style={styles.socialText}>G</Text>
          </Pressable>
          <Pressable style={styles.socialBtn} android_ripple={{ color: 'rgba(255,255,255,0.15)' }}>
            <Text style={styles.socialText}>f</Text>
          </Pressable>
        </View>
      </View>
    </ScreenFrame>
  );
};

export default Login;
