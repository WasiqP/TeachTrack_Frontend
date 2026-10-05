import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import BottomTab from '../components/BottomTab';
import { PulseScrollView } from '../components/PulseScrollView';
import TabScreenHeaderBar from '../components/TabScreenHeaderBar';
import { useClasses, type ClassData, type ClassStudentRecord } from '../context/ClassesContext';
import {
  useGradesTasks,
  type ClassTask,
  type TaskKind,
  type TaskGradeRecord,
} from '../context/GradesTasksContext';
import { fonts as F } from '../theme';
import Svg, { Path } from 'react-native-svg';
import { useViewGradesStyles } from './useViewGradesStyles';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  embedded?: boolean;
  /** When embedded in TeacherTabShell, true while the View Grades tab is visible (drives filter panel reset). */
  active?: boolean;
};

const KIND_LABEL: Record<TaskKind, string> = {
  quiz: 'Quiz',
  assignment: 'Assignment',
  project: 'Project',
  test: 'Test',
};

const KIND_ORDER: TaskKind[] = ['quiz', 'assignment', 'test', 'project'];

type StatusFilter = 'all' | TaskGradeRecord['status'];

const SearchIcon = ({ size = 20, color = '#1A1A22' }: { size?: number; color?: string }) => (
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

const ChevronDownIcon = ({ size = 18, color = '#050508' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronUpIcon = ({ size = 18, color = '#050508' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 15L12 9L18 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CloseIcon = ({ size = 20, color = '#1A1A22' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRightIcon = ({ size = 18, color = '#A060FF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BookIcon = ({ size = 18, color = '#A060FF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

function statusLabel(s: TaskGradeRecord['status']): string {
  switch (s) {
    case 'graded':
      return 'Graded';
    case 'pending':
      return 'Pending';
    case 'missing':
      return 'Missing';
    default:
      return '—';
  }
}

function gradeColor(status: TaskGradeRecord['status'], primary: string): string {
  switch (status) {
    case 'missing':
      return '#DC2626';
    case 'pending':
      return '#D97706';
    default:
      return primary;
  }
}

const ViewGrades: React.FC<Props> = ({ navigation, embedded, active }) => {
  const { styles, ink, theme } = useViewGradesStyles();
  const { classes } = useClasses();
  const { tasks, isLoading, getGrade } = useGradesTasks();

  const [classFilter, setClassFilter] = useState<string | 'all'>('all');
  const [taskFilter, setTaskFilter] = useState<string | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<'all' | TaskKind>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [taskPickerVisible, setTaskPickerVisible] = useState(false);
  const [taskModalSearch, setTaskModalSearch] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  /** Embedded tabs stay mounted; stack focus does not change on tab switch — use `active` from TeacherTabShell. */
  useEffect(() => {
    if (embedded && active) {
      setFiltersExpanded(false);
    }
  }, [embedded, active]);

  /** Standalone route: collapse filters each time this screen is focused. */
  useFocusEffect(
    useCallback(() => {
      if (!embedded) {
        setFiltersExpanded(false);
      }
    }, [embedded]),
  );

  const classById = useMemo(() => {
    const m = new Map<string, ClassData>();
    classes.forEach((c) => m.set(c.id, c));
    return m;
  }, [classes]);

  const validClassIds = useMemo(() => new Set(classes.map((c) => c.id)), [classes]);

  useEffect(() => {
    setTaskFilter('all');
  }, [classFilter]);

  const hasActiveFilters =
    classFilter !== 'all' ||
    taskFilter !== 'all' ||
    kindFilter !== 'all' ||
    statusFilter !== 'all' ||
    studentSearch.trim().length > 0;

  const resetFilters = useCallback(() => {
    setClassFilter('all');
    setTaskFilter('all');
    setKindFilter('all');
    setStatusFilter('all');
    setStudentSearch('');
  }, []);

  const tasksForClassDropdown = useMemo(() => {
    let list = tasks.filter((t) => validClassIds.has(t.classId));
    if (classFilter !== 'all') {
      list = list.filter((t) => t.classId === classFilter);
    }
    if (kindFilter !== 'all') {
      list = list.filter((t) => t.kind === kindFilter);
    }
    return list.sort((a, b) => {
      const na = classById.get(a.classId)?.name ?? '';
      const nb = classById.get(b.classId)?.name ?? '';
      if (na !== nb) return na.localeCompare(nb);
      return a.title.localeCompare(b.title);
    });
  }, [tasks, validClassIds, classFilter, kindFilter, classById]);

  const visibleTasks = useMemo(() => {
    let list = tasks.filter((t) => validClassIds.has(t.classId));
    if (classFilter !== 'all') list = list.filter((t) => t.classId === classFilter);
    if (kindFilter !== 'all') list = list.filter((t) => t.kind === kindFilter);
    if (taskFilter !== 'all') list = list.filter((t) => t.id === taskFilter);
    return list.sort((a, b) => {
      const na = classById.get(a.classId)?.name ?? '';
      const nb = classById.get(b.classId)?.name ?? '';
      if (na !== nb) return na.localeCompare(nb);
      return a.title.localeCompare(b.title);
    });
  }, [tasks, validClassIds, classFilter, kindFilter, taskFilter, classById]);

  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  );

  const tasksForModal = useMemo(() => {
    const q = taskModalSearch.trim().toLowerCase();
    let list = tasksForClassDropdown;
    if (q) {
      list = list.filter((t) => {
        const cn = (classById.get(t.classId)?.name ?? '').toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          cn.includes(q) ||
          KIND_LABEL[t.kind].toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [tasksForClassDropdown, taskModalSearch, classById]);

  const selectedTaskLabel = useMemo(() => {
    if (taskFilter === 'all') return 'All tasks';
    const t = tasks.find((x) => x.id === taskFilter);
    if (!t) return 'All tasks';
    const cn = classById.get(t.classId)?.name ?? 'Class';
    return classFilter === 'all' ? `${cn}: ${t.title}` : t.title;
  }, [taskFilter, tasks, classById, classFilter]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : (
          <>
            <PulseScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <TabScreenHeaderBar navigation={navigation} paddingHorizontal={0}>
                <View>
                  <Text style={styles.title}>View Grades</Text>
                  <Text style={styles.subtitle}>
                    Filter by class and task to see each assignment or quiz. Grades are stored per
                    student and task.
                  </Text>
                </View>
              </TabScreenHeaderBar>

              <View style={styles.filterPanel}>
              <View style={styles.searchRow}>
                <View style={styles.searchRowIconWrap}>
                  <SearchIcon size={20} color={ink.inkSoft} />
                </View>
                <TextInput
                  style={styles.searchInputInner}
                  placeholder="Search students by name or email…"
                  placeholderTextColor={ink.placeholder}
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                />
                {studentSearch.length > 0 ? (
                  <View style={styles.searchRowIconWrap}>
                    <Pressable
                      hitSlop={12}
                      onPress={() => setStudentSearch('')}
                      style={styles.searchClear}
                      accessibilityLabel="Clear search"
                    >
                      <CloseIcon size={18} color={ink.inkSoft} />
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View style={styles.filterPanelHeader}>
                <Pressable
                  style={styles.filtersHeaderLead}
                  onPress={() => setFiltersExpanded((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={filtersExpanded ? 'Collapse filters' : 'Expand filters'}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <Text style={styles.filterPanelTitle}>Filters</Text>
                  {filtersExpanded ? (
                    <ChevronUpIcon size={20} color={ink.inkSoft} />
                  ) : (
                    <ChevronDownIcon size={20} color={ink.inkSoft} />
                  )}
                </Pressable>
                <View style={styles.filterHeaderActions}>
                  <Pressable
                    onPress={resetFilters}
                    disabled={!hasActiveFilters}
                    style={({ pressed }) => [
                      styles.resetBtn,
                      !hasActiveFilters && styles.resetBtnDisabled,
                      pressed && hasActiveFilters && styles.resetBtnPressed,
                    ]}
                  >
                    <Text style={[styles.resetBtnTxt, !hasActiveFilters && styles.resetBtnTxtDisabled]}>
                      Reset all
                    </Text>
                  </Pressable>
                  {filtersExpanded ? (
                    <Pressable
                      style={({ pressed }) => [styles.collapseFiltersBtn, pressed && styles.resetBtnPressed]}
                      onPress={() => setFiltersExpanded(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Close filter section"
                      android_ripple={{ color: theme.rippleLight }}
                    >
                      <Text style={styles.collapseFiltersBtnTxt}>Hide</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {!filtersExpanded ? (
                <Pressable
                  style={styles.filterCollapsedHint}
                  onPress={() => setFiltersExpanded(true)}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <Text style={styles.filterCollapsedHintLabel} numberOfLines={1}>
                    Task
                  </Text>
                  <Text style={styles.filterCollapsedHintValue} numberOfLines={2}>
                    {selectedTaskLabel}
                    {hasActiveFilters ? ' · filters active' : ''}
                  </Text>
                  <Text style={styles.filterCollapsedTap}>Tap to expand filters</Text>
                </Pressable>
              ) : null}

              {filtersExpanded ? (
                <>
                  <Text style={styles.filterLabel}>Class</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsRow}
                  >
                    <FilterChip
                      label="All classes"
                      selected={classFilter === 'all'}
                      onPress={() => setClassFilter('all')}
                    />
                    {sortedClasses.map((c) => (
                      <FilterChip
                        key={c.id}
                        label={c.name}
                        selected={classFilter === c.id}
                        onPress={() => setClassFilter(c.id)}
                      />
                    ))}
                  </ScrollView>

                  <Text style={styles.filterLabel}>Assignment type</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsRow}
                  >
                    <FilterChip
                      label="All types"
                      selected={kindFilter === 'all'}
                      onPress={() => setKindFilter('all')}
                    />
                    {KIND_ORDER.map((k) => (
                      <FilterChip
                        key={k}
                        label={KIND_LABEL[k]}
                        selected={kindFilter === k}
                        onPress={() => setKindFilter(kindFilter === k ? 'all' : k)}
                      />
                    ))}
                  </ScrollView>

                  <Text style={styles.filterLabel}>Grade status</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsRow}
                  >
                    <FilterChip
                      label="All statuses"
                      selected={statusFilter === 'all'}
                      onPress={() => setStatusFilter('all')}
                    />
                    {(['graded', 'pending', 'missing'] as const).map((st) => (
                      <FilterChip
                        key={st}
                        label={statusLabel(st)}
                        selected={statusFilter === st}
                        onPress={() => setStatusFilter(statusFilter === st ? 'all' : st)}
                      />
                    ))}
                  </ScrollView>

                  <Text style={styles.filterLabel}>Task</Text>
                  <Pressable
                    style={styles.taskPickerBtn}
                    onPress={() => {
                      setTaskModalSearch('');
                      setTaskPickerVisible(true);
                    }}
                    android_ripple={{ color: theme.rippleLight }}
                  >
                    <Text style={styles.taskPickerBtnText} numberOfLines={2}>
                      {selectedTaskLabel}
                    </Text>
                    <ChevronDownIcon size={20} color={ink.ink} />
                  </Pressable>
                </>
              ) : null}
            </View>

              {classes.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No classes yet</Text>
                  <Text style={styles.emptyBody}>Create a class and add students to see grades.</Text>
                </View>
              ) : visibleTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No tasks match</Text>
                  <Text style={styles.emptyBody}>
                    Adjust class, type, or task filters. Tasks appear when they are assigned to your
                    classes.
                  </Text>
                </View>
              ) : (
                visibleTasks.map((task) => {
                  const cls = classById.get(task.classId);
                  if (!cls) return null;
                  return (
                    <TaskGradesSection
                      key={task.id}
                      navigation={navigation}
                      task={task}
                      classData={cls}
                      getGrade={getGrade}
                      studentSearch={studentSearch}
                      statusFilter={statusFilter}
                    />
                  );
                })
              )}
              <View style={styles.bottomSpacer} />
            </PulseScrollView>

            <Modal
              visible={taskPickerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setTaskPickerVisible(false)}
            >
              <View style={styles.modalRoot}>
                <Pressable
                  style={styles.modalDimmer}
                  onPress={() => setTaskPickerVisible(false)}
                  accessibilityLabel="Close task picker"
                />
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={styles.modalSheetOuter}
                >
                  <View style={styles.modalSheet}>
                  <View style={styles.modalGrabber} />
                  <Text style={styles.modalTitle}>Choose a task</Text>
                  <View style={styles.modalSearchRow}>
                    <SearchIcon size={18} color={ink.inkSoft} />
                    <TextInput
                      style={styles.modalSearchInput}
                      placeholder="Search by title, class, or type…"
                      placeholderTextColor={ink.placeholder}
                      value={taskModalSearch}
                      onChangeText={setTaskModalSearch}
                    />
                  </View>
                  <FlatList
                    data={tasksForModal}
                    keyExtractor={(item) => item.id}
                    style={styles.modalList}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={
                      <Pressable
                        style={[styles.modalRow, taskFilter === 'all' && styles.modalRowOn]}
                        onPress={() => {
                          setTaskFilter('all');
                          setTaskPickerVisible(false);
                        }}
                      >
                        <Text style={styles.modalRowTitle}>All tasks</Text>
                        <Text style={styles.modalRowSub}>Show every assignment & quiz</Text>
                      </Pressable>
                    }
                    renderItem={({ item }) => {
                      const cn = classById.get(item.classId)?.name ?? 'Class';
                      const selected = taskFilter === item.id;
                      return (
                        <Pressable
                          style={[styles.modalRow, selected && styles.modalRowOn]}
                          onPress={() => {
                            setTaskFilter(item.id);
                            setTaskPickerVisible(false);
                          }}
                        >
                          <Text style={styles.modalRowTitle} numberOfLines={2}>
                            {classFilter === 'all' ? `${cn}: ${item.title}` : item.title}
                          </Text>
                          <Text style={styles.modalRowSub}>
                            {KIND_LABEL[item.kind]}
                            {item.dueLabel ? ` · Due ${item.dueLabel}` : ''}
                          </Text>
                        </Pressable>
                      );
                    }}
                    ListEmptyComponent={
                      <Text style={styles.modalEmpty}>No tasks match your search.</Text>
                    }
                  />
                  </View>
                </KeyboardAvoidingView>
              </View>
            </Modal>
          </>
        )}
      </View>

      {!embedded && <BottomTab navigation={navigation} currentRoute="ViewGrades" />}
    </SafeAreaView>
  );
};

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { styles, theme } = useViewGradesStyles();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
      android_ripple={{ color: theme.rippleLight }}
    >
      <Text style={[styles.chipTxt, selected && styles.chipTxtOn]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function TaskGradesSection({
  navigation,
  task,
  classData,
  getGrade,
  studentSearch,
  statusFilter,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  task: ClassTask;
  classData: ClassData;
  getGrade: (classId: string, taskId: string, studentId: string) => TaskGradeRecord | undefined;
  studentSearch: string;
  statusFilter: StatusFilter;
}) {
  const { styles, theme, ink } = useViewGradesStyles();
  const roster: ClassStudentRecord[] = classData.students ?? [];
  const q = studentSearch.trim().toLowerCase();
  const filteredRoster = useMemo(() => {
    if (!q) return roster;
    return roster.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || (s.email && s.email.toLowerCase().includes(q)),
    );
  }, [roster, q]);

  const rosterRows = useMemo(() => {
    if (statusFilter === 'all') return filteredRoster;
    return filteredRoster.filter((s) => {
      const rec = getGrade(classData.id, task.id, s.id);
      const st = rec?.status ?? 'missing';
      return st === statusFilter;
    });
  }, [filteredRoster, statusFilter, classData.id, task.id, getGrade]);

  return (
    <View style={styles.classBlock}>
      <Pressable
        style={({ pressed }) => [styles.taskHeadRow, styles.taskHeadPressable, pressed && { opacity: 0.88 }]}
        onPress={() =>
          navigation.navigate('TaskGradeReport', { classId: classData.id, taskId: task.id })
        }
        android_ripple={{ color: theme.rippleLight }}
        accessibilityRole="button"
        accessibilityLabel={`Open grade report for ${task.title}`}
      >
        <View style={styles.classIconWell}>
          <BookIcon size={20} color={theme.primary} />
        </View>
        <View style={styles.taskHeadText}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {task.title}
          </Text>
          <Text style={styles.taskMeta} numberOfLines={2}>
            {classData.name} · {KIND_LABEL[task.kind]}
            {task.dueLabel ? ` · Due ${task.dueLabel}` : ''}
          </Text>
        </View>
        <View style={styles.taskReportAffordance}>
          <Text style={styles.taskReportLabel}>Report</Text>
          <ChevronRightIcon size={18} color={theme.primary} />
        </View>
      </Pressable>

      {filteredRoster.length === 0 ? (
        <View style={styles.rosterEmpty}>
          <Text style={styles.rosterEmptyText}>
            {roster.length === 0
              ? classData.studentCount > 0
                ? `No roster on file (${classData.studentCount} students). Add students when creating the class to tie grades to names.`
                : 'No students in this class yet.'
              : 'No students match your search.'}
          </Text>
        </View>
      ) : rosterRows.length === 0 ? (
        <View style={styles.rosterEmpty}>
          <Text style={styles.rosterEmptyText}>
            No students match the grade status filter for this task. Try another status or reset
            filters.
          </Text>
        </View>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.thStudent]}>Student</Text>
            <Text style={[styles.th, styles.thStatus]}>Status</Text>
            <Text style={[styles.th, styles.thGrade]}>Grade</Text>
          </View>
          {rosterRows.map((s, index) => {
            const rec = getGrade(classData.id, task.id, s.id);
            const status = rec?.status ?? 'missing';
            const gradeText = rec?.grade ?? '—';
            return (
              <View
                key={s.id}
                style={[styles.tr, index < rosterRows.length - 1 && styles.trDivider]}
              >
                <View style={styles.tdStudent}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {s.name}
                  </Text>
                  {s.email ? (
                    <Text style={styles.studentEmail} numberOfLines={1}>
                      {s.email}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.tdStatus}>
                  <Text style={[styles.statusTxt, { color: gradeColor(status, theme.primary) }]}>
                    {statusLabel(status)}
                  </Text>
                </View>
                <View style={styles.tdGrade}>
                  <Text style={[styles.gradeBadge, { color: gradeColor(status, theme.primary) }]}>{gradeText}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default ViewGrades;
