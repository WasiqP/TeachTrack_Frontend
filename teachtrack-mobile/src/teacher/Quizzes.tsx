import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import BottomTab from '../components/BottomTab';
import { PulseScrollView } from '../components/PulseScrollView';
import TabScreenHeaderBar from '../components/TabScreenHeaderBar';
import { useForms } from '../context/FormsContext';
import { useGradesTasks } from '../context/GradesTasksContext';
import { usePulseAlert } from '../context/AlertModalContext';
import FormIcon from '../components/FormIcons';
import Svg, { Path } from 'react-native-svg';
import { useQuizzesStyles } from './useQuizzesStyles';
import ShareIcon from '../../assets/images/share.svg';
import EditIcon from '../../assets/images/edit.svg';
import TrashIcon from '../../assets/images/trash.svg';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  embedded?: boolean;
};

type AssessmentKind = 'quiz' | 'assignment' | 'test';

interface Quiz {
  id: string;
  title: string;
  type: AssessmentKind;
  classId: string;
  className: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  createdAt: string;
}

const Quizzes: React.FC<Props> = ({ navigation, embedded }) => {
  const { styles, ink, theme } = useQuizzesStyles();
  const KIND_META = useMemo<
    Record<AssessmentKind, { label: string; accent: string; soft: string }>
  >(
    () => ({
      quiz: { label: 'Quiz', accent: theme.primary, soft: theme.primarySoft },
      assignment: { label: 'Assignment', accent: '#0D9488', soft: 'rgba(13, 148, 136, 0.12)' },
      test: { label: 'Test', accent: '#D97706', soft: 'rgba(217, 119, 6, 0.12)' },
    }),
    [theme],
  );
  const SearchIcon = ({ size = 20, color = ink.inkSoft }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M21 21L16.65 16.65" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
  const ChevronRightIcon = ({ size = 20, color = ink.inkSoft }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m9 18 6-6-6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
  const ClipboardIcon = ({ size = 22, color = theme.primary }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
  const QuizIcon = ({ size = 24, color = ink.inkSoft }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 11L12 14L22 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const { forms, deleteForm } = useForms();
  const { removeTasksForForm } = useGradesTasks();
  const { showAlert, showSuccess, showError } = usePulseAlert();

  const confirmDeleteForm = useCallback(
    (formId: string, title: string) => {
      showAlert({
        title: 'Delete this task?',
        message:
          'This permanently removes the task and any linked entries in class gradebooks (from Share task). This cannot be undone.',
        variant: 'warning',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await deleteForm(formId);
                  await removeTasksForForm(formId);
                  showSuccess('Task deleted', `"${title}" has been removed.`);
                } catch {
                  showError('Could not delete', 'Please try again.');
                }
              })();
            },
          },
        ],
      });
    },
    [deleteForm, removeTasksForForm, showAlert, showError, showSuccess],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | AssessmentKind>('all');

  const quizzes: Quiz[] = useMemo(
    () =>
      forms.map((form) => ({
        id: form.id,
        title: form.name,
        type: 'quiz' as const,
        classId: '1',
        className: 'All classes',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        submissions: 0,
        totalStudents: 28,
        createdAt: form.createdAt,
      })),
    [forms],
  );

  const mockQuizzes: Quiz[] = useMemo(
    () =>
      forms.length === 0
        ? [
            {
              id: 'demo-1',
              title: 'Algebra Quiz — Chapter 5',
              type: 'quiz',
              classId: '1',
              className: 'Mathematics 101',
              dueDate: '2026-03-15',
              submissions: 24,
              totalStudents: 28,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'demo-2',
              title: 'Essay: Shakespeare analysis',
              type: 'assignment',
              classId: '2',
              className: 'English Literature',
              dueDate: '2026-03-22',
              submissions: 18,
              totalStudents: 24,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'demo-3',
              title: 'Midterm exam — Biology',
              type: 'test',
              classId: '3',
              className: 'Biology 201',
              dueDate: '2026-04-02',
              submissions: 0,
              totalStudents: 30,
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
    [forms.length],
  );

  const allQuizzes = useMemo(() => [...quizzes, ...mockQuizzes], [quizzes, mockQuizzes]);

  const filteredQuizzes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allQuizzes.filter((quiz) => {
      const matchesSearch =
        !q ||
        quiz.title.toLowerCase().includes(q) ||
        quiz.className.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || quiz.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [allQuizzes, searchQuery, filter]);

  const counts = useMemo(() => {
    let quiz = 0;
    let assignment = 0;
    let test = 0;
    allQuizzes.forEach((x) => {
      if (x.type === 'quiz') quiz++;
      else if (x.type === 'assignment') assignment++;
      else test++;
    });
    return { total: allQuizzes.length, quiz, assignment, test };
  }, [allQuizzes]);

  const filterChips: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'quiz', label: 'Quizzes' },
    { key: 'assignment', label: 'Assignments' },
    { key: 'test', label: 'Tests' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TabScreenHeaderBar navigation={navigation} paddingHorizontal={20}>
        <View>
          <Text style={styles.title}>My Tasks</Text>
          <Text style={styles.subtitle}>
            Create and manage quizzes, assignments, and tests — open a task to edit or share.
          </Text>
        </View>
      </TabScreenHeaderBar>

      <PulseScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBand}>
          <View style={styles.statsCard}>
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{counts.total}</Text>
              <Text style={styles.statLab}>Total</Text>
            </View>
            <View style={styles.statRule} />
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{counts.quiz}</Text>
              <Text style={styles.statLab}>Quizzes</Text>
            </View>
            <View style={styles.statRule} />
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{counts.assignment}</Text>
              <Text style={styles.statLab}>Tasks</Text>
            </View>
            <View style={styles.statRule} />
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{counts.test}</Text>
              <Text style={styles.statLab}>Tests</Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <SearchIcon size={20} color={ink.inkSoft} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title or class…"
              placeholderTextColor={ink.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {filterChips.map((c) => {
              const on = filter === c.key;
              return (
                <Pressable
                  key={c.key}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => setFilter(c.key)}
                  android_ripple={{ color: 'rgba(160,96,255,0.12)' }}
                >
                  <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [styles.createCard, pressed && styles.createCardPressed]}
            onPress={() => navigation.navigate('CreateForm')}
            android_ripple={{ color: 'rgba(160,96,255,0.14)' }}
          >
            <View style={styles.createIconWrap}>
              <ClipboardIcon size={26} color={theme.white} />
            </View>
            <View style={styles.createCopy}>
              <Text style={styles.createTitle}>New task</Text>
              <Text style={styles.createSub}>
                One screen to set up a task, then add and edit questions.
              </Text>
            </View>
            <ChevronRightIcon size={22} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>
          {filter === 'all' ? 'Your tasks' : `${filterChips.find((x) => x.key === filter)?.label}`}
          {searchQuery.trim() ? ` · ${filteredQuizzes.length} match` : ''}
        </Text>

        {filteredQuizzes.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWell}>
              <QuizIcon size={40} color={theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? 'No matches' : 'Nothing here yet'}
            </Text>
            <Text style={styles.emptyBody}>
              {searchQuery.trim()
                ? 'Try another search or clear filters.'
                : 'Create a task to see it listed here. Sample items appear when you have no saved forms.'}
            </Text>
            {!searchQuery.trim() ? (
              <Pressable
                style={styles.emptyCta}
                onPress={() => navigation.navigate('CreateForm')}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <Text style={styles.emptyCtaTxt}>Create task</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.listBlock}>
            {filteredQuizzes.map((quiz, index) => {
              const form = forms.find((f) => f.id === quiz.id);
              const meta = KIND_META[quiz.type];
              const pct =
                quiz.totalStudents > 0
                  ? Math.round((quiz.submissions / quiz.totalStudents) * 100)
                  : 0;
              const openDetail = () => {
                if (form) {
                  navigation.navigate('EditForm', { formId: quiz.id });
                } else {
                  navigation.navigate('CreateForm');
                }
              };
              return (
                <Pressable
                  key={quiz.id}
                  style={({ pressed }) => [
                    styles.itemCard,
                    index < filteredQuizzes.length - 1 && styles.itemCardMargin,
                    pressed && styles.itemCardPressed,
                  ]}
                  onPress={openDetail}
                  android_ripple={{ color: ink.pressTint }}
                >
                  <View style={styles.itemIconColumn}>
                    <View style={[styles.itemIconWell, { backgroundColor: meta.soft }]}>
                      {form ? (
                        <FormIcon iconId={form.iconId} size={26} color={meta.accent} />
                      ) : (
                        <QuizIcon size={26} color={meta.accent} />
                      )}
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.iconBtn,
                        form ? styles.iconBtnDanger : styles.iconBtnDisabled,
                        pressed && form && styles.iconBtnPressed,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (form) confirmDeleteForm(form.id, form.name);
                      }}
                      disabled={!form}
                      hitSlop={8}
                      accessibilityLabel="Delete task"
                    >
                      <TrashIcon
                        width={18}
                        height={18}
                        stroke={form ? '#DC2626' : ink.inkSoft}
                      />
                    </Pressable>
                  </View>
                  <View style={styles.itemMain}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle} numberOfLines={2}>
                        {quiz.title}
                      </Text>
                      <View style={[styles.kindPill, { backgroundColor: meta.soft }]}>
                        <Text style={[styles.kindPillTxt, { color: meta.accent }]}>{meta.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemClass} numberOfLines={1}>
                      {quiz.className}
                    </Text>
                    <View style={styles.itemMetaRow}>
                      <Text style={styles.itemMeta}>
                        Due {new Date(quiz.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </Text>
                      <Text style={styles.itemMetaDot}>·</Text>
                      <Text style={styles.itemMeta}>
                        {quiz.submissions}/{quiz.totalStudents} turned in
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${pct}%`, backgroundColor: meta.accent },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressLab}>{pct}% submission rate</Text>
                  </View>
                  <View style={styles.itemSide}>
                    <View style={styles.sideActionsRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.iconBtn,
                          !form && styles.iconBtnDisabled,
                          pressed && form && styles.iconBtnPressed,
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (form) navigation.navigate('EditForm', { formId: quiz.id });
                          else navigation.navigate('CreateForm');
                        }}
                        hitSlop={8}
                        accessibilityLabel="Edit"
                      >
                        <EditIcon width={18} height={18} stroke={form ? ink.ink : ink.inkSoft} />
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.iconBtn,
                          !form && styles.iconBtnDisabled,
                          pressed && form && styles.iconBtnPressed,
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (form) navigation.navigate('ShareTask', { formId: quiz.id });
                        }}
                        disabled={!form}
                        hitSlop={8}
                        accessibilityLabel="Share"
                      >
                        <ShareIcon width={18} height={18} stroke={form ? ink.ink : ink.inkSoft} />
                      </Pressable>
                    </View>
                    <View style={styles.itemSideChevron}>
                      <ChevronRightIcon size={24} color={ink.inkSoft} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.bottomPad} />
      </PulseScrollView>

      {!embedded && <BottomTab navigation={navigation} currentRoute="Quizzes" />}
    </SafeAreaView>
  );
};

export default Quizzes;
