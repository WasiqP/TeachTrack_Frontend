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
import { PulseScrollView } from '../components/PulseScrollView';
import { useAuth } from '../context/AuthContext';
import { usePulseAlert } from '../context/AlertModalContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

const ResetPassword: React.FC<Props> = ({ navigation, route }) => {
  const { ink, theme } = useThemeMode();
  const layout = useLayout();
  const { resetToken } = route.params;
  const { resetPassword } = useAuth();
  const { showAlert, showSuccess } = usePulseAlert();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

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
          paddingHorizontal: layout.authGutter,
          paddingTop: 0,
          paddingBottom: 24,
          maxWidth: layout.contentMax,
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
    [ink, theme, layout],
  );

  const handleSave = async () => {
    if (!password.trim() || password !== confirm) {
      showAlert({
        variant: 'warning',
        title: 'Check your password',
        message: 'Enter a new password and make sure both fields match.',
      });
      return;
    }
    setBusy(true);
    try {
      await resetPassword(resetToken, password);
      showSuccess('Password updated', 'Sign in with your new password.', () => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      });
    } catch (err) {
      showAlert({
        variant: 'error',
        title: 'Couldn’t reset password',
        message: err instanceof Error ? err.message : 'Request a new code and try again.',
      });
    } finally {
      setBusy(false);
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
            <Text style={styles.sub}>Account recovery</Text>
            <Text style={styles.heading}>New password</Text>
            <Text style={styles.lede}>
              Choose a new password for your TeachTrack account. You’ll sign in with it next.
            </Text>

            <TextInput
              style={[styles.input, styles.inputFirst]}
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              placeholderTextColor={ink.inkSoft}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm new password"
              placeholderTextColor={ink.inkSoft}
              secureTextEntry
            />

            <Pressable
              style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
              android_ripple={{ color: theme.rippleLight }}
              disabled={busy}
              onPress={handleSave}
            >
              <Text style={styles.primaryLabel}>{busy ? 'Saving…' : 'Save password'}</Text>
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

export default ResetPassword;
