import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  Share as RNShare,
  Linking,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useForms } from '../context/FormsContext';
import { useClasses } from '../context/ClassesContext';
import { useGradesTasks, type TaskKind } from '../context/GradesTasksContext';
import { fonts as F, radius, useThemeMode } from '../theme';
import BackButton from '../components/Reusable-Components/BackButton';
import FormIcon from '../components/FormIcons';
import ShareIcon from '../../assets/images/share.svg';
import SocialWhatsappIcon from '../../assets/images/social-whatsapp.svg';
import SocialEmailIcon from '../../assets/images/social-email.svg';
import SocialSmsIcon from '../../assets/images/social-sms.svg';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { PulseScrollView } from '../components/PulseScrollView';
import { usePulseAlert } from '../context/AlertModalContext';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareTask'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const KIND_LABEL: Record<TaskKind, string> = {
  quiz: 'Quiz',
  assignment: 'Assignment',
  project: 'Project',
  test: 'Test',
};

function mapFormKindToTaskKind(raw: unknown): TaskKind {
  if (raw === 'quiz' || raw === 'assignment' || raw === 'test' || raw === 'project') {
    return raw;
  }
  return 'quiz';
}

/** Maps Create Form due chip → label + end-of-day deadline for gradebook / Home activity. */
function computeDueFromPreset(ref: Date, duePreset: unknown): { dueLabel: string; dueAt: string } {
  const p = typeof duePreset === 'string' ? duePreset : 'week';
  const end = new Date(ref.getTime());
  const endOfDay = () => {
    end.setHours(23, 59, 59, 999);
  };
  switch (p) {
    case 'today':
      endOfDay();
      return { dueLabel: 'Due today', dueAt: end.toISOString() };
    case 'tomorrow':
      end.setDate(end.getDate() + 1);
      endOfDay();
      return { dueLabel: 'Due tomorrow', dueAt: end.toISOString() };
    case 'week': {
      const dow = end.getDay();
      const daysUntilSun = dow === 0 ? 0 : 7 - dow;
      end.setDate(end.getDate() + daysUntilSun);
      endOfDay();
      return { dueLabel: 'Due this week', dueAt: end.toISOString() };
    }
    case 'two_weeks':
      end.setDate(end.getDate() + 14);
      endOfDay();
      return { dueLabel: 'Due in 2 wks', dueAt: end.toISOString() };
    case 'month':
      end.setMonth(end.getMonth() + 1);
      endOfDay();
      return { dueLabel: 'Due next month', dueAt: end.toISOString() };
    case 'custom':
    default:
      end.setDate(end.getDate() + 7);
      endOfDay();
      return { dueLabel: 'Due in ~1 wk', dueAt: end.toISOString() };
  }
}

const TABS = [
  { key: 'classes' as const, label: 'Classes' },
  { key: 'link' as const, label: 'Link' },
  { key: 'qr' as const, label: 'QR code' },
];

const ShareTaskScreen: React.FC<Props> = ({ route, navigation }) => {
  const { ink, theme, isDark } = useThemeMode();
  const { formId } = route.params;
  const { forms } = useForms();
  const { classes, updateClass } = useClasses();
  const { assignFormToClasses } = useGradesTasks();
  const { showSuccess, showError } = usePulseAlert();
  const form = forms.find((f) => f.id === formId);

  const [mainTab, setMainTab] = useState<'classes' | 'link' | 'qr'>('classes');
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const viewShotRef = useRef<any>(null);
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const exitTranslate = useRef(new Animated.Value(0)).current;
  const exitScale = useRef(new Animated.Value(1)).current;

  const formLink = form ? `https://pulsebox.app/form/${formId}` : '';

  const taskKind = useMemo(
    () => mapFormKindToTaskKind(form?.answers?.taskKind ?? form?.answers?.assessmentType),
    [form],
  );

  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  );

  const toggleClass = useCallback((id: string) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllClasses = useCallback(() => {
    setSelectedClassIds(new Set(sortedClasses.map((c) => c.id)));
  }, [sortedClasses]);

  const clearClassSelection = useCallback(() => {
    setSelectedClassIds(new Set());
  }, []);

  const goToHome = useCallback(() => {
    navigation.navigate('Home', { tab: 'Home' });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      exitOpacity.setValue(1);
      exitTranslate.setValue(0);
      exitScale.setValue(1);
    }, [exitOpacity, exitTranslate, exitScale]),
  );

  /** Runs only after the user dismisses the “Task assigned” success modal (OK). */
  const playExitThenGoHome = useCallback(() => {
    Animated.parallel([
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(exitTranslate, {
        toValue: 28,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(exitScale, {
        toValue: 0.94,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      navigation.navigate('Home', { tab: 'Home', homeEntrance: true });
    });
  }, [navigation, exitOpacity, exitTranslate, exitScale]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        exitLayer: {
          flex: 1,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingLeft: 8,
          paddingTop: 8,
          paddingBottom: 10,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.rowDivider,
        },
        headerTitle: {
          flex: 1,
          marginLeft: 4,
          fontSize: 20,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.3,
        },
        headerCloseBtn: {
          minWidth: 44,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: -4,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
        },
        hero: {
          marginBottom: 20,
          paddingBottom: 18,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.rowDivider,
        },
        heroIcon: {
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        taskTitle: {
          fontSize: 22,
          lineHeight: 28,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.4,
          marginBottom: 8,
        },
        heroMeta: {
          fontSize: 14,
          lineHeight: 20,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 12,
        },
        sectionLabel: {
          fontSize: 12,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 10,
        },
        tabRow: {
          flexDirection: 'row',
          alignItems: 'stretch',
          borderRadius: radius.card,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: ink.canvas,
          padding: 4,
          marginBottom: 14,
          overflow: 'hidden',
        },
        tabCell: {
          flex: 1,
          minWidth: 0,
          marginHorizontal: 2,
        },
        tabBtn: {
          minHeight: 44,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 12,
          paddingHorizontal: 4,
          overflow: 'hidden',
        },
        tabBtnOff: {
          backgroundColor: 'transparent',
        },
        tabBtnOn: {
          backgroundColor: theme.primary,
        },
        tabBtnTxt: {
          fontSize: 13,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          textAlign: 'center',
        },
        tabBtnTxtOn: {
          color: theme.white,
        },
        panel: {
          borderRadius: radius.card,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: ink.canvas,
          padding: 16,
        },
        panelIntro: {
          fontSize: 15,
          lineHeight: 22,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 14,
        },
        rowActions: {
          flexDirection: 'row',
          gap: 12,
          marginBottom: 14,
        },
        textLink: {
          paddingVertical: 4,
        },
        textLinkTxt: {
          fontSize: 14,
          fontFamily: F.dmSemi,
          color: theme.primary,
        },
        classRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          marginBottom: 8,
          backgroundColor: isDark ? theme.backgroundAlt : ink.canvas,
          gap: 12,
        },
        classRowOn: {
          borderColor: theme.primary,
          backgroundColor: theme.primarySoft,
        },
        checkOuter: {
          width: 22,
          height: 22,
          borderRadius: 7,
          borderWidth: 2,
          borderColor: ink.borderInk,
          alignItems: 'center',
          justifyContent: 'center',
        },
        checkOuterOn: {
          borderColor: theme.primary,
          backgroundColor: theme.primary,
        },
        classMid: {
          flex: 1,
          minWidth: 0,
        },
        className: {
          fontSize: 16,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        classSub: {
          fontSize: 13,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginTop: 2,
        },
        assignBtn: {
          marginTop: 16,
          backgroundColor: theme.primary,
          borderRadius: radius.btn,
          minHeight: 48,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          borderWidth: ink.borderWidth,
          borderColor: 'rgba(0,0,0,0.08)',
        },
        assignBtnDisabled: {
          opacity: 0.42,
        },
        assignBtnTxt: {
          fontSize: 16,
          fontFamily: F.dmSemi,
          color: theme.white,
        },
        fieldLabel: {
          fontSize: 12,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginBottom: 8,
        },
        linkField: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          paddingHorizontal: 12,
          marginBottom: 10,
          backgroundColor: isDark ? theme.backgroundAlt : ink.canvas,
        },
        linkInput: {
          flex: 1,
          paddingVertical: Platform.OS === 'ios' ? 12 : 10,
          fontSize: 14,
          fontFamily: F.dmRegular,
          color: ink.ink,
        },
        copyCompact: {
          paddingVertical: 10,
          paddingHorizontal: 4,
        },
        copyCompactTxt: {
          fontSize: 14,
          fontFamily: F.dmSemi,
          color: theme.primary,
        },
        helper: {
          fontSize: 13,
          lineHeight: 19,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 14,
        },
        primaryOutlineBtn: {
          borderRadius: radius.btn,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          paddingVertical: 12,
          alignItems: 'center',
          marginBottom: 12,
          backgroundColor: isDark ? theme.backgroundAlt : ink.canvas,
        },
        primaryOutlineTxt: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        shareRow: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: radius.input,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          padding: 14,
          gap: 12,
          marginBottom: 16,
          backgroundColor: isDark ? theme.backgroundAlt : ink.canvas,
        },
        shareRowTxt: {
          flex: 1,
          fontSize: 15,
          fontFamily: F.dmMedium,
          color: ink.ink,
        },
        socialRow: {
          flexDirection: 'row',
          gap: 8,
        },
        socialBtn: {
          flex: 1,
          minWidth: 0,
          alignItems: 'center',
          paddingVertical: 12,
          borderRadius: radius.input,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: isDark ? theme.backgroundAlt : ink.canvas,
        },
        socialDot: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        },
        socialLbl: {
          fontSize: 11,
          fontFamily: F.dmSemi,
          color: ink.ink,
          textAlign: 'center',
        },
        qrHint: {
          fontSize: 15,
          lineHeight: 22,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 16,
        },
        qrFrame: {
          alignItems: 'center',
          marginBottom: 16,
        },
        qrCard: {
          backgroundColor: '#FFFFFF',
          borderRadius: radius.card,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          padding: 20,
          alignItems: 'center',
        },
        qrTitle: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: '#111',
          marginTop: 12,
          textAlign: 'center',
        },
        qrSub: {
          fontSize: 12,
          fontFamily: F.dmRegular,
          color: '#444',
          marginTop: 4,
        },
        saveBtn: {
          backgroundColor: theme.primary,
          borderRadius: radius.btn,
          paddingVertical: 14,
          alignItems: 'center',
          marginBottom: 10,
        },
        saveBtnTxt: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: theme.white,
        },
        qrFooterBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 12,
          borderRadius: radius.input,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: isDark ? theme.backgroundAlt : ink.canvas,
        },
        qrFooterTxt: {
          fontSize: 14,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        emptyBox: {
          padding: 16,
          borderRadius: radius.card,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderStyle: 'dashed',
        },
        emptyTxt: {
          fontSize: 15,
          lineHeight: 22,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          textAlign: 'center',
        },
        notFound: {
          flex: 1,
          padding: 24,
          justifyContent: 'center',
          alignItems: 'center',
        },
        notFoundTitle: {
          fontSize: 18,
          fontFamily: F.outfitBold,
          color: ink.ink,
          marginBottom: 8,
        },
        notFoundBody: {
          fontSize: 15,
          color: ink.inkSoft,
          textAlign: 'center',
        },
      }),
    [ink, theme, isDark],
  );

  const copyToClipboard = async () => {
    try {
      await Clipboard.setString(formLink);
      showSuccess('Link copied', 'The task link is on your clipboard.');
    } catch {
      showError('Error', 'Failed to copy link.');
    }
  };

  const openInBrowser = async () => {
    try {
      const supported = await Linking.canOpenURL(formLink);
      if (supported) await Linking.openURL(formLink);
      else showError('Error', `Cannot open URL: ${formLink}`);
    } catch {
      showError('Error', 'Failed to open link.');
    }
  };

  const shareLink = async () => {
    try {
      await RNShare.share({
        message: `Check out this task: ${formLink}`,
        title: form?.name || 'Share task',
      });
    } catch {
      /* user dismissed */
    }
  };

  const shareOnSocial = async (platform: string) => {
    const message = `Check out this task: ${formLink}`;
    try {
      switch (platform) {
        case 'whatsapp':
          await RNShare.share({ message: `${message} ${formLink}`, title: form?.name || 'Share task' });
          break;
        case 'email':
          await RNShare.share({ message, title: form?.name || 'Share task' });
          break;
        case 'sms':
          await RNShare.share({ message: `${message} ${formLink}` });
          break;
        default:
          await shareLink();
      }
    } catch {
      /* dismiss */
    }
  };

  const saveQRCode = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await captureRef(viewShotRef, { format: 'png', quality: 1.0 });
        showSuccess('QR code saved', `Saved to: ${uri}`);
      }
    } catch {
      showError('Error', 'Failed to save QR code.');
    }
  };

  const handleAssignToClasses = async () => {
    if (!form || selectedClassIds.size === 0) return;
    setAssigning(true);
    try {
      const targets = sortedClasses
        .filter((c) => selectedClassIds.has(c.id))
        .map((c) => ({
          classId: c.id,
          studentIds: (c.students ?? []).map((s) => s.id),
        }));

      const due = computeDueFromPreset(new Date(), form.answers?.duePreset);

      await assignFormToClasses({
        formId: form.id,
        title: form.name,
        kind: taskKind,
        dueLabel: due.dueLabel,
        dueAt: due.dueAt,
        targets,
      });

      for (const c of sortedClasses) {
        if (!selectedClassIds.has(c.id)) continue;
        await updateClass(c.id, {
          activityLog: [
            {
              id: `act-task-${form.id}-${c.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              kind: 'task_assigned',
              headline: `Task assigned: ${form.name}`,
              detail: 'Students can open the shared link or see this task in View grades.',
              createdAt: new Date().toISOString(),
            },
            ...(c.activityLog ?? []),
          ],
        });
      }

      const n = selectedClassIds.size;
      setAssigning(false);
      showSuccess(
        'Task assigned',
        n === 1
          ? 'This task is now in the gradebook for that class. Share the link so students can complete it.'
          : `This task is now in the gradebook for ${n} classes. Share the link so students can complete it.`,
        () => {
          playExitThenGoHome();
        },
      );
    } catch (e) {
      if (__DEV__) console.warn('assign to classes failed', e);
      showError('Could not assign', 'Something went wrong. Try again.');
      setAssigning(false);
    }
  };

  const CheckIcon = ({ size = 12, color = '#fff' }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const CloseHeaderIcon = ({ color }: { color: string }) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  if (!form) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Share task</Text>
          <Pressable
            style={styles.headerCloseBtn}
            onPress={goToHome}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close and go to home"
            android_ripple={{ color: theme.rippleLight, borderless: true }}
          >
            <CloseHeaderIcon color={ink.ink} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Task not found</Text>
          <Text style={styles.notFoundBody}>This task may have been removed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const qrSize = Math.min(220, SCREEN_WIDTH - 120);

  const exitAnimStyle = {
    opacity: exitOpacity,
    transform: [{ translateY: exitTranslate }, { scale: exitScale }],
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Animated.View style={[styles.exitLayer, exitAnimStyle]}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Share task
          </Text>
          <Pressable
            style={styles.headerCloseBtn}
            onPress={goToHome}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close and go to home"
            android_ripple={{ color: theme.rippleLight, borderless: true }}
          >
            <CloseHeaderIcon color={ink.ink} />
          </Pressable>
        </View>

        <PulseScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <FormIcon iconId={form.iconId ?? 'clipboard'} size={28} color={theme.primary} />
          </View>
          <Text style={styles.taskTitle}>{form.name}</Text>
          <Text style={styles.heroMeta}>
            {KIND_LABEL[taskKind]} · Students complete this in the browser
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Distribution</Text>
        <View style={styles.tabRow}>
          {TABS.map((t) => {
            const active = mainTab === t.key;
            return (
              <View key={t.key} style={styles.tabCell}>
                <Pressable
                  style={[styles.tabBtn, active ? styles.tabBtnOn : styles.tabBtnOff]}
                  onPress={() => setMainTab(t.key)}
                  android_ripple={{
                    color: active ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.06)',
                    foreground: true,
                  }}
                >
                  <Text style={[styles.tabBtnTxt, active ? styles.tabBtnTxtOn : null]} numberOfLines={1}>
                    {t.label}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.panel}>
          {mainTab === 'classes' && (
            <>
              <Text style={styles.panelIntro}>
                Add this task to each selected class’s gradebook. Students on the roster get a pending
                row in View grades. You can still share the link or QR code for them to complete the
                task online.
              </Text>
              <View style={styles.rowActions}>
                <Pressable style={styles.textLink} onPress={selectAllClasses} hitSlop={8}>
                  <Text style={styles.textLinkTxt}>Select all</Text>
                </Pressable>
                <Pressable style={styles.textLink} onPress={clearClassSelection} hitSlop={8}>
                  <Text style={styles.textLinkTxt}>Clear</Text>
                </Pressable>
              </View>

              {sortedClasses.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTxt}>
                    No classes yet. Create a class from My classes, then assign this task here.
                  </Text>
                </View>
              ) : (
                sortedClasses.map((c) => {
                  const on = selectedClassIds.has(c.id);
                  const roster = c.students ?? [];
                  const count = roster.length || c.studentCount;
                  return (
                    <Pressable
                      key={c.id}
                      style={[styles.classRow, on && styles.classRowOn]}
                      onPress={() => toggleClass(c.id)}
                      android_ripple={{ color: theme.rippleLight }}
                    >
                      <View style={[styles.checkOuter, on && styles.checkOuterOn]}>
                        {on ? <CheckIcon color={theme.white} /> : null}
                      </View>
                      <View style={styles.classMid}>
                        <Text style={styles.className} numberOfLines={2}>
                          {c.name}
                        </Text>
                        <Text style={styles.classSub}>
                          {count} {count === 1 ? 'student' : 'students'}
                          {roster.length === 0 && c.studentCount > 0
                            ? ' · add names in class details'
                            : ''}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}

              <Pressable
                style={[styles.assignBtn, (selectedClassIds.size === 0 || assigning) && styles.assignBtnDisabled]}
                onPress={handleAssignToClasses}
                disabled={selectedClassIds.size === 0 || assigning}
                android_ripple={{ color: theme.rippleLight }}
              >
                {assigning ? <ActivityIndicator color={theme.white} size="small" /> : null}
                <Text style={styles.assignBtnTxt}>
                  {assigning
                    ? 'Assigning…'
                    : selectedClassIds.size === 0
                      ? 'Select at least one class'
                      : `Assign to ${selectedClassIds.size} class${selectedClassIds.size === 1 ? '' : 'es'}`}
                </Text>
              </Pressable>
            </>
          )}

          {mainTab === 'link' && (
            <>
              <Text style={styles.panelIntro}>
                Copy the link or open it in a browser. Anyone with the link can access this task on
                the web.
              </Text>
              <Text style={styles.fieldLabel}>Task link</Text>
              <View style={styles.linkField}>
                <TextInput
                  style={styles.linkInput}
                  value={formLink}
                  editable={false}
                  selectTextOnFocus
                />
                <Pressable style={styles.copyCompact} onPress={copyToClipboard} hitSlop={8}>
                  <Text style={styles.copyCompactTxt}>Copy</Text>
                </Pressable>
              </View>
              <Text style={styles.helper}>The TeachTrack app is not required for students to respond.</Text>
              <Pressable style={styles.primaryOutlineBtn} onPress={openInBrowser} android_ripple={{ color: theme.rippleLight }}>
                <Text style={styles.primaryOutlineTxt}>Open in browser</Text>
              </Pressable>

              <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Share sheet</Text>
              <Pressable style={styles.shareRow} onPress={shareLink} android_ripple={{ color: theme.rippleLight }}>
                <ShareIcon width={22} height={22} stroke={ink.ink} />
                <Text style={styles.shareRowTxt}>Share via system menu…</Text>
              </Pressable>

              <Text style={styles.fieldLabel}>Quick channels</Text>
              <View style={styles.socialRow}>
                <Pressable
                  style={styles.socialBtn}
                  onPress={() => shareOnSocial('whatsapp')}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <View style={[styles.socialDot, { backgroundColor: '#25D366' }]}>
                    <SocialWhatsappIcon width={22} height={22} />
                  </View>
                  <Text style={styles.socialLbl}>WhatsApp</Text>
                </Pressable>
                <Pressable
                  style={styles.socialBtn}
                  onPress={() => shareOnSocial('email')}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <View style={[styles.socialDot, { backgroundColor: '#4285F4' }]}>
                    <SocialEmailIcon width={22} height={22} />
                  </View>
                  <Text style={styles.socialLbl}>Email</Text>
                </Pressable>
                <Pressable
                  style={styles.socialBtn}
                  onPress={() => shareOnSocial('sms')}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <View style={[styles.socialDot, { backgroundColor: '#34B7F1' }]}>
                    <SocialSmsIcon width={22} height={22} />
                  </View>
                  <Text style={styles.socialLbl}>SMS</Text>
                </Pressable>
              </View>
            </>
          )}

          {mainTab === 'qr' && (
            <>
              <Text style={styles.qrHint}>
                Display or print this code. Scanning opens the same web task as the link above.
              </Text>
              <View style={styles.qrFrame}>
                <View ref={viewShotRef} style={styles.qrCard}>
                  <QRCode value={formLink} size={qrSize} color="#000000" backgroundColor="#FFFFFF" />
                  <Text style={styles.qrTitle}>{form.name}</Text>
                  <Text style={styles.qrSub}>Scan to open task</Text>
                </View>
              </View>
              <Pressable style={styles.saveBtn} onPress={saveQRCode} android_ripple={{ color: theme.rippleLight }}>
                <Text style={styles.saveBtnTxt}>Save QR image</Text>
              </Pressable>
              <Pressable style={styles.qrFooterBtn} onPress={shareLink} android_ripple={{ color: theme.rippleLight }}>
                <ShareIcon width={18} height={18} stroke={ink.ink} />
                <Text style={styles.qrFooterTxt}>Share link instead</Text>
              </Pressable>
            </>
          )}
        </View>
        </PulseScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default ShareTaskScreen;
