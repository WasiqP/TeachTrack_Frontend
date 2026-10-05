import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, radius, useThemeMode } from '../theme';
import BackButton from '../components/Reusable-Components/BackButton';
import { enterMainApp } from '../navigation/enterMainApp';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const Login: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { ink, theme } = useThemeMode();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: ink.canvas,
          paddingHorizontal: 28,
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
          fontSize: 36,
          lineHeight: 40,
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
    [ink, theme],
  );

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('GetStarted');
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
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
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor={ink.inkSoft}
          secureTextEntry
          style={styles.input}
        />
        <Pressable
          style={styles.primaryBtn}
          android_ripple={{ color: theme.rippleLight }}
          onPress={() => enterMainApp(navigation)}
        >
          <Text style={styles.primaryLabel}>Log In</Text>
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
      </View>
    </SafeAreaView>
  );
};

export default Login;
