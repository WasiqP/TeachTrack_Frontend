import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, useThemeMode } from '../theme';
import ScreenFrame from '../components/layout/ScreenFrame';
import Button from '../components/Reusable-Components/Button';
import { scaleFont, useResponsive } from '../ui/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'GetStarted'>;

const GetStarted: React.FC<Props> = ({ navigation }) => {
  const { ink, theme } = useThemeMode();
  const r = useResponsive();

  const logoSize = r.isSmallPhone ? 148 : r.isLargePhone ? 176 : 164;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        body: {
          flex: 1,
          paddingHorizontal: r.gutter + 8,
          paddingTop: r.isSmallPhone ? 28 : 40,
          paddingBottom: Platform.OS === 'ios' ? 28 : 20,
        },
        main: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: r.isSmallPhone ? 20 : 24,
        },
        brandBlock: {
          alignItems: 'stretch',
          gap: 16,
        },
        logoWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        },
        logo: {
          width: logoSize,
          height: logoSize,
        },
        copy: {
          alignItems: 'flex-start',
          gap: 10,
        },
        eyebrow: {
          fontSize: 12,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          alignSelf: 'stretch',
        },
        title: {
          fontSize: scaleFont(36, r.titleScale),
          lineHeight: scaleFont(40, r.titleScale),
          fontFamily: F.outfitBlack,
          letterSpacing: -0.8,
          alignSelf: 'stretch',
        },
        titleGroove: {
          color: ink.ink,
        },
        titleBox: {
          color: theme.brandLogoPurple,
        },
        lede: {
          fontSize: scaleFont(16, r.bodyScale),
          lineHeight: scaleFont(24, r.bodyScale),
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          alignSelf: 'stretch',
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: ink.rowDivider,
          alignSelf: 'stretch',
          marginTop: 4,
        },
        buttonZone: {
          alignSelf: 'stretch',
          gap: 14,
          paddingTop: 8,
        },
      }),
    [ink, theme, r.gutter, r.titleScale, r.bodyScale, r.isSmallPhone, logoSize],
  );

  return (
    <ScreenFrame style={styles.screen} edges={['top', 'bottom', 'left', 'right']} framed={false}>
      <View style={styles.body}>
        <View style={styles.main}>
          <View style={styles.brandBlock}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../assets/images/logo-transparent.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.copy}>
              <Text style={styles.eyebrow}>Welcome to GrooveBox</Text>
              <Text style={styles.title}>
                <Text style={styles.titleGroove}>Groove</Text>
                <Text style={styles.titleBox}>Box</Text>
              </Text>
              <Text style={styles.lede}>
                Complete personal assistant for teachers. Plan classes, run quizzes, and track
                attendance—without jumping between apps.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.buttonZone}>
            <Button
              title="Get Started"
              fullWidth
              size="lg"
              variant="primary"
              onPress={() => navigation.navigate('Onboarding01')}
            />
            <Button
              title="Log In"
              fullWidth
              size="lg"
              variant="secondary"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </View>
      </View>
    </ScreenFrame>
  );
};

export default GetStarted;
