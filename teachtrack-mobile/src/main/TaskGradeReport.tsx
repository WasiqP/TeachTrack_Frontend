import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useClasses, type ClassStudentRecord } from '../context/ClassesContext';
import {
  useGradesTasks,
  type TaskKind,
  type TaskGradeRecord,
} from '../context/GradesTasksContext';
import { fonts as F, radius, useThemeMode } from '../theme';
import BackButton from '../components/Reusable-Components/BackButton';
import { PulseScrollView } from '../components/PulseScrollView';
import Svg, { Path } from 'react-native-svg';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { usePulseAlert } from '../context/AlertModalContext';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskGradeReport'>;

const KIND_LABEL: Record<TaskKind, string> = {
  quiz: 'Quiz',
  assignment: 'Assignment',
  project: 'Project',
  test: 'Test',
};

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Safe basename for react-native-html-to-pdf (no path chars). */
function safePdfBaseName(taskTitle: string, className: string): string {
  const raw = `grade-${taskTitle}-${className}-${new Date().toISOString().slice(0, 10)}`;
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-');
  return cleaned.slice(0, 80) || 'grade-report';
}

function buildGradeReportPdfHtml(params: {
  taskTitle: string;
  className: string;
  kindLabel: string;
  dueLabel: string | null;
  summary: { total: number; graded: number; pending: number; missing: number };
  rows: Array<{
    name: string;
    email: string | null;
    statusLabel: string;
    grade: string;
    statusColor: string;
  }>;
}): string {
  const { taskTitle, className, kindLabel, dueLabel, summary, rows } = params;
  const metaParts = [className, kindLabel];
  if (dueLabel) metaParts.push(`Due ${dueLabel}`);
  const meta = escapeHtml(metaParts.join(' · '));

  const rowHtml = rows
    .map(
      (r) => `
    <tr class="data-row">
      <td class="col-student">
        <div class="student-name">${escapeHtml(r.name)}</div>
        ${r.email ? `<div class="student-email">${escapeHtml(r.email)}</div>` : ''}
      </td>
      <td class="col-status" style="color:${r.statusColor}">${escapeHtml(r.statusLabel)}</td>
      <td class="col-grade" style="color:${r.statusColor}">${escapeHtml(r.grade)}</td>
    </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    padding: 28px 32px 40px;
    margin: 0;
    background: #faf8ff;
  }
  h1 { font-size: 22px; margin: 0 0 8px 0; font-weight: 700; letter-spacing: -0.3px; }
  .meta { font-size: 14px; color: #5c5c6b; margin: 0 0 20px 0; line-height: 1.45; }
  .pill {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 10px;
    background: rgba(160, 96, 255, 0.12);
    border: 1px solid rgba(0,0,0,0.08);
    font-size: 13px;
    font-weight: 600;
    color: #7c3aed;
    margin-bottom: 22px;
  }
  .section { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b6b7a; margin: 0 0 10px 0; font-weight: 600; }
  .stats { display: table; width: 100%; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; margin-bottom: 22px; background: #faf8ff; }
  .stats-row { display: table-row; }
  .stat-cell {
    display: table-cell;
    width: 25%;
    text-align: center;
    padding: 14px 8px;
    border-right: 1px solid rgba(0,0,0,0.08);
    vertical-align: middle;
  }
  .stat-cell:last-child { border-right: none; }
  .stat-num { font-size: 22px; font-weight: 800; letter-spacing: -0.4px; color: #1a1a1a; }
  .stat-num.ok { color: #A060FF; }
  .stat-num.pen { color: #D97706; }
  .stat-num.mis { color: #DC2626; }
  .stat-lab { font-size: 11px; color: #6b6b7a; margin-top: 4px; font-weight: 600; }
  table.grade-table { width: 100%; border-collapse: collapse; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
  thead th {
    background: rgba(160, 96, 255, 0.08);
    padding: 10px;
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b6b7a; font-weight: 600; text-align: left;
  }
  th.col-status { text-align: center; width: 76px; }
  th.col-grade { text-align: right; width: 64px; }
  td { padding: 10px; border-top: 1px solid rgba(0,0,0,0.08); vertical-align: middle; }
  .student-name { font-size: 15px; font-weight: 600; color: #1a1a1a; }
  .student-email { font-size: 12px; color: #6b6b7a; margin-top: 2px; }
  .col-status { text-align: center; font-size: 12px; font-weight: 600; }
  .col-grade { text-align: right; font-size: 14px; font-weight: 700; }
  .footer { font-size: 13px; color: #6b6b7a; font-style: italic; line-height: 1.45; margin-top: 8px; }
</style>
</head>
<body>
  <h1>${escapeHtml(taskTitle)}</h1>
  <p class="meta">${meta}</p>
  <div class="pill">${escapeHtml(kindLabel)}</div>

  <p class="section">Summary</p>
  <div class="stats">
    <div class="stats-row">
      <div class="stat-cell"><div class="stat-num">${summary.total}</div><div class="stat-lab">On roster</div></div>
      <div class="stat-cell"><div class="stat-num ok">${summary.graded}</div><div class="stat-lab">Graded</div></div>
      <div class="stat-cell"><div class="stat-num pen">${summary.pending}</div><div class="stat-lab">Pending</div></div>
      <div class="stat-cell"><div class="stat-num mis">${summary.missing}</div><div class="stat-lab">Missing</div></div>
    </div>
  </div>

  <p class="section">Student grades</p>
  <table class="grade-table">
    <thead>
      <tr>
        <th>Student</th>
        <th class="col-status">Status</th>
        <th class="col-grade">Grade</th>
      </tr>
    </thead>
    <tbody>
      ${rowHtml}
    </tbody>
  </table>
  <p class="footer">Grades are stored per student for this task.</p>
</body>
</html>`;
}

const BookIcon = ({ size = 22, color = '#A060FF' }: { size?: number; color?: string }) => (
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

const DownloadIcon = ({ size = 24, color = '#A060FF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4v12M8 12l4 4 4-4M5 19h14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InfoCircleIcon = ({ size = 20, color }: { size?: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 16V12M12 8H12.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TaskGradeReport: React.FC<Props> = ({ navigation, route }) => {
  const { ink, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const { classId, taskId } = route.params;
  const { classes } = useClasses();
  const { tasks, getGrade } = useGradesTasks();

  const classData = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);
  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);

  const roster: ClassStudentRecord[] = classData?.students ?? [];

  const summary = useMemo(() => {
    let graded = 0;
    let pending = 0;
    let missing = 0;
    roster.forEach((s) => {
      const rec = getGrade(classId, taskId, s.id);
      const st = rec?.status ?? 'missing';
      if (st === 'graded') graded++;
      else if (st === 'pending') pending++;
      else missing++;
    });
    return { graded, pending, missing, total: roster.length };
  }, [roster, classId, taskId, getGrade]);

  const { showError, showWarning } = usePulseAlert();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    if (!classData || !task) return;
    if (roster.length === 0) {
      showWarning(
        'Nothing to export',
        'Add students to this class before downloading a grade report.',
      );
      return;
    }
    setDownloading(true);
    try {
      const rows = roster.map((s) => {
        const rec = getGrade(classId, taskId, s.id);
        const status = rec?.status ?? 'missing';
        const gradeText = rec?.grade ?? '—';
        return {
          name: s.name,
          email: s.email || null,
          statusLabel: statusLabel(status),
          grade: gradeText,
          statusColor: gradeColor(status, theme.primary),
        };
      });
      const html = buildGradeReportPdfHtml({
        taskTitle: task.title,
        className: classData.name,
        kindLabel: KIND_LABEL[task.kind],
        dueLabel: task.dueLabel ?? null,
        summary,
        rows,
      });
      const fileName = safePdfBaseName(task.title, classData.name);
      const { filePath } = await generatePDF({
        html,
        fileName,
      });
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
        title: 'Grade report',
        subject: `${task.title} — grade report`,
        failOnCancel: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (__DEV__) console.warn('TaskGradeReport PDF', e);
      showError('Could not create PDF', msg);
    } finally {
      setDownloading(false);
    }
  }, [
    classData,
    task,
    roster,
    classId,
    taskId,
    getGrade,
    summary,
    showError,
    showWarning,
    theme.primary,
  ]);


  const styles = useMemo(
    () =>
      StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ink.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingLeft: 8,
    paddingTop: 12,
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
  headerSpacer: {
    width: 44,
  },
  downloadBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnPressed: {
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  hero: {
    marginBottom: 22,
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
  kindPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: theme.primarySoft,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
  },
  kindPillTxt: {
    fontSize: 13,
    fontFamily: F.dmSemi,
    color: theme.primary,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: F.dmSemi,
    color: ink.inkSoft,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: ink.canvas,
    borderRadius: radius.card,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 22,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: ink.rowDivider,
    marginVertical: 4,
  },
  statNum: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: F.dmExtraBold,
    color: ink.ink,
    letterSpacing: -0.4,
  },
  statLab: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: F.dmSemi,
    color: ink.inkSoft,
  },
  table: {
    borderRadius: radius.card,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
    overflow: 'hidden',
    marginBottom: 4,
    backgroundColor: theme.white,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: 'rgba(160, 96, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  th: {
    fontSize: 11,
    fontFamily: F.dmSemi,
    color: ink.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  thStudent: {
    flex: 1,
    minWidth: 0,
  },
  thStatus: {
    width: 76,
    textAlign: 'center',
  },
  thGrade: {
    width: 64,
    textAlign: 'right',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.white,
  },
  trDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ink.rowDivider,
  },
  tdStudent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  tdStatus: {
    width: 76,
    alignItems: 'center',
  },
  tdGrade: {
    width: 64,
    alignItems: 'flex-end',
  },
  studentName: {
    fontSize: 15,
    fontFamily: F.dmSemi,
    color: ink.ink,
  },
  studentEmail: {
    fontSize: 12,
    fontFamily: F.dmRegular,
    color: ink.inkSoft,
    marginTop: 2,
  },
  statusTxt: {
    fontSize: 12,
    fontFamily: F.dmSemi,
  },
  gradeBadge: {
    fontSize: 14,
    fontFamily: F.dmBold,
  },
  emptyCard: {
    padding: 18,
    borderRadius: radius.card,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
    borderStyle: 'dashed',
    backgroundColor: theme.white,
    marginBottom: 4,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: F.dmRegular,
    color: ink.inkSoft,
  },
  footerSection: {
    marginTop: 20,
    borderRadius: radius.card,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
    backgroundColor: theme.white,
    overflow: 'hidden',
  },
  footerAccent: {
    height: 4,
    backgroundColor: theme.primary,
    opacity: 0.85,
  },
  footerInner: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  footerEyebrow: {
    fontSize: 11,
    fontFamily: F.dmSemi,
    color: ink.inkSoft,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  footerTitle: {
    fontSize: 18,
    fontFamily: F.outfitBold,
    color: ink.ink,
    letterSpacing: -0.35,
    marginBottom: 8,
  },
  footerLead: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: F.dmRegular,
    color: ink.inkSoft,
    marginBottom: 16,
  },
  exportPdfBtn: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: radius.btn,
    backgroundColor: theme.primary,
    borderWidth: ink.borderWidth,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  exportPdfBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exportPdfBtnDisabled: {
    opacity: 0.65,
  },
  exportPdfBtnTxt: {
    fontSize: 16,
    fontFamily: F.outfitBold,
    color: theme.white,
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ink.rowDivider,
    marginVertical: 18,
  },
  dataNoteWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.primarySoft,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
  },
  dataNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: F.dmRegular,
    color: ink.ink,
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
    marginBottom: 20,
  },
  notFoundBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: theme.primary,
    borderWidth: ink.borderWidth,
    borderColor: '#000000',
  },
  notFoundBtnTxt: {
    fontSize: 16,
    fontFamily: F.outfitBold,
    color: theme.white,
  },
      }),
    [ink, theme],
  );
  if (!classData || !task) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Grade report</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Could not load report</Text>
          <Text style={styles.notFoundBody}>This class or task may have been removed.</Text>
          <Pressable style={styles.notFoundBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.notFoundBtnTxt}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          Grade report
        </Text>
        <Pressable
          style={({ pressed }) => [styles.downloadBtn, pressed && styles.downloadBtnPressed]}
          onPress={handleDownloadPdf}
          disabled={downloading}
          android_ripple={{ color: theme.ripple, borderless: true, radius: 22 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Download grade report as PDF"
        >
          {downloading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <DownloadIcon size={24} color={theme.primary} />
          )}
        </Pressable>
      </View>

      <PulseScrollView
        customTrack={false}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 28 + Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <BookIcon size={28} color={theme.primary} />
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.heroMeta}>
            {classData.name} · {KIND_LABEL[task.kind]}
            {task.dueLabel ? ` · Due ${task.dueLabel}` : ''}
          </Text>
          <View style={styles.kindPill}>
            <Text style={styles.kindPillTxt}>{KIND_LABEL[task.kind]}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Summary</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{summary.total}</Text>
            <Text style={styles.statLab}>On roster</Text>
          </View>
          <View style={styles.statRule} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: theme.primary }]}>{summary.graded}</Text>
            <Text style={styles.statLab}>Graded</Text>
          </View>
          <View style={styles.statRule} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#D97706' }]}>{summary.pending}</Text>
            <Text style={styles.statLab}>Pending</Text>
          </View>
          <View style={styles.statRule} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#DC2626' }]}>{summary.missing}</Text>
            <Text style={styles.statLab}>Missing</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Student grades</Text>
        {roster.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyBody}>
              No students on this class roster. Add students in class details to track grades by
              name.
            </Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, styles.thStudent]}>Student</Text>
              <Text style={[styles.th, styles.thStatus]}>Status</Text>
              <Text style={[styles.th, styles.thGrade]}>Grade</Text>
            </View>
            {roster.map((s, index) => {
              const rec = getGrade(classId, taskId, s.id);
              const status = rec?.status ?? 'missing';
              const gradeText = rec?.grade ?? '—';
              return (
                <View
                  key={s.id}
                  style={[styles.tr, index < roster.length - 1 && styles.trDivider]}
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
                    <Text style={[styles.gradeBadge, { color: gradeColor(status, theme.primary) }]}>
                      {gradeText}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.footerSection}>
          <View style={styles.footerAccent} />
          <View style={styles.footerInner}>
            <Text style={styles.footerEyebrow}>Export & backup</Text>
            <Text style={styles.footerTitle}>Share this grade sheet</Text>
            <Text style={styles.footerLead}>
              Generate a PDF with the roster and scores shown above—ready to email, print, or archive.
            </Text>
            <Pressable
              style={[styles.exportPdfBtn, downloading && styles.exportPdfBtnDisabled]}
              onPress={() => void handleDownloadPdf()}
              disabled={downloading}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              accessibilityRole="button"
              accessibilityLabel="Export grade report as PDF"
            >
              {downloading ? (
                <ActivityIndicator size="small" color={theme.white} />
              ) : (
                <View style={styles.exportPdfBtnInner}>
                  <DownloadIcon size={20} color={theme.white} />
                  <Text style={styles.exportPdfBtnTxt}>Export PDF</Text>
                </View>
              )}
            </Pressable>
            <View style={styles.footerDivider} />
            <View style={styles.dataNoteWrap}>
              <InfoCircleIcon color={theme.primary} size={20} />
              <Text style={styles.dataNoteText}>
                Grades are stored per student for this task. Open View grades to compare other tasks or
                classes.
              </Text>
            </View>
          </View>
        </View>
      </PulseScrollView>
    </SafeAreaView>
  );
};


export default TaskGradeReport;
