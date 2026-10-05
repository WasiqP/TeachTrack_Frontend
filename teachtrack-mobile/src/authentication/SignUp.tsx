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
import { usePulseAlert } from '../context/AlertModalContext';
import { PulseScrollView } from '../components/PulseScrollView';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUp: React.FC<Props> = ({ navigation }) => {
  const { ink, theme } = useThemeMode();
  const { showAlert } = usePulseAlert();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('GetStarted');
    }
  };

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
          paddingBottom: 18,
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
          marginTop: 0,
          marginBottom: 12,
          letterSpacing: -0.8,
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
          marginTop: 16,
          backgroundColor: theme.primary,
          paddingVertical: 14,
          borderRadius: radius.btn,
          alignItems: 'center',
        },
        primaryLabel: {
          color: theme.white,
          fontSize: 17,
          fontFamily: F.outfitBold,
        },
        socialHint: {
          marginTop: 12,
          fontSize: 13,
          textAlign: 'center',
          color: ink.inkSoft,
          fontFamily: F.dmMedium,
        },
        socialRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 16,
          marginTop: 8,
        },
        socialBtn: {
          backgroundColor: ink.borderInk,
          width: 92,
          paddingVertical: 10,
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
        terms: {
          marginTop: 12,
          fontSize: 12,
          lineHeight: 17,
          textAlign: 'center',
          color: ink.inkSoft,
          fontFamily: F.dmRegular,
          paddingHorizontal: 4,
        },
        link: {
          color: theme.primary,
          fontFamily: F.dmBold,
        },
        loginRow: {
          marginTop: 14,
          paddingBottom: 6,
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
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
            <Text style={styles.sub}>Join today</Text>
            <Text style={styles.heading}>Sign up</Text>

            <TextInput
              style={[styles.input, styles.inputFirst]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={ink.inkSoft}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={ink.inkSoft}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              placeholderTextColor={ink.inkSoft}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm your password"
              placeholderTextColor={ink.inkSoft}
              secureTextEntry
            />

            <Pressable
              style={styles.primaryBtn}
              android_ripple={{ color: theme.rippleLight }}
              onPress={() => {
                if (!name.trim() || !email.trim()) {
                  showAlert({
                    variant: 'warning',
                    title: 'Missing information',
                    message: 'Please enter your name and email to continue.',
                  });
                  return;
                }
                if (!password.trim() || password !== confirm) {
                  showAlert({
                    variant: 'warning',
                    title: 'Check your password',
                    message: 'Enter a password and make sure both fields match.',
                  });
                  return;
                }
                navigation.replace('VerifyOtp', {
                  email: email.trim(),
                  purpose: 'signup',
                  name: name.trim(),
                });
              }}
            >
              <Text style={styles.primaryLabel}>Sign Up</Text>
            </Pressable>

            <Text style={styles.socialHint}>Sign up with socials</Text>
            <View style={styles.socialRow}>
              <Pressable style={styles.socialBtn} android_ripple={{ color: 'rgba(255,255,255,0.15)' }}>
                <Text style={styles.socialText}>G</Text>
              </Pressable>
              <Pressable style={styles.socialBtn} android_ripple={{ color: 'rgba(255,255,255,0.15)' }}>
                <Text style={styles.socialText}>f</Text>
              </Pressable>
            </View>

            <Text style={styles.terms}>
              By signing up, you agree to our <Text style={styles.link}>Terms of Service</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>.
            </Text>

            <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginRow} hitSlop={8}>
              <Text style={styles.alt}>
                Already have an account? <Text style={styles.altLink}>Log In</Text>
              </Text>
            </Pressable>
          </View>
        </PulseScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
