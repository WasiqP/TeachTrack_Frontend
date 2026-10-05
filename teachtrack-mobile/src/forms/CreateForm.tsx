import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, radius, useThemeMode } from '../theme';
import BackButton from '../components/Reusable-Components/BackButton';
import FormIcon from '../components/FormIcons';
import { useForms, type FormData } from '../context/FormsContext';
import { useClasses } from '../context/ClassesContext';
import { usePulseAlert } from '../context/AlertModalContext';
import type { QuestionData, QuestionType } from './QuestionsScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateForm'>;

type CreateTaskKind = 'quiz' | 'assignment' | 'test' | 'survey' | 'poll';

const TASK_TYPES: { id: CreateTaskKind; label: string }[] = [
  { id: 'quiz', label: 'Quiz' },
  { id: 'assignment', label: 'Assignment' },
  { id: 'test', label: 'Test' },
  { id: 'survey', label: 'Survey' },
  { id: 'poll', label: 'Poll' },
];

const DUE_OPTIONS: { id: string; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'This week' },
  { id: 'two_weeks', label: '2 wks' },
  { id: 'month', label: 'Month' },
  { id: 'custom', label: 'Later' },
];

const FORMAT_OPTIONS: { id: string; label: string }[] = [
  { id: 'multiple_choice', label: 'Multi choice' },
  { id: 'true_false', label: 'T/F' },
  { id: 'short_answer', label: 'Short' },
  { id: 'essay', label: 'Essay' },
  { id: 'matching', label: 'Match' },
  { id: 'all', label: 'Mix' },
];

const ICON_IDS = ['clipboard', 'star', 'message', 'chart', 'target', 'trophy'] as const;

const CreateForm: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { ink, theme } = useThemeMode();
  const { addForm } = useForms();
  const { classes } = useClasses();
  const { showAlert } = usePulseAlert();

  const [taskKind, setTaskKind] = useState<CreateTaskKind>('quiz');
  const [classId, setClassId] = useState<string | 'all'>(
    classes.length > 0 ? classes[0].id : 'all',
  );
  const [title, setTitle] = useState('');
  const [focusTopic, setFocusTopic] = useState('');
  const [duePreset, setDuePreset] = useState<string>('week');
  const [formatIds, setFormatIds] = useState<string[]>(['multiple_choice']);
  const [iconId, setIconId] = useState<string>('clipboard');
  const [classModalOpen, setClassModalOpen] = useState(false);

  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  );

  const selectedClassName = useMemo(() => {
    if (classId === 'all') return 'All classes';
    const c = classes.find((x) => x.id === classId);
    return c?.name ?? 'Select a class';
  }, [classId, classes]);

  const toggleFormat = useCallback((id: string) => {
    setFormatIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const starterQuestion = useMemo<QuestionData>(
    () => ({
      id: '1',
      title: 'Question 1',
      type: 'shortText' as QuestionType,
      required: false,
    }),
    [],
  );

  const handleCreate = useCallback(async () => {
    if (classes.length === 0) {
      showAlert({
        title: 'Add a class first',
        message: 'Create a class from Home or My classes, then you can attach this task.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }
    const name = title.trim();
    if (!name) {
      showAlert({
        title: 'Name required',
        message: 'Give this task a title so you can find it later.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    const id = `${Date.now()}`;
    const cls = classId === 'all' ? null : classes.find((c) => c.id === classId);

    const formData: FormData = {
      id,
      name,
      iconId,
      createdAt: new Date().toISOString(),
      answers: {
        taskKind,
        assessmentType: taskKind,
        classId: classId === 'all' ? 'all' : classId,
        className: cls?.name ?? 'All classes',
        focusTopic: focusTopic.trim() || undefined,
        duePreset,
        questionFormats: formatIds,
        questions: [starterQuestion],
      },
    };

    await addForm(formData);
    navigation.replace('EditForm', { formId: id });
  }, [
    classes,
    classId,
    title,
    iconId,
    taskKind,
    focusTopic,
    duePreset,
    formatIds,
    starterQuestion,
    addForm,
    navigation,
    showAlert,
  ]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        keyboardView: {
          flex: 1,
        },
        scrollContent: {
          paddingTop: 14,
          flexGrow: 1,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 4,
          marginBottom: 12,
        },
        headerBack: {
          marginTop: Platform.OS === 'ios' ? 2 : 0,
        },
        headerTextCol: {
          flex: 1,
          minWidth: 0,
          justifyContent: 'center',
          paddingTop: Platform.OS === 'ios' ? 6 : 4,
        },
        heroTitle: {
          fontSize: 22,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.45,
          marginBottom: 3,
          lineHeight: 26,
        },
        heroSub: {
          fontSize: 13,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          lineHeight: 18,
        },
        sectionLabel: {
          fontSize: 11,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          letterSpacing: 0.7,
          textTransform: 'uppercase',
          marginBottom: 8,
          marginTop: 12,
        },
        sectionLabelFirst: {
          marginTop: 0,
        },
        hScroll: {
          marginHorizontal: -4,
        },
        hScrollInner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 2,
          paddingRight: 12,
        },
        typeChip: {
          paddingVertical: 8,
          paddingHorizontal: 13,
          borderRadius: 18,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: theme.card,
        },
        typeChipOn: {
          borderColor: theme.primary,
          backgroundColor: theme.primarySoft,
        },
        typeChipLabel: {
          fontSize: 13,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        field: {
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          paddingHorizontal: 12,
          paddingVertical: Platform.OS === 'ios' ? 11 : 9,
          fontSize: 15,
          fontFamily: F.dmRegular,
          color: ink.ink,
          backgroundColor: theme.card,
        },
        fieldMulti: {
          minHeight: 56,
          maxHeight: 72,
          textAlignVertical: 'top',
        },
        classTrigger: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: theme.card,
        },
        classTriggerText: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: ink.ink,
          flex: 1,
        },
        iconBtn: {
          width: 46,
          height: 46,
          borderRadius: 11,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.card,
        },
        iconBtnOn: {
          borderColor: theme.primary,
          backgroundColor: theme.primarySoft,
        },
        dueChip: {
          paddingVertical: 7,
          paddingHorizontal: 12,
          borderRadius: 18,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: theme.card,
        },
        dueChipOn: {
          borderColor: theme.primary,
          backgroundColor: theme.primarySoft,
        },
        dueChipTxt: {
          fontSize: 12,
          fontFamily: F.dmMedium,
          color: ink.ink,
        },
        formatChip: {
          paddingVertical: 7,
          paddingHorizontal: 10,
          borderRadius: 14,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: theme.card,
        },
        formatChipOn: {
          borderColor: theme.primary,
          backgroundColor: theme.primarySoft,
        },
        formatChipTxt: {
          fontSize: 11,
          fontFamily: F.dmMedium,
          color: ink.inkSoft,
        },
        formatChipTxtOn: {
          color: theme.primary,
        },
        cta: {
          marginTop: 22,
          backgroundColor: theme.primary,
          borderRadius: radius.input,
          paddingVertical: 14,
          alignItems: 'center',
        },
        ctaText: {
          fontSize: 15,
          fontFamily: F.outfitBold,
          color: theme.white,
          letterSpacing: 0.15,
        },
        hintBelowCta: {
          marginTop: 10,
          fontSize: 12,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          textAlign: 'center',
          lineHeight: 17,
        },
        modalRoot: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'transparent',
        },
        modalSheet: {
          backgroundColor: ink.canvas,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 16,
          paddingTop: 12,
          maxHeight: '72%',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderBottomWidth: 0,
        },
        modalTitle: {
          fontSize: 18,
          fontFamily: F.outfitBold,
          color: ink.ink,
          marginBottom: 12,
          textAlign: 'center',
        },
        modalRow: {
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.rowDivider,
        },
        modalRowOn: {
          backgroundColor: theme.primarySoft,
          marginHorizontal: -8,
          paddingHorizontal: 8,
          borderRadius: 10,
          borderBottomWidth: 0,
        },
        modalRowText: {
          fontSize: 16,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        modalClose: {
          marginTop: 8,
          paddingVertical: 14,
          alignItems: 'center',
        },
        modalCloseTxt: {
          fontSize: 16,
          fontFamily: F.dmSemi,
          color: theme.primary,
        },
      }),
    [ink, theme],
  );

  const scrollContentPadded = useMemo(
    () => [
      styles.scrollContent,
      {
        paddingLeft: 20 + insets.left,
        paddingRight: 20 + insets.right,
        paddingBottom: Math.max(insets.bottom, 16) + 32,
      },
    ],
    [styles.scrollContent, insets.left, insets.right, insets.bottom],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={scrollContentPadded}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerBack}>
              <BackButton onPress={() => navigation.goBack()} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.heroTitle}>New task</Text>
              <Text style={styles.heroSub}>
                Pick type and class, name it, then edit questions on the next screen.
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>Task type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hScroll}
            contentContainerStyle={styles.hScrollInner}
          >
            {TASK_TYPES.map((t) => {
              const on = taskKind === t.id;
              return (
                <Pressable
                  key={t.id}
                  style={[styles.typeChip, on && styles.typeChipOn]}
                  onPress={() => setTaskKind(t.id)}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <Text style={styles.typeChipLabel}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionLabel}>Class</Text>
          <Pressable
            style={styles.classTrigger}
            onPress={() => classes.length > 0 && setClassModalOpen(true)}
            disabled={classes.length === 0}
            android_ripple={{ color: theme.rippleLight }}
          >
            <Text style={styles.classTriggerText} numberOfLines={2}>
              {classes.length === 0 ? 'Create a class first' : selectedClassName}
            </Text>
            <Text style={{ fontSize: 17, color: ink.inkSoft }}>›</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>Title</Text>
          <TextInput
            style={styles.field}
            placeholder="e.g. Chapter 5 quiz"
            placeholderTextColor={ink.placeholder}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.sectionLabel}>Topic (optional)</Text>
          <TextInput
            style={[styles.field, styles.fieldMulti]}
            placeholder="What should this cover?"
            placeholderTextColor={ink.placeholder}
            value={focusTopic}
            onChangeText={setFocusTopic}
            multiline
          />

          <Text style={styles.sectionLabel}>Due</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hScroll}
            contentContainerStyle={styles.hScrollInner}
          >
            {DUE_OPTIONS.map((d) => {
              const on = duePreset === d.id;
              return (
                <Pressable
                  key={d.id}
                  style={[styles.dueChip, on && styles.dueChipOn]}
                  onPress={() => setDuePreset(d.id)}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <Text style={styles.dueChipTxt}>{d.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionLabel}>Question styles (optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hScroll}
            contentContainerStyle={styles.hScrollInner}
          >
            {FORMAT_OPTIONS.map((f) => {
              const on = formatIds.includes(f.id);
              return (
                <Pressable
                  key={f.id}
                  style={[styles.formatChip, on && styles.formatChipOn]}
                  onPress={() => toggleFormat(f.id)}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <Text style={[styles.formatChipTxt, on && styles.formatChipTxtOn]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionLabel}>Icon</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hScroll}
            contentContainerStyle={styles.hScrollInner}
          >
            {ICON_IDS.map((id) => {
              const on = iconId === id;
              return (
                <Pressable
                  key={id}
                  style={[styles.iconBtn, on && styles.iconBtnOn]}
                  onPress={() => setIconId(id)}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <FormIcon iconId={id} size={22} color={on ? theme.primary : ink.inkSoft} />
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable style={styles.cta} onPress={handleCreate} android_ripple={{ color: theme.rippleLight }}>
            <Text style={styles.ctaText}>Create task &amp; edit questions</Text>
          </Pressable>
          <Text style={styles.hintBelowCta}>
            Saves your task and opens the question editor. Add, reorder, or delete questions there.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={classModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setClassModalOpen(false)}
      >
        <Pressable style={styles.modalRoot} onPress={() => setClassModalOpen(false)}>
          <Pressable
            style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) + 20 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Assign to class</Text>
            <FlatList
              data={[
                { id: 'all' as const, name: 'All classes' },
                ...sortedClasses.map((c) => ({ id: c.id, name: c.name })),
              ]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const on = classId === item.id;
                return (
                  <Pressable
                    style={[styles.modalRow, on && styles.modalRowOn]}
                    onPress={() => {
                      setClassId(item.id);
                      setClassModalOpen(false);
                    }}
                  >
                    <Text style={styles.modalRowText}>{item.name}</Text>
                  </Pressable>
                );
              }}
            />
            <Pressable style={styles.modalClose} onPress={() => setClassModalOpen(false)}>
              <Text style={styles.modalCloseTxt}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default CreateForm;
