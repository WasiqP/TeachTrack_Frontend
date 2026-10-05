import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, radius, useThemeMode } from '../theme';
import { useForms } from '../context/FormsContext';
import ShareIcon from '../../assets/images/share.svg';
import EditPurpleIcon from '../../assets/images/edit-purple.svg';
import SwapIcon from '../../assets/images/swap.svg';
import BackButton from '../components/Reusable-Components/BackButton';
import FormIcon from '../components/FormIcons';
import type { QuestionData, QuestionType } from './QuestionsScreen';
import { questionTypeSummary } from './questionTypeSummary';

type Props = NativeStackScreenProps<RootStackParamList, 'EditForm'>;

const TASK_KIND_LABEL: Record<string, string> = {
  quiz: 'Quiz',
  assignment: 'Assignment',
  test: 'Test',
  survey: 'Survey',
  poll: 'Poll',
};

const ChevronRightIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EditForm: React.FC<Props> = ({ route, navigation }) => {
  const { formId } = route.params;
  const { forms, updateForm } = useForms();
  const form = useMemo(() => forms.find((f) => f.id === formId), [forms, formId]);
  const { ink, theme } = useThemeMode();
  const insets = useSafeAreaInsets();

  const [questions, setQuestions] = useState<QuestionData[]>([]);

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

  const taskKindRaw = form?.answers?.taskKind ?? form?.answers?.assessmentType;
  const taskKindLabel =
    typeof taskKindRaw === 'string' ? TASK_KIND_LABEL[taskKindRaw] ?? taskKindRaw : null;

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
          marginBottom: 20,
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
        shareChip: {
          width: 44,
          height: 44,
          borderRadius: 14,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        },
        summaryCard: {
          borderRadius: radius.card,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: theme.card,
          padding: 18,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        },
        summaryIconWell: {
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        summaryBody: {
          flex: 1,
          minWidth: 0,
        },
        summaryName: {
          fontSize: 17,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.2,
          marginBottom: 8,
        },
        statRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        statPill: {
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 20,
          backgroundColor: ink.pressTint,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        statPillText: {
          fontSize: 12,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
        },
        statPillAccent: {
          backgroundColor: theme.primarySoft,
          borderColor: theme.primary,
        },
        statPillAccentText: {
          color: theme.primary,
        },
        hintCard: {
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: radius.input,
          backgroundColor: ink.pressTint,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          marginBottom: 18,
        },
        hintText: {
          fontSize: 13,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          lineHeight: 19,
        },
        actionsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 18,
        },
        primaryBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: radius.btn,
          backgroundColor: theme.primary,
        },
        primaryBtnText: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: theme.white,
        },
        reorderBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: theme.card,
        },
        reorderBtnText: {
          fontSize: 14,
          fontFamily: F.dmSemi,
          color: ink.ink,
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
          marginBottom: 8,
        },
        emptyBody: {
          fontSize: 15,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          textAlign: 'center',
          marginBottom: 20,
        },
      }),
    [ink, theme, insets.bottom],
  );

  const QuestionRow: React.FC<{ q: QuestionData; index: number }> = ({ q, index }) => (
    <Pressable
      onPress={() => navigation.navigate('QuestionsScreen', { formId, questionId: q.id })}
      style={({ pressed }) => [pressed && { opacity: 0.92 }]}
      android_ripple={{ color: theme.rippleLight }}
    >
      <View style={styles.questionItem}>
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
          <ChevronRightIcon color={ink.iconMuted} size={20} />
        </View>
      </View>
    </Pressable>
  );

  if (!form) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Task not found</Text>
          <Text style={styles.emptyBody}>It may have been removed. Go back and open it from My tasks.</Text>
          <BackButton onPress={() => navigation.goBack()} stroke={ink.ink} rippleColor={theme.rippleLight} />
        </View>
      </SafeAreaView>
    );
  }

  const addQuestion = () => {
    setQuestions((prev) => {
      const maxId = prev.reduce((max, q) => {
        const n = parseInt(q.id, 10);
        return Number.isFinite(n) ? Math.max(max, n) : max;
      }, 0);
      const nextId = (maxId + 1).toString();
      const next = [
        ...prev,
        {
          id: nextId,
          title: `Question ${nextId}`,
          type: 'shortText' as QuestionType,
          required: false,
        },
      ];
      updateForm(formId, {
        answers: {
          ...form.answers,
          questions: next,
        },
      });
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <BackButton onPress={() => navigation.goBack()} stroke={ink.ink} rippleColor={theme.rippleLight} />
          <View style={styles.headerTextCol}>
            <Text style={styles.heroTitle}>Edit task</Text>
            <Text style={styles.heroSub}>
              Tune questions, types, and options. Changes save as you edit each question.
            </Text>
          </View>
          <Pressable
            style={styles.shareChip}
            onPress={() => navigation.navigate('ShareTask', { formId })}
            android_ripple={{ color: theme.rippleLight, borderless: true }}
            accessibilityLabel="Share task"
          >
            <ShareIcon width={22} height={22} stroke={theme.primary} />
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWell}>
            <FormIcon iconId={form.iconId ?? 'clipboard'} size={26} color={theme.primary} />
          </View>
          <View style={styles.summaryBody}>
            <Text style={styles.summaryName} numberOfLines={2}>
              {form.name}
            </Text>
            <View style={styles.statRow}>
              <View style={[styles.statPill, styles.statPillAccent]}>
                <Text style={[styles.statPillText, styles.statPillAccentText]}>
                  {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                </Text>
              </View>
              {taskKindLabel ? (
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>{taskKindLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <ChevronRightIcon color={ink.iconMuted} size={22} />
        </View>

        <View style={styles.hintCard}>
          <Text style={styles.hintText}>
            Tap a question to edit wording, type, and options. Use Reorder to drag questions into
            place or remove them — that screen is built for sorting.
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.primaryBtn}
            onPress={addQuestion}
            android_ripple={{ color: theme.rippleMedium }}
          >
            <Text style={styles.primaryBtnText}>Add question</Text>
          </Pressable>
          <Pressable
            style={styles.reorderBtn}
            onPress={() => navigation.navigate('SwapQuestions', { formId })}
            android_ripple={{ color: theme.rippleLight }}
            accessibilityLabel="Reorder questions"
          >
            <SwapIcon width={22} height={22} stroke={theme.primary} />
            <Text style={styles.reorderBtnText}>Reorder</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Questions</Text>
        {questions.map((q, i) => (
          <QuestionRow key={q.id} q={q} index={i} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditForm;
