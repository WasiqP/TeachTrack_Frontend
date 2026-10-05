import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import BackButton from '../components/Reusable-Components/BackButton';
import { useAttendanceStyles } from './useAttendanceStyles';
import Svg, { Path } from 'react-native-svg';
import { PulseScrollView } from '../components/PulseScrollView';
import {
  useClasses,
  type ClassActivityItem,
  type AttendanceDayRecord,
  type ClassStudentRecord,
} from '../context/ClassesContext';
import { parseStudentCsvRows } from '../utils/parseStudentCsv';
import { usePulseAlert } from '../context/AlertModalContext';

function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Attendance'>;

interface Student {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late' | null;
}

const PRESENT = '#0D9488';
const PRESENT_BG = 'rgba(13, 148, 136, 0.12)';
const LATE = '#D97706';
const LATE_BG = 'rgba(217, 119, 6, 0.12)';
const ABSENT = '#DC2626';
const ABSENT_BG = 'rgba(220, 38, 38, 0.1)';

const CheckIcon = ({ size = 18, color = PRESENT }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const XIcon = ({ size = 18, color = ABSENT }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClockIcon = ({ size = 18, color = LATE }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 6V12L16 14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

function newStudentId(): string {
  return `st-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const Attendance: React.FC<Props> = ({ route, navigation }) => {
  const { styles, ink, theme } = useAttendanceStyles();
  const PlusIcon = ({ size = 22, color = theme.white }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
  const BookIconSmall = ({ size = 22, color = theme.primary }: { size?: number; color?: string }) => (
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

  const insets = useSafeAreaInsets();
  const { classes, updateClass } = useClasses();
  const { showAlert, showSuccess, showError } = usePulseAlert();
  const [activeClassId, setActiveClassId] = useState<string | undefined>(() => route.params?.classId);
  const [searchQuery, setSearchQuery] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvPaste, setCsvPaste] = useState('');
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');

  const classInfo = useMemo(
    () => (activeClassId ? classes.find((c) => c.id === activeClassId) : undefined),
    [classes, activeClassId],
  );

  const roster: ClassStudentRecord[] = classInfo?.students ?? [];

  const persistRosterToClass = (next: ClassStudentRecord[]) => {
    if (!classInfo) return;
    void updateClass(classInfo.id, {
      students: next,
      studentCount: next.length,
    });
  };

  const openAddMenu = () => setAddMenuOpen(true);

  const openAddOne = () => {
    setAddMenuOpen(false);
    setAddName('');
    setAddEmail('');
    setAddOpen(true);
  };

  const openCsvImport = () => {
    setAddMenuOpen(false);
    setCsvPaste('');
    setCsvOpen(true);
  };

  const submitCsvImport = () => {
    if (!classInfo) return;
    const rows = parseStudentCsvRows(csvPaste);
    if (rows.length === 0) {
      showError('No rows found', 'Paste CSV lines with name and optional email, separated by commas.');
      return;
    }
    const added: ClassStudentRecord[] = rows.map((r) => ({
      id: newStudentId(),
      name: r.name,
      email: r.email,
      rollNumber: r.rollNumber,
    }));
    persistRosterToClass([...roster, ...added]);
    setCsvPaste('');
    setCsvOpen(false);
    showSuccess(
      'Imported',
      `Added ${added.length} student${added.length === 1 ? '' : 's'} from CSV.`,
    );
  };

  const submitAdd = () => {
    if (!classInfo) return;
    const name = addName.trim();
    if (!name) {
      showError('Name required', 'Enter a student name.');
      return;
    }
    const email = addEmail.trim();
    const row: ClassStudentRecord = {
      id: newStudentId(),
      name,
      email: email ? email : undefined,
    };
    persistRosterToClass([...roster, row]);
    setAddOpen(false);
    showSuccess('Student added', `${name} was added to the class.`);
  };

  useEffect(() => {
    if (route.params?.classId) {
      setActiveClassId(route.params.classId);
    }
  }, [route.params?.classId]);

  useEffect(() => {
    if (!activeClassId || !classInfo) return;
    setSearchQuery('');
    const roster = classInfo.students ?? [];
    const todayKey = localDateKey();
    const todayRecord = classInfo.attendanceHistory?.find((r) => r.dateKey === todayKey);
    const map = new Map(todayRecord?.entries.map((e) => [e.studentId, e.status]) ?? []);
    setStudents(
      roster.map((s) => ({
        id: s.id,
        name: s.name,
        status: (map.get(s.id) as Student['status']) ?? null,
      })),
    );
  }, [activeClassId, classInfo]);

  const filteredStudents = useMemo(
    () => students.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [students, searchQuery],
  );

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [],
  );

  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;
  const lateCount = students.filter((s) => s.status === 'late').length;
  const unmarkedCount = students.filter((s) => s.status === null).length;

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, status: s.status === status ? null : status } : s,
      ),
    );
  };

  const saveAttendance = (studentSnapshot?: Student[]) => {
    const roster = studentSnapshot ?? students;
    const present = roster.filter((s) => s.status === 'present').length;
    const late = roster.filter((s) => s.status === 'late').length;
    const absent = roster.filter((s) => s.status === 'absent').length;

    if (activeClassId) {
      const cls = classes.find((c) => c.id === activeClassId);
      if (cls) {
        const dateKey = localDateKey();
        const entries = roster.map((s) => ({
          studentId: s.id,
          status: (s.status ?? 'absent') as 'present' | 'absent' | 'late',
        }));
        const newDay: AttendanceDayRecord = {
          id: `att-${Date.now()}`,
          dateKey,
          takenAt: new Date().toISOString(),
          entries,
        };
        const prevHistory = cls.attendanceHistory ?? [];
        const withoutSameDay = prevHistory.filter((r) => r.dateKey !== dateKey);
        const item: ClassActivityItem = {
          id: `act-${Date.now()}`,
          kind: 'attendance',
          headline: 'Attendance marked',
          detail: `${present} present · ${late} late · ${absent} absent`,
          createdAt: new Date().toISOString(),
        };
        void updateClass(activeClassId, {
          attendanceHistory: [newDay, ...withoutSameDay].slice(0, 400),
          activityLog: [item, ...(cls.activityLog ?? [])].slice(0, 40),
        });
      }
    }

    showSuccess('Saved', 'Attendance has been recorded.', () => navigation.goBack());
  };

  const handleSave = () => {
    const notMarked = students.filter((s) => s.status === null).length;
    if (notMarked > 0) {
      showAlert({
        variant: 'warning',
        title: 'Some students unmarked',
        message: `${notMarked} student(s) have no status. Mark them as absent and save?`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark absent & save',
            style: 'default',
            onPress: () => {
              const finalStudents = students.map((s) =>
                s.status === null ? { ...s, status: 'absent' as const } : s,
              );
              setStudents(finalStudents);
              saveAttendance(finalStudents);
            },
          },
        ],
      });
    } else {
      saveAttendance();
    }
  };

  if (!activeClassId) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Which class?</Text>
            <Text style={styles.pickSub}>
              Choose a class to take attendance for today.
            </Text>
          </View>
        </View>

        <PulseScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.pickScrollContent, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {classes.length === 0 ? (
            <View style={styles.pickEmpty}>
              <Text style={styles.pickEmptyTitle}>No classes yet</Text>
              <Text style={styles.pickEmptyBody}>
                Add a class first, then you can take attendance for that roster.
              </Text>
              <Pressable
                style={styles.pickPrimaryBtn}
                onPress={() => navigation.navigate('CreateClass')}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <Text style={styles.pickPrimaryBtnText}>Create a class</Text>
              </Pressable>
            </View>
          ) : (
            classes.map((c) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [styles.pickCard, pressed && styles.pickCardPressed]}
                onPress={() => setActiveClassId(c.id)}
                android_ripple={{ color: ink.pressTint }}
              >
                <View style={styles.pickIconWell}>
                  <BookIconSmall size={24} color={theme.primary} />
                </View>
                <View style={styles.pickCardMain}>
                  <Text style={styles.pickCardTitle} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={styles.pickCardMeta} numberOfLines={2}>
                    {c.subject} · {c.gradeLevel} · {c.studentCount} students
                  </Text>
                  {c.schedule ? (
                    <Text style={styles.pickCardSchedule} numberOfLines={1}>
                      {c.schedule}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.pickChevron}>›</Text>
              </Pressable>
            ))
          )}
        </PulseScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <PulseScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollPageContent, { paddingBottom: 108 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        customTrack={students.length >= 10}
      >
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Mark attendance</Text>
            <Text style={styles.subDate}>{dateLabel}</Text>
            {classInfo ? (
              <Text style={styles.subClass} numberOfLines={1}>
                {classInfo.name}
                <Text style={styles.subMeta}> · {classInfo.subject}</Text>
              </Text>
            ) : (
              <Text style={styles.subClass}>Class</Text>
            )}
            <Pressable
              onPress={() => setActiveClassId(undefined)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Choose a different class"
            >
              <Text style={styles.changeClassLink}>Change class</Text>
            </Pressable>
          </View>
          {classInfo ? (
            <Pressable
              style={({ pressed }) => [styles.headerAddBtn, pressed && styles.headerAddBtnPressed]}
              onPress={openAddMenu}
              accessibilityLabel="Add student or import from CSV"
            >
              <PlusIcon size={22} color={theme.white} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>Today</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCell, { backgroundColor: PRESENT_BG }]}>
              <Text style={[styles.summaryNum, { color: PRESENT }]}>{presentCount}</Text>
              <Text style={styles.summaryLab}>Present</Text>
            </View>
            <View style={[styles.summaryCell, { backgroundColor: LATE_BG }]}>
              <Text style={[styles.summaryNum, { color: LATE }]}>{lateCount}</Text>
              <Text style={styles.summaryLab}>Late</Text>
            </View>
            <View style={[styles.summaryCell, { backgroundColor: ABSENT_BG }]}>
              <Text style={[styles.summaryNum, { color: ABSENT }]}>{absentCount}</Text>
              <Text style={styles.summaryLab}>Absent</Text>
            </View>
            <View style={[styles.summaryCell, styles.summaryCellMuted]}>
              <Text style={[styles.summaryNum, { color: ink.ink }]}>{unmarkedCount}</Text>
              <Text style={styles.summaryLab}>Unmarked</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search students"
            placeholderTextColor={ink.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {classInfo ? (
          <View style={styles.addWideWrap}>
            <Pressable
              style={styles.addWideBtn}
              onPress={openAddMenu}
              android_ripple={{ color: theme.rippleLight }}
              accessibilityLabel="Add student or import from CSV"
            >
              <PlusIcon size={20} color={theme.white} />
              <Text style={styles.addWideBtnTxt}>Add student</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.scrollContent}>
          {students.length === 0 ? (
            <View style={styles.rosterEmpty}>
              <Text style={styles.rosterEmptyTitle}>No students on this roster</Text>
              <Text style={styles.rosterEmptyBody}>
                Tap Add student to enter one name or import a list from CSV. They are saved to this class
                and appear here for marking.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.listEyebrow}>
                Roster · {filteredStudents.length} of {students.length}
              </Text>
              {filteredStudents.map((student) => (
                <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarLetter}>{student.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.studentName} numberOfLines={2}>
                      {student.name}
                    </Text>
                  </View>
                  <View style={styles.segment}>
                    <Pressable
                      accessibilityLabel={`${student.name} present`}
                      style={[
                        styles.segBtn,
                        styles.segLeft,
                        student.status === 'present' && styles.segActivePresent,
                      ]}
                      onPress={() => handleStatusChange(student.id, 'present')}
                      android_ripple={{ color: 'rgba(13,148,136,0.15)' }}
                    >
                      <CheckIcon
                        size={17}
                        color={student.status === 'present' ? '#FFFFFF' : PRESENT}
                      />
                      <Text
                        style={[
                          styles.segLabel,
                          student.status === 'present' && styles.segLabelOnLight,
                        ]}
                      >
                        Present
                      </Text>
                    </Pressable>
                    <View style={styles.segDivider} />
                    <Pressable
                      accessibilityLabel={`${student.name} late`}
                      style={[styles.segBtn, student.status === 'late' && styles.segActiveLate]}
                      onPress={() => handleStatusChange(student.id, 'late')}
                      android_ripple={{ color: 'rgba(217,119,6,0.15)' }}
                    >
                      <ClockIcon
                        size={17}
                        color={student.status === 'late' ? '#FFFFFF' : LATE}
                      />
                      <Text
                        style={[
                          styles.segLabel,
                          student.status === 'late' && styles.segLabelOnLight,
                        ]}
                      >
                        Late
                      </Text>
                    </Pressable>
                    <View style={styles.segDivider} />
                    <Pressable
                      accessibilityLabel={`${student.name} absent`}
                      style={[
                        styles.segBtn,
                        styles.segRight,
                        student.status === 'absent' && styles.segActiveAbsent,
                      ]}
                      onPress={() => handleStatusChange(student.id, 'absent')}
                      android_ripple={{ color: 'rgba(220,38,38,0.12)' }}
                    >
                      <XIcon
                        size={17}
                        color={student.status === 'absent' ? '#FFFFFF' : ABSENT}
                      />
                      <Text
                        style={[
                          styles.segLabel,
                          student.status === 'absent' && styles.segLabelOnLight,
                        ]}
                      >
                        Absent
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </PulseScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            students.length === 0 && styles.saveBtnDisabled,
            pressed && students.length > 0 && styles.saveBtnPressed,
          ]}
          onPress={handleSave}
          disabled={students.length === 0}
          android_ripple={
            students.length === 0 ? undefined : { color: 'rgba(255,255,255,0.2)' }
          }
        >
          <Text style={styles.saveBtnText}>Save attendance</Text>
        </Pressable>
      </View>

      <Modal
        visible={addMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMenuOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalDimmer} onPress={() => setAddMenuOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCenter}
            pointerEvents="box-none"
          >
            <View style={styles.menuCard}>
              <Text style={styles.menuTitle}>Add to roster</Text>
              <Text style={styles.menuHint}>Choose how you want to add students.</Text>
              <Pressable
                style={({ pressed }) => [styles.menuOption, pressed && styles.menuOptionPressed]}
                onPress={openAddOne}
                android_ripple={{ color: theme.rippleLight }}
              >
                <Text style={styles.menuOptionTitle}>Add one student</Text>
                <Text style={styles.menuOptionSub}>Enter name and optional email</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.menuOption, pressed && styles.menuOptionPressed]}
                onPress={openCsvImport}
                android_ripple={{ color: theme.rippleLight }}
              >
                <Text style={styles.menuOptionTitle}>Import from CSV</Text>
                <Text style={styles.menuOptionSub}>
                  Add students in bulk — paste a list (name and optional email per line)
                </Text>
              </Pressable>
              <Pressable style={styles.menuDismiss} onPress={() => setAddMenuOpen(false)}>
                <Text style={styles.menuDismissTxt}>Cancel</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalDimmer} onPress={() => setAddOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCenter}
            pointerEvents="box-none"
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add student</Text>
              <Text style={styles.modalHint}>Name is required. Email is optional.</Text>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Alex Morgan"
                placeholderTextColor={ink.placeholder}
                value={addName}
                onChangeText={setAddName}
              />
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="student@school.edu"
                placeholderTextColor={ink.placeholder}
                value={addEmail}
                onChangeText={setAddEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <View style={styles.modalActions}>
                <Pressable style={styles.modalCancel} onPress={() => setAddOpen(false)}>
                  <Text style={styles.modalCancelTxt}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalSave} onPress={submitAdd}>
                  <Text style={styles.modalSaveTxt}>Add</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={csvOpen} transparent animationType="fade" onRequestClose={() => setCsvOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalDimmer} onPress={() => setCsvOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCenter}
            pointerEvents="box-none"
          >
            <View style={styles.csvCard}>
              <Text style={styles.modalTitle}>Import from CSV</Text>
              <Text style={styles.csvDetailHeading}>Adding students in bulk</Text>
              <Text style={styles.csvDetailBody}>
                Use this when you have a class list from a spreadsheet, a school export, or another
                roster. Paste the list below—each line becomes one student on this class. Existing
                students are not removed; new rows are added to the roster.
              </Text>
              <Text style={styles.csvHelpLabel}>Format</Text>
              <Text style={styles.csvHelp}>
                One student per line: <Text style={styles.csvMono}>Name, email</Text>. Email is optional.
                You can include an optional header row with “name” and “email”. Paste from a .csv file or
                copy columns from Excel or Google Sheets.
              </Text>
              <TextInput
                style={styles.csvTextarea}
                placeholder={'Alex Morgan, alex@school.edu\nJordan Lee'}
                placeholderTextColor={ink.placeholder}
                value={csvPaste}
                onChangeText={setCsvPaste}
                multiline
                textAlignVertical="top"
                scrollEnabled
              />
              <View style={styles.csvActions}>
                <Pressable style={styles.modalCancel} onPress={() => setCsvOpen(false)}>
                  <Text style={styles.modalCancelTxt}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.csvConfirm} onPress={submitCsvImport}>
                  <Text style={styles.modalSaveTxt}>Add to roster</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Attendance;
