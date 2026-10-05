import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  View,
  Easing,
} from 'react-native';
import { useThemeMode } from '../theme';

const { width, height } = Dimensions.get('window');

type Props = {
  /** Increments on each navigation; overlay animates when tick changes. */
  tick: number;
};

/**
 * Full-screen purple flash + logo pulse on route change. Sits above content with
 * pointerEvents none so it does not block touches. Pairs with native-stack transitions.
 */
export default function BrandedTransitionOverlay({ tick }: Props) {
  const { theme } = useThemeMode();
  const veil = useRef(new Animated.Value(0)).current;
  const logo = useRef(new Animated.Value(0.9)).current;
  const runRef = useRef(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 9999,
          elevation: 9999,
        },
        veil: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: theme.primary,
        },
        logoWrap: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
        },
        logo: {
          width: width * 0.42,
          height: height * 0.14,
          maxHeight: 120,
        },
      }),
    [theme.primary],
  );

  useEffect(() => {
    if (tick === 0) return;
    const id = ++runRef.current;
    veil.setValue(0);
    logo.setValue(0.88);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(veil, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logo, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(veil, {
          toValue: 0,
          duration: 380,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished && id === runRef.current) {
        veil.setValue(0);
        logo.setValue(0.88);
      }
    });
  }, [tick, veil, logo]);

  const veilOpacity = veil.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.94],
  });

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View style={[styles.veil, { opacity: veilOpacity }]} />
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: veil,
            transform: [{ scale: logo }],
          },
        ]}
      >
        <Image
          source={require('../../assets/images/logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
