import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  PanResponder,
  Vibration,
  Platform,
  Dimensions,
} from 'react-native';
import type { ScrollView } from 'react-native';
import type { GestureResponderEvent, PanResponderGestureState } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, radius, useThemeMode } from '../theme';
import { useForms } from '../context/FormsContext';
import BackButton from '../components/Reusable-Components/BackButton';
import { PulseScrollView } from '../components/PulseScrollView';
import EditPurpleIcon from '../../assets/images/edit-purple.svg';
import TrashIcon from '../../assets/images/trash.svg';
import type { QuestionData, QuestionType } from './QuestionsScreen';
import { questionTypeSummary } from './questionTypeSummary';

type Props = NativeStackScreenProps<RootStackParamList, 'SwapQuestions'>;

const ROW_HEIGHT = 116;
const DRAG_LIFT_PX = 14;

const GripIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

const SwapQuestionsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { formId } = route.params;
  const { forms, updateForm } = useForms();
  const form = useMemo(() => forms.find((f) => f.id === formId), [forms, formId]);
  const { ink, theme, isDark } = useThemeMode();
  const insets = useSafeAreaInsets();
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const trashScale = useRef(new Animated.Value(1)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollYRef = useRef(0);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollDeltaRef = useRef(0);

  const loadQuestions = useCallback(() => {
    const derived: QuestionData[] =
      (form?.answers?.questions as QuestionData[] | undefined) ||
      Array.from({ length: 6 }).map((_, i) => ({
        id: `${i + 1}`,
        title: `Question ${i + 1}`,
        type: 'shortText' as QuestionType,
        required: false,
      }));
    setQuestions(derived);
  }, [form]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useFocusEffect(
    useCallback(() => {
      loadQuestions();
    }, [loadQuestions]),
  );

  const showToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setToastVisible(false);
    });
    toastTimer.current = setTimeout(() => {
      toastTimer.current = null;
    }, 2000);
  }, [toastOpacity]);

  const handleDeleteByIndex = (index: number) => {
    setQuestions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (form) {
        updateForm(formId, {
          answers: {
            ...form.answers,
            questions: next,
          },
        });
      }
      return next;
    });
    showToast();
  };

  const swapQuestions = (fromIndex: number, toIndex: number) => {
    setQuestions((prev) => {
      const t = Math.max(0, Math.min(prev.length - 1, toIndex));
      if (t === fromIndex) return prev;
      const copy = prev.slice();
      const tmp = copy[fromIndex];
      copy[fromIndex] = copy[t];
      copy[t] = tmp;
      if (form) {
        updateForm(formId, {
          answers: {
            ...form.answers,
            questions: copy,
          },
        });
      }
      return copy;
    });
  };

  const stopAutoScroll = () => {
    scrollDeltaRef.current = 0;
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 16) + 32,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 16,
        },
        headerTextCol: {
          flex: 1,
          minWidth: 0,
          paddingTop: Platform.OS === 'ios' ? 4 : 2,
        },
        heroTitle: {
          fontSize: 22,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.5,
          lineHeight: 26,
          marginBottom: 4,
        },
        heroSub: {
          fontSize: 13,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          lineHeight: 18,
        },
        tipCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: radius.input,
          backgroundColor: theme.primarySoft,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          marginBottom: 18,
        },
        tipText: {
          flex: 1,
          fontSize: 13,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          lineHeight: 19,
        },
        sectionLabel: {
          fontSize: 11,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 10,
        },
        questionItem: {
          minHeight: ROW_HEIGHT,
          backgroundColor: theme.card,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.card,
          paddingHorizontal: 14,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        },
        questionItemTouched: {
          borderColor: theme.primary,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.14,
          shadowRadius: 10,
          elevation: 6,
        },
        questionItemAirborne: {
          borderWidth: Math.max(2, ink.borderWidth),
          borderColor: theme.primary,
          backgroundColor: isDark ? ink.canvas : theme.card,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.2,
          shadowRadius: 20,
          elevation: 20,
        },
        qLeft: {
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        },
        qIndex: {
          width: 32,
          height: 32,
          textAlign: 'center',
          borderRadius: 12,
          borderWidth: ink.borderWidth,
          borderColor: theme.primary,
          backgroundColor: theme.primarySoft,
          fontSize: 14,
          fontFamily: F.dmSemi,
          color: theme.primary,
          overflow: 'hidden',
          paddingTop: Platform.OS === 'android' ? 5 : 6,
          ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : {}),
        },
        qContent: {
          flex: 1,
          minWidth: 0,
        },
        qTitle: {
          fontSize: 16,
          fontFamily: F.dmSemi,
          color: ink.ink,
          marginBottom: 8,
        },
        qMetaRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
        },
        typePill: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8,
          backgroundColor: ink.pressTint,
        },
        typePillText: {
          fontSize: 11,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
        },
        requiredBadge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8,
          backgroundColor: 'rgba(220, 38, 38, 0.12)',
          borderWidth: ink.borderWidth,
          borderColor: 'rgba(220, 38, 38, 0.35)',
        },
        requiredText: {
          fontSize: 10,
          fontFamily: F.dmSemi,
          color: '#DC2626',
        },
        qActions: {
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 6,
          marginLeft: 6,
        },
        editIconBtn: {
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
        },
        gripMuted: {
          opacity: 0.5,
        },
        emptyWrap: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        },
        emptyTitle: {
          fontSize: 18,
          fontFamily: F.outfitBold,
          color: ink.ink,
        },
        toast: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: Math.max(insets.bottom, 12) + 20,
          backgroundColor: ink.ink,
          borderRadius: radius.input,
          paddingVertical: 14,
          paddingHorizontal: 18,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        },
        toastText: {
          fontSize: 14,
          fontFamily: F.dmSemi,
          color: theme.white,
        },
      }),
    [ink, theme, isDark, insets.bottom],
  );

  const SwapRow: React.FC<{ q: QuestionData; index: number }> = ({ q, index }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const [isFingerDown, setIsFingerDown] = useState(false);
    const [isAirborne, setIsAirborne] = useState(false);
    const hasMovedRef = useRef(false);
    const dragLiftActiveRef = useRef(false);
    const pressCooldownUntilRef = useRef(0);

    const rotateDeg = rotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '-2.25deg'],
    });

    const resetLiftAnimation = () => {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 280, useNativeDriver: true }),
        Animated.spring(rotate, { toValue: 0, friction: 7, useNativeDriver: true }),
        Animated.spring(trashScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    };

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
        onPanResponderGrant: () => {
          hasMovedRef.current = false;
          dragLiftActiveRef.current = false;
          setIsFingerDown(true);
          Animated.spring(scale, {
            toValue: 1.028,
            friction: 5,
            tension: 400,
            useNativeDriver: true,
          }).start();
          try {
            Vibration.vibrate(Platform.OS === 'ios' ? 8 : 12);
          } catch {
            /* no-op */
          }
        },
        onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
          if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) {
            if (!dragLiftActiveRef.current) {
              dragLiftActiveRef.current = true;
              hasMovedRef.current = true;
              setIsAirborne(true);
              try {
                Vibration.vibrate(16);
              } catch {
                /* no-op */
              }
              Animated.parallel([
                Animated.spring(scale, {
                  toValue: 1.072,
                  friction: 4,
                  tension: 420,
                  useNativeDriver: true,
                }),
                Animated.spring(rotate, { toValue: 1, friction: 6, tension: 320, useNativeDriver: true }),
              ]).start();
              Animated.spring(trashScale, { toValue: 1.18, friction: 4, useNativeDriver: true }).start();
            }
            translateX.setValue(gesture.dx);
            translateY.setValue(gesture.dy - DRAG_LIFT_PX);

            const topEdge = 160;
            const bottomEdge = SCREEN_HEIGHT - insets.bottom - 72;
            if (gesture.moveY < topEdge) {
              scrollDeltaRef.current = -14;
            } else if (gesture.moveY > bottomEdge) {
              scrollDeltaRef.current = 14;
            } else {
              scrollDeltaRef.current = 0;
            }
            if (!autoScrollTimerRef.current) {
              autoScrollTimerRef.current = setInterval(() => {
                if (!scrollRef.current) return;
                const delta = scrollDeltaRef.current;
                if (delta === 0) return;
                const next = Math.max(0, scrollYRef.current + delta);
                scrollRef.current.scrollTo({ y: next, animated: false });
                scrollYRef.current = next;
              }, 16);
            }
          }
        },
        onPanResponderRelease: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
          stopAutoScroll();
          const didFreeDrag = dragLiftActiveRef.current;
          if (hasMovedRef.current) {
            Animated.parallel([
              Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
              Animated.spring(rotate, { toValue: 0, friction: 7, useNativeDriver: true }),
              Animated.spring(trashScale, { toValue: 1, friction: 5, useNativeDriver: true }),
            ]).start();

            if (gesture.dx < -80) {
              handleDeleteByIndex(index);
              hasMovedRef.current = false;
              dragLiftActiveRef.current = false;
              setIsFingerDown(false);
              setIsAirborne(false);
              Animated.parallel([
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
              ]).start();
              return;
            }

            if (gesture.dx > 100 && gesture.dy < -60) {
              handleDeleteByIndex(index);
              hasMovedRef.current = false;
              dragLiftActiveRef.current = false;
              setIsFingerDown(false);
              setIsAirborne(false);
              Animated.parallel([
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
              ]).start();
              return;
            }

            if (Math.abs(gesture.dy) > ROW_HEIGHT / 2) {
              const steps = Math.round(gesture.dy / ROW_HEIGHT);
              swapQuestions(index, index + steps);
            }

            Animated.parallel([
              Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
              Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
            ]).start();
          } else {
            resetLiftAnimation();
          }
          hasMovedRef.current = false;
          dragLiftActiveRef.current = false;
          setIsFingerDown(false);
          setIsAirborne(false);
          if (didFreeDrag) {
            pressCooldownUntilRef.current = Date.now() + 320;
          }
        },
        onPanResponderTerminate: () => {
          stopAutoScroll();
          if (dragLiftActiveRef.current) {
            pressCooldownUntilRef.current = Date.now() + 320;
          }
          hasMovedRef.current = false;
          dragLiftActiveRef.current = false;
          setIsFingerDown(false);
          setIsAirborne(false);
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
            Animated.spring(rotate, { toValue: 0, friction: 7, useNativeDriver: true }),
            Animated.spring(trashScale, { toValue: 1, friction: 5, useNativeDriver: true }),
          ]).start();
        },
      }),
    ).current;

    return (
      <Pressable
        onPress={() => {
          if (Date.now() < pressCooldownUntilRef.current) return;
          navigation.navigate('QuestionsScreen', { formId, questionId: q.id });
        }}
        delayLongPress={200}
      >
        <Animated.View
          style={[
            styles.questionItem,
            isFingerDown && !isAirborne && styles.questionItemTouched,
            isAirborne && styles.questionItemAirborne,
            {
              transform: [{ translateX }, { translateY }, { rotate: rotateDeg }, { scale }],
              zIndex: isFingerDown ? 9999 : 0,
              elevation: isFingerDown ? (isAirborne ? 24 : 10) : 0,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.qLeft}>
            <Text style={styles.qIndex}>{index + 1}</Text>
          </View>
          <View style={styles.qContent}>
            <Text style={styles.qTitle} numberOfLines={2}>
              {q.title || 'Untitled question'}
            </Text>
            <View style={styles.qMetaRow}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>{questionTypeSummary(q)}</Text>
              </View>
              {q.required ? (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.qActions}>
            <Pressable
              onPress={() => navigation.navigate('QuestionsScreen', { formId, questionId: q.id })}
              style={styles.editIconBtn}
              android_ripple={{ color: theme.rippleLight, borderless: true }}
              hitSlop={8}
            >
              <EditPurpleIcon width={22} height={22} />
            </Pressable>
            <View style={[styles.gripMuted, isAirborne && { opacity: 1 }]}>
              <GripIcon color={isAirborne ? theme.primary : ink.iconMuted} size={16} />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  };

  if (!form) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Task not found</Text>
          <BackButton onPress={() => navigation.goBack()} stroke={ink.ink} rippleColor={theme.rippleLight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PulseScrollView
        ref={(r) => {
          scrollRef.current = r;
        }}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.headerRow}>
          <BackButton onPress={() => navigation.goBack()} stroke={ink.ink} rippleColor={theme.rippleLight} />
          <View style={styles.headerTextCol}>
            <Text style={styles.heroTitle}>Reorder questions</Text>
            <Text style={styles.heroSub}>
              Drag cards to move them. Lift and swipe left toward the trash hint to remove. Tap a row or
              the pencil to edit.
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Animated.View style={{ transform: [{ scale: trashScale }] }}>
            <TrashIcon width={22} height={22} stroke={theme.primary} />
          </Animated.View>
          <Text style={styles.tipText}>
            Press and drag — the card lifts and follows your thumb. Move up or down to reorder. Near the
            top or bottom edge, the list auto-scrolls. Swipe left toward the trash to delete.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Drag to reorder</Text>
        {questions.map((q, i) => (
          <SwapRow key={q.id} q={q} index={i} />
        ))}
      </PulseScrollView>

      {toastVisible ? (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Text style={styles.toastText}>Question removed</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
};

export default SwapQuestionsScreen;
