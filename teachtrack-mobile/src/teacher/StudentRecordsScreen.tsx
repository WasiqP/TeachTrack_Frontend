import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  Switch,
  Linking,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Clipboard from '@react-native-clipboard/clipboard';
import type { RootStackParamList } from '../types/navigation';
import {
  useClasses,
  type AttendanceDayRecord,
  type AttendanceEntryStatus,
  type ClassStudentRecord,
} from '../context/ClassesContext';
import { useGradesTasks, type TaskGradeRecord, type TaskKind } from '../context/GradesTasksContext';
import { fonts as F, radius, useThemeMode } from '../theme';
import BackButton from '../components/Reusable-Components/BackButton';
import { PulseScrollView } from '../components/PulseScrollView';
import { usePulseAlert } from '../context/AlertModalContext';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import {
  buildStudentRecordPdfHtml,
  safeStudentRecordPdfBaseName,
} from './studentRecordReportHtml';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentRecords'>;

const KIND_LABEL: Record<TaskKind, string> = {
  quiz: 'Quiz',
  assignment: 'Assignment',
  project: 'Project',
  test: 'Test',
};

const PRESENT = '#0D9488';
const LATE = '#D97706';
const ABSENT = '#DC2626';

function formatDateKey(dateKey: string): string {
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateKey;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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

function attendanceDotColor(status: AttendanceEntryStatus, inkSoft: string): string {
  switch (status) {
    case 'present':
      return PRESENT;
    case 'late':
      return LATE;
    case 'absent':
      return ABSENT;
    default:
      return inkSoft;
  }
}

function collectAttendanceForStudent(
  history: AttendanceDayRecord[] | undefined,
  studentId: string,
): { dateKey: string; status: AttendanceEntryStatus; takenAt: string }[] {
  if (!history?.length) return [];
  const out: { dateKey: string; status: AttendanceEntryStatus; takenAt: string }[] = [];
  for (const day of history) {
    const e = day.entries.find(en => en.studentId === studentId);
    if (e) {
      out.push({ dateKey: day.dateKey, status: e.status, takenAt: day.takenAt });
    }
  }
  return out.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

const StudentRecordsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { classId, studentId } = route.params;
  const { ink, theme } = useThemeMode();
  const { classes, updateClass } = useClasses();
  const { grades, getTasksForClass } = useGradesTasks();
  const { showSuccess, showError } = usePulseAlert();

  const classData = useMemo(() => classes.find(c => c.id === classId), [classes, classId]);
  const student = useMemo(
    () => classData?.students?.find(s => s.id === studentId),
    [classData, studentId],
  );

  const [remarkDraft, setRemarkDraft] = useState('');
  const [rollDraft, setRollDraft] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    setRemarkDraft(student?.teacherRemark ?? '');
  }, [student?.teacherRemark, student?.id]);

  useEffect(() => {
    setRollDraft(student?.rollNumber ?? '');
  }, [student?.rollNumber, student?.id]);

  const attendanceRows = useMemo(
    () => collectAttendanceForStudent(classData?.attendanceHistory, studentId),
    [classData?.attendanceHistory, studentId],
  );

  const attendanceStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    for (const r of attendanceRows) {
      if (r.status === 'present') present += 1;
      else if (r.status === 'late') late += 1;
      else if (r.status === 'absent') absent += 1;
    }
    const total = present + late + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : null;
    return { present, late, absent, total, rate };
  }, [attendanceRows]);

  const tasksForClass = useMemo(() => getTasksForClass(classId), [getTasksForClass, classId]);

  const gradeRows = useMemo(() => {
    const list = grades.filter(g => g.classId === classId && g.studentId === studentId);
    return list
      .map(g => ({ g, task: tasksForClass.find(t => t.id === g.taskId) }))
      .sort((a, b) => {
        const ta = a.task?.title ?? a.g.taskId;
        const tb = b.task?.title ?? b.g.taskId;
        return ta.localeCompare(tb);
      });
  }, [grades, classId, studentId, tasksForClass]);

  const persistStudentPatch = useCallback(
    async (patch: Partial<ClassStudentRecord>) => {
      if (!classData || !student) return;
      const roster = classData.students ?? [];
      const next = roster.map(st =>
        st.id === studentId ? { ...st, ...patch } : st,
      );
      await updateClass(classId, { students: next, studentCount: next.length });
    },
    [classData, student, classId, studentId, updateClass],
  );

  const saveRemark = useCallback(async () => {
    Keyboard.dismiss();
    const trimmed = remarkDraft.trim();
    await persistStudentPatch({
      teacherRemark: trimmed || undefined,
      teacherRemarkUpdatedAt: trimmed ? new Date().toISOString() : undefined,
    });
    showSuccess('Saved', trimmed ? 'Remark updated for this student.' : 'Remark cleared.');
  }, [remarkDraft, persistStudentPatch, showSuccess]);

  const saveRollNumber = useCallback(async () => {
    Keyboard.dismiss();
    const trimmed = rollDraft.trim();
    const next = trimmed || undefined;
    const prev = (student?.rollNumber ?? '').trim();
    if (prev === trimmed) return;
    await persistStudentPatch({ rollNumber: next });
    showSuccess('Saved', next ? 'Roll number updated.' : 'Roll number cleared.');
  }, [rollDraft, persistStudentPatch, showSuccess, student?.rollNumber]);

  const toggleFollowUp = useCallback(
    async (value: boolean) => {
      await persistStudentPatch({ followUp: value });
    },
    [persistStudentPatch],
  );

  const openMail = useCallback(() => {
    if (!student?.email) return;
    const subject = encodeURIComponent(
      `TeachTrack — ${classData?.name ?? 'Class'} — ${student.name}`,
    );
    const url = `mailto:${student.email}?subject=${subject}`;
    void Linking.openURL(url);
  }, [student, classData?.name]);

  const copySummary = useCallback(() => {
    if (!student || !classData) return;
    const lines = [
      `Student: ${student.name}`,
      student.rollNumber?.trim() ? `Roll no.: ${student.rollNumber.trim()}` : 'Roll no.: —',
      student.email ? `Email: ${student.email}` : 'Email: —',
      `Class: ${classData.name}`,
      '',
      `Attendance (logged days): ${attendanceStats.total}`,
      `  Present ${attendanceStats.present} · Late ${attendanceStats.late} · Absent ${attendanceStats.absent}`,
      attendanceStats.rate != null ? `  Present rate: ${attendanceStats.rate}%` : '',
      '',
      'Grades:',
      ...gradeRows.map(
        ({ g, task }) => `  • ${task?.title ?? g.taskId}: ${g.grade} (${statusLabel(g.status)})`,
      ),
      '',
      student.teacherRemark ? `Remark:\n${student.teacherRemark}` : 'Remark: —',
    ].filter(Boolean);
    void Clipboard.setString(lines.join('\n'));
    showSuccess('Copied', 'Student summary copied to clipboard.');
  }, [student, classData, attendanceStats, gradeRows, showSuccess]);

  const exportStudentPdf = useCallback(async () => {
    if (!student || !classData) return;
    setExportingPdf(true);
    try {
      const html = buildStudentRecordPdfHtml({
        generatedAtLabel: new Date().toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        studentName: student.name,
        studentRollNumber: student.rollNumber?.trim() || null,
        studentEmail: student.email?.trim() || null,
        followUp: Boolean(student.followUp),
        className: classData.name,
        classSubject: classData.subject,
        gradeLevel: classData.gradeLevel,
        schedule: classData.schedule,
        roomNumber: classData.roomNumber?.trim() || null,
        schoolName: classData.schoolName?.trim() || null,
        schoolType: classData.schoolType?.trim() || null,
        attendance: {
          total: attendanceStats.total,
          present: attendanceStats.present,
          late: attendanceStats.late,
          absent: attendanceStats.absent,
          ratePercent: attendanceStats.rate,
        },
        attendanceRows: attendanceRows.map(r => ({
          dateLabel: formatDateKey(r.dateKey),
          status: r.status,
        })),
        gradeRows: gradeRows.map(({ g, task }) => ({
          title: task?.title ?? g.taskId,
          kindLabel: task ? KIND_LABEL[task.kind] : '—',
          grade: g.grade,
          statusLabel: statusLabel(g.status),
        })),
        remark: student.teacherRemark?.trim() || null,
        remarkUpdatedLabel: student.teacherRemarkUpdatedAt
          ? new Date(student.teacherRemarkUpdatedAt).toLocaleString()
          : null,
      });
      const fileName = safeStudentRecordPdfBaseName(student.name, classData.name);
      const { filePath } = await generatePDF({ html, fileName });
      const normalized = filePath.replace(/^file:\/\//, '');
      const url =
        Platform.OS === 'ios'
          ? normalized.startsWith('/')
            ? `file://${normalized}`
            : normalized
          : `file://${normalized}`;
      await Share.open({
        url,
        type: 'application/pdf',
        title: 'Student record',
        subject: `${student.name} — student record`,
        failOnCancel: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (__DEV__) console.warn('StudentRecords PDF', e);
      showError('Could not create PDF', msg);
    } finally {
      setExportingPdf(false);
    }
  }, [
    student,
    classData,
    attendanceStats,
    attendanceRows,
    gradeRows,
    showError,
  ]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: ink.canvas },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingLeft: 8,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.rowDivider,
          backgroundColor: ink.canvas,
        },
        headerTitle: {
          flex: 1,
          marginLeft: 2,
          fontSize: 20,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.3,
        },
        scroll: { flex: 1 },
        scrollInner: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
        hero: {
          borderRadius: radius.card,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          padding: 16,
          marginBottom: 16,
          backgroundColor: theme.white,
        },
        heroName: {
          fontSize: 22,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.4,
          marginBottom: 6,
        },
        heroMeta: {
          fontSize: 14,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          lineHeight: 20,
        },
        followRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          paddingTop: 14,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: ink.rowDivider,
        },
        followLabel: {
          flex: 1,
          paddingRight: 12,
        },
        followTitle: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        followSub: {
          fontSize: 13,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginTop: 4,
        },
        sectionEyebrow: {
          fontSize: 11,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 10,
        },
        actionsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 20,
        },
        chip: {
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: radius.btn,
          backgroundColor: theme.white,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        chipTxt: {
          fontSize: 14,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        chipDisabled: {
          opacity: 0.45,
        },
        chipInner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        statRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        },
        statPill: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: theme.primarySoft,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        statPillTxt: {
          fontSize: 13,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        card: {
          borderRadius: radius.card,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: theme.white,
          marginBottom: 14,
          overflow: 'hidden',
        },
        attRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.rowDivider,
        },
        attDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          marginRight: 12,
        },
        attDate: {
          flex: 1,
          fontSize: 15,
          fontFamily: F.dmMedium,
          color: ink.ink,
        },
        attStatus: {
          fontSize: 13,
          fontFamily: F.dmSemi,
          textTransform: 'capitalize',
        },
        emptyTxt: {
          fontSize: 14,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          padding: 16,
          lineHeight: 21,
        },
        gradeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.rowDivider,
        },
        gradeLeft: { flex: 1, minWidth: 0, paddingRight: 10 },
        gradeTitle: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        gradeKind: {
          fontSize: 12,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginTop: 4,
        },
        gradeVal: {
          fontSize: 16,
          fontFamily: F.dmExtraBold,
          color: theme.primary,
        },
        gradeChev: {
          fontSize: 20,
          color: ink.inkSoft,
          marginLeft: 4,
        },
        label: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: ink.ink,
          marginBottom: 8,
        },
        rollInput: {
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.card,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === 'ios' ? 14 : 12,
          fontSize: 16,
          fontFamily: F.dmRegular,
          color: ink.ink,
          backgroundColor: theme.white,
        },
        remarkInput: {
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.card,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === 'ios' ? 14 : 12,
          fontSize: 16,
          fontFamily: F.dmRegular,
          color: ink.ink,
          backgroundColor: theme.white,
          minHeight: 100,
          textAlignVertical: 'top',
        },
        saveRollBtn: {
          marginTop: 10,
          backgroundColor: theme.white,
          borderRadius: radius.btn,
          paddingVertical: 12,
          alignItems: 'center',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        saveRollBtnTxt: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        remarkMeta: {
          fontSize: 12,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginTop: 8,
          marginBottom: 12,
        },
        saveBtn: {
          marginTop: 10,
          backgroundColor: theme.primary,
          borderRadius: radius.btn,
          paddingVertical: 14,
          alignItems: 'center',
          borderWidth: ink.borderWidth,
          borderColor: '#000000',
          marginBottom: 10,
        },
        saveBtnTxt: {
          fontSize: 16,
          fontFamily: F.outfitBold,
          color: theme.white,
        },
      }),
    [ink, theme],
  );

  if (!classData || !student) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Student record
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontFamily: F.dmRegular, color: ink.inkSoft, textAlign: 'center' }}>
            Student or class was not found. They may have been removed from the roster.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const remarkUpdated = student.teacherRemarkUpdatedAt
    ? new Date(student.teacherRemarkUpdatedAt).toLocaleString()
    : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          Student record
        </Text>
      </View>

      <PulseScrollView
        customTrack={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroName}>
            {student.rollNumber?.trim() ? `#${student.rollNumber.trim()} · ` : ''}
            {student.name}
          </Text>
          <Text style={styles.heroMeta}>
            {classData.name}
            {classData.subject ? ` · ${classData.subject}` : ''}
            {'\n'}
            {student.email || 'No email on file'}
          </Text>
          <Text style={[styles.sectionEyebrow, { marginTop: 14, marginBottom: 8 }]}>Roll number</Text>
          <Text style={[styles.heroMeta, { marginBottom: 8 }]}>
            Class roll / registration number. Shown in the student list and PDF export.
          </Text>
          <TextInput
            style={styles.rollInput}
            value={rollDraft}
            onChangeText={setRollDraft}
            placeholder="e.g. 12, 1042, A-07"
            placeholderTextColor={ink.placeholder}
            maxLength={16}
            accessibilityLabel="Roll number"
          />
          <Pressable
            style={styles.saveRollBtn}
            onPress={() => void saveRollNumber()}
            android_ripple={{ color: ink.pressTint }}
          >
            <Text style={styles.saveRollBtnTxt}>Save roll number</Text>
          </Pressable>
          <View style={styles.followRow}>
            <View style={styles.followLabel}>
              <Text style={styles.followTitle}>Follow up</Text>
              <Text style={styles.followSub}>Flag for extra check-ins or support.</Text>
            </View>
            <Switch
              value={Boolean(student.followUp)}
              onValueChange={v => void toggleFollowUp(v)}
              trackColor={{ false: ink.rowDivider, true: theme.primarySoft }}
              thumbColor={
                Platform.OS === 'android'
                  ? student.followUp
                    ? '#000000'
                    : "black"
                  : "black"
              }
            />
          </View>
        </View>

        <Text style={styles.sectionEyebrow}>Quick actions</Text>
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.chip}
            onPress={() => navigation.navigate('Attendance', { classId })}
            android_ripple={{ color: ink.pressTint }}
          >
            <Text style={styles.chipTxt}>Mark attendance</Text>
          </Pressable>
          <Pressable
            style={styles.chip}
            onPress={() => navigation.navigate('ClassDetails', { classId })}
            android_ripple={{ color: ink.pressTint }}
          >
            <Text style={styles.chipTxt}>Class details</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, !student.email && styles.chipDisabled]}
            onPress={openMail}
            disabled={!student.email}
            android_ripple={{ color: ink.pressTint }}
          >
            <Text style={styles.chipTxt}>Email student</Text>
          </Pressable>
          <Pressable
            style={styles.chip}
            onPress={copySummary}
            android_ripple={{ color: ink.pressTint }}
          >
            <Text style={styles.chipTxt}>Copy summary</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, exportingPdf && styles.chipDisabled]}
            onPress={() => void exportStudentPdf()}
            disabled={exportingPdf}
            accessibilityLabel="Export student record as PDF"
            android_ripple={{ color: ink.pressTint }}
          >
            <View style={styles.chipInner}>
              {exportingPdf ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : null}
              <Text style={styles.chipTxt}>Export PDF</Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionEyebrow}>Attendance</Text>
        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillTxt}>{attendanceStats.total} days logged</Text>
          </View>
          {attendanceStats.rate != null ? (
            <View style={styles.statPill}>
              <Text style={styles.statPillTxt}>{attendanceStats.rate}% present</Text>
            </View>
          ) : null}
          <View style={styles.statPill}>
            <Text style={styles.statPillTxt}>
              P {attendanceStats.present} · L {attendanceStats.late} · A {attendanceStats.absent}
            </Text>
          </View>
        </View>
        <View style={styles.card}>
          {attendanceRows.length === 0 ? (
            <Text style={styles.emptyTxt}>
              No attendance history yet for this student. Open Mark attendance to record a session—
              saved days appear here automatically.
            </Text>
          ) : (
            attendanceRows.slice(0, 25).map((row, i) => (
              <View
                key={row.dateKey}
                style={[styles.attRow, i === Math.min(attendanceRows.length, 25) - 1 && { borderBottomWidth: 0 }]}
              >
                <View
                  style={[styles.attDot, { backgroundColor: attendanceDotColor(row.status, ink.inkSoft) }]}
                />
                <Text style={styles.attDate}>{formatDateKey(row.dateKey)}</Text>
                <Text style={[styles.attStatus, { color: attendanceDotColor(row.status, ink.inkSoft) }]}>
                  {row.status}
                </Text>
              </View>
            ))
          )}
          {attendanceRows.length > 25 ? (
            <Text style={[styles.emptyTxt, { paddingTop: 0 }]}>
              Showing the 25 most recent sessions. Older days stay in your class data.
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionEyebrow}>Grades</Text>
        <View style={styles.card}>
          {gradeRows.length === 0 ? (
            <Text style={styles.emptyTxt}>
              No graded tasks for this class yet. Assign tasks from Quizzes or class workflows to see
              entries here.
            </Text>
          ) : (
            gradeRows.map(({ g, task }, i) => (
              <Pressable
                key={g.id}
                style={[
                  styles.gradeRow,
                  i === gradeRows.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => navigation.navigate('TaskGradeReport', { classId, taskId: g.taskId })}
                android_ripple={{ color: ink.pressTint }}
              >
                <View style={styles.gradeLeft}>
                  <Text style={styles.gradeTitle} numberOfLines={2}>
                    {task?.title}
                  </Text>
                  <Text style={styles.gradeKind}>
                    {task ? KIND_LABEL[task.kind] : ''} · {statusLabel(g.status)}
                  </Text>
                </View>
                <Text style={styles.gradeVal}>{g.grade}</Text>
                <Text style={styles.gradeChev}>›</Text>
              </Pressable>
            ))
          )}
        </View>

        <Text style={styles.sectionEyebrow}>Teacher remark</Text>
        <Text style={[styles.heroMeta, { marginBottom: 10 }]}>
          Private to you on this device. Use for behavior notes, accommodations, or meeting reminders.
        </Text>
        <Text style={styles.label}>Remark</Text>
        <TextInput
          style={styles.remarkInput}
          value={remarkDraft}
          onChangeText={setRemarkDraft}
          placeholder="e.g. Check in after absences. Parent meeting scheduled…"
          placeholderTextColor={ink.placeholder}
          multiline
        />
        {remarkUpdated ? (
          <Text style={styles.remarkMeta}>Last saved: {remarkUpdated}</Text>
        ) : null}
        <Pressable
          style={styles.saveBtn}
          onPress={() => void saveRemark()}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <Text style={styles.saveBtnTxt}>Save remark</Text>
        </Pressable>
      </PulseScrollView>
    </SafeAreaView>
  );
};

export default StudentRecordsScreen;
