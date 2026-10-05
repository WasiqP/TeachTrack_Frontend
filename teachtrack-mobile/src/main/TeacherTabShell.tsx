import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Animated, BackHandler } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList, MainTabRoute } from '../types/navigation';
import BottomTab from '../components/BottomTab';
import Home from './Home';
import MyClasses from './MyClasses';
import ViewGrades from './ViewGrades';
import Settings from './Settings';
import Quizzes from '../teacher/Quizzes';
import { useThemeMode } from '../theme';
import { isAuthFlowRoute } from '../navigation/focusedRoute';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Single stack screen that swaps main app areas in place (no stack transition between tabs).
 * Tab panels stay mounted (hidden) so scroll position and local state are preserved.
 */
const TeacherTabShell: React.FC<Props> = ({ navigation, route }) => {
  const [tab, setTab] = useState<MainTabRoute>('Home');
  const { ink } = useThemeMode();
  const bottomBarEnter = useRef(new Animated.Value(1)).current;
  const tabRef = useRef(tab);
  tabRef.current = tab;

  useLayoutEffect(() => {
    if (route.params?.homeEntrance) {
      bottomBarEnter.setValue(0);
    }
  }, [route.params?.homeEntrance, bottomBarEnter]);

  useEffect(() => {
    if (!route.params?.homeEntrance) return;
    Animated.spring(bottomBarEnter, {
      toValue: 1,
      friction: 7,
      tension: 78,
      useNativeDriver: true,
    }).start();
  }, [route.params?.homeEntrance, bottomBarEnter]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        panelHost: {
          flex: 1,
          position: 'relative',
        },
        layer: {
          ...StyleSheet.absoluteFillObject,
        },
        layerHidden: {
          opacity: 0,
        },
      }),
    [ink],
  );

  useFocusEffect(
    useCallback(() => {
      const t = route.params?.tab;
      if (t != null) {
        setTab(t);
        navigation.setParams({ tab: undefined });
      }
    }, [navigation, route.params?.tab]),
  );

  /** Never let hardware back return to Login / SignUp / Get Started. */
  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        const state = navigation.getState();
        const index = state?.index ?? 0;
        const routes = state?.routes ?? [];

        if (index > 0) {
          const prevName = routes[index - 1]?.name;
          if (isAuthFlowRoute(prevName)) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
            return true;
          }
          return false;
        }

        if (tabRef.current !== 'Home') {
          setTab('Home');
          return true;
        }

        // Root Home tab: leave default (exit app on Android).
        return false;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [navigation]),
  );

  /** Block iOS / gesture stack pops that would land on an auth screen. */
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      const actionType = e.data.action.type;
      if (actionType !== 'GO_BACK' && actionType !== 'POP' && actionType !== 'POP_TO_TOP') {
        return;
      }
      const state = navigation.getState();
      const index = state?.index ?? 0;
      const routes = state?.routes ?? [];
      if (index <= 0) {
        e.preventDefault();
        return;
      }
      const prevName = routes[index - 1]?.name;
      if (isAuthFlowRoute(prevName)) {
        e.preventDefault();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    });
    return unsub;
  }, [navigation]);

  const layerProps = (name: MainTabRoute) => ({
    style: [styles.layer, tab !== name && styles.layerHidden],
    pointerEvents: (tab === name ? 'auto' : 'none') as 'auto' | 'none',
  });

  return (
    <View style={styles.root}>
      <View style={styles.panelHost}>
        <View {...layerProps('Home')}>
          <Home navigation={navigation} route={route} embedded onSelectTab={setTab} />
        </View>
        <View {...layerProps('MyClasses')}>
          <MyClasses navigation={navigation} embedded />
        </View>
        <View {...layerProps('Quizzes')}>
          <Quizzes navigation={navigation} embedded />
        </View>
        <View {...layerProps('ViewGrades')}>
          <ViewGrades navigation={navigation} embedded active={tab === 'ViewGrades'} />
        </View>
        <View {...layerProps('Settings')}>
          <Settings navigation={navigation} embedded />
        </View>
      </View>
      <Animated.View style={{ opacity: bottomBarEnter }}>
        <BottomTab
          navigation={navigation}
          currentRoute={tab}
          onSelectTab={(name) => setTab(name as MainTabRoute)}
        />
      </Animated.View>
    </View>
  );
};

export default TeacherTabShell;
