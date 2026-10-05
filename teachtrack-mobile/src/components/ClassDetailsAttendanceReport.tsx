import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  Modal,
  Keyboard,
  FlatList,
  type ListRenderItem,
  type ViewStyle,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Svg, { Path } from 'react-native-svg';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import type { ClassData, ClassStudentRecord, AttendanceDayRecord } from '../context/ClassesContext';
import { usePulseAlert } from '../context/AlertModalContext';
import { useClassDetailsAttendanceReportStyles } from './useClassDetailsAttendanceReportStyles';

type PeriodMode = 'day' | 'week' | 'month' | 'custom';

type PickerTarget = 'anchor' | 'rangeFrom' | 'rangeTo';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + offset);
  return x;
}

function endOfWeekFromMonday(mon: Date): Date {
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate());
  sun.setDate(sun.getDate() + 6);
  return sun;
}

/** January → December for one calendar year (12 rows). */
function monthsJanuaryThroughDecember(year: number): Date[] {
  return Array.from({ length: 12 }, (_, m) => new Date(year, m, 1));
}

/** Must match `styles.monthRow` + `styles.monthRowGap` total height for list layout. */
const MONTH_ROW_HEIGHT = 58;

function formatMediumDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function safePdfName(className: string): string {
  const raw = `attendance-${className}-${localDateKey(new Date())}`;
  return raw.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'attendance-report';
}

function periodBounds(
  mode: PeriodMode,
  anchor: Date,
  rangeFrom: Date,
  rangeTo: Date,
): { startKey: string; endKey: string; label: string } {
  const ak = localDateKey(anchor);
  switch (mode) {
    case 'day':
      return {
        startKey: ak,
        endKey: ak,
        label: anchor.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      };
    case 'week': {
      const mon = startOfWeekMonday(anchor);
      const sun = endOfWeekFromMonday(mon);
      const sk = localDateKey(mon);
      const ek = localDateKey(sun);
      return {
        startKey: sk,
        endKey: ek,
        label: `${formatMediumDate(mon)} → ${formatMediumDate(sun)}`,
      };
    }
    case 'month': {
      const y = anchor.getFullYear();
      const m = anchor.getMonth();
      const first = new Date(y, m, 1);
      const last = new Date(y, m + 1, 0);
      return {
        startKey: localDateKey(first),
        endKey: localDateKey(last),
        label: first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      };
    }
    case 'custom': {
      let a = localDateKey(rangeFrom);
      let b = localDateKey(rangeTo);
      if (a > b) [a, b] = [b, a];
      return { startKey: a, endKey: b, label: `${a} → ${b}` };
    }
  }
}

function eachDateKeyInRange(startKey: string, endKey: string): string[] {
  const out: string[] = [];
  const [ys, ms, ds] = startKey.split('-').map(Number);
  const [ye, me, de] = endKey.split('-').map(Number);
  const cur = new Date(ys, ms - 1, ds);
  const end = new Date(ye, me - 1, de);
  while (cur <= end) {
    out.push(localDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function statusWord(s: 'present' | 'late' | 'absent'): string {
  switch (s) {
    case 'present':
      return 'Present';
    case 'late':
      return 'Late';
    case 'absent':
      return 'Absent';
    default:
      return '—';
  }
}

function buildAttendancePdfHtml(params: {
  className: string;
  subject: string;
  periodLabel: string;
  scopeLabel: string;
  isSingleDayClass: boolean;
  isSingleStudent: boolean;
  /** Single day + whole class */
  dayRows?: { name: string; email?: string; status: string }[];
  /** Multi day + whole class: per-student aggregate */
  aggRows?: { name: string; email?: string; p: number; l: number; a: number; rate: string }[];
  /** One student: per date */
  timelineRows?: { dateKey: string; status: string }[];
}): string {
  const {
    className,
    subject,
    periodLabel,
    scopeLabel,
    isSingleDayClass,
    isSingleStudent,
    dayRows,
    aggRows,
    timelineRows,
  } = params;

  let tableHtml = '';
  if (isSingleStudent && timelineRows) {
    tableHtml = `
      <table class="t">
        <thead><tr><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          ${timelineRows
            .map(
              (r) =>
                `<tr><td>${escapeHtml(r.dateKey)}</td><td>${escapeHtml(r.status)}</td></tr>`,
            )
            .join('')}
        </tbody>
      </table>`;
  } else if (isSingleDayClass && dayRows) {
    tableHtml = `
      <table class="t">
        <thead><tr><th>Student</th><th>Status</th></tr></thead>
        <tbody>
          ${dayRows
            .map(
              (r) =>
                `<tr><td><div class="nm">${escapeHtml(r.name)}</div>${
                  r.email ? `<div class="em">${escapeHtml(r.email)}</div>` : ''
                }</td><td class="st">${escapeHtml(r.status)}</td></tr>`,
            )
            .join('')}
        </tbody>
      </table>`;
  } else if (aggRows) {
    tableHtml = `
      <table class="t">
        <thead><tr><th>Student</th><th>P</th><th>L</th><th>A</th><th>%</th></tr></thead>
        <tbody>
          ${aggRows
            .map(
              (r) =>
                `<tr><td><div class="nm">${escapeHtml(r.name)}</div>${
                  r.email ? `<div class="em">${escapeHtml(r.email)}</div>` : ''
                }</td><td>${r.p}</td><td>${r.l}</td><td>${r.a}</td><td>${escapeHtml(r.rate)}</td></tr>`,
            )
            .join('')}
        </tbody>
      </table>`;
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111;padding:24px 28px;background:#faf8ff;}
h1{font-size:20px;margin:0 0 6px;}
.sub{color:#555;font-size:14px;margin:0 0 16px;line-height:1.45;}
.meta{font-size:12px;color:#666;margin-bottom:18px;}
table.t{width:100%;border-collapse:collapse;border:1px solid rgba(0,0,0,.1);border-radius:10px;overflow:hidden;}
th{background:rgba(160,96,255,.1);text-align:left;padding:10px;font-size:11px;text-transform:uppercase;color:#555;}
td{padding:10px;border-top:1px solid rgba(0,0,0,.08);font-size:14px;}
.nm{font-weight:600;}
.em{font-size:12px;color:#666;margin-top:2px;}
.st{font-weight:600;}
</style></head><body>
<h1>Attendance report</h1>
<p class="sub">${escapeHtml(className)} · ${escapeHtml(subject)}</p>
<p class="meta"><strong>Period:</strong> ${escapeHtml(periodLabel)}<br/>
<strong>Scope:</strong> ${escapeHtml(scopeLabel)}<br/>
Generated ${escapeHtml(new Date().toLocaleString())}</p>
${tableHtml}
</body></html>`;
}

type Props = {
  classData: ClassData;
  /** Merges with the outer card (e.g. match Mark Attendance horizontal padding). */
  containerStyle?: ViewStyle;
};

const ClassDetailsAttendanceReport: React.FC<Props> = ({ classData, containerStyle }) => {
  const { styles, theme } = useClassDetailsAttendanceReportStyles();
  const DownloadIcon = ({ size = 22, color = theme.primary }: { size?: number; color?: string }) => (
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

  const { showError, showWarning } = usePulseAlert();
  const [periodMode, setPeriodMode] = useState<PeriodMode>('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [rangeFrom, setRangeFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [rangeTo, setRangeTo] = useState(() => new Date());
  const [scope, setScope] = useState<'all' | 'one'>('all');
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [pickerTarget, setPickerTarget] = useState<PickerTarget>('anchor');
  const [androidOpen, setAndroidOpen] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const [iosTemp, setIosTemp] = useState(() => new Date());
  const [monthModalOpen, setMonthModalOpen] = useState(false);
  const monthListRef = useRef<FlatList<Date>>(null);

  const weekRange = useMemo(() => {
    const mon = startOfWeekMonday(anchorDate);
    const sun = endOfWeekFromMonday(mon);
    return { mon, sun };
  }, [anchorDate]);

  const monthYear = anchorDate.getFullYear();
  const monthOptions = useMemo(
    () => monthsJanuaryThroughDecember(monthYear),
    [monthYear],
  );

  /** Scroll selected month to vertical center when the sheet opens. */
  useEffect(() => {
    if (!monthModalOpen) return;
    const idx = Math.min(11, Math.max(0, anchorDate.getMonth()));
    const id = setTimeout(() => {
      monthListRef.current?.scrollToIndex({
        index: idx,
        viewPosition: 0.5,
        animated: false,
      });
    }, 80);
    return () => clearTimeout(id);
  }, [monthModalOpen, anchorDate.getMonth(), anchorDate.getFullYear()]);

  const roster: ClassStudentRecord[] = classData.students ?? [];
  const history: AttendanceDayRecord[] = classData.attendanceHistory ?? [];

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || (s.email && s.email.toLowerCase().includes(q)),
    );
  }, [roster, studentQuery]);

  const { startKey, endKey, label: periodLabel } = useMemo(
    () => periodBounds(periodMode, anchorDate, rangeFrom, rangeTo),
    [periodMode, anchorDate, rangeFrom, rangeTo],
  );

  const pickerValue = useMemo(() => {
    if (pickerTarget === 'rangeFrom') return rangeFrom;
    if (pickerTarget === 'rangeTo') return rangeTo;
    return anchorDate;
  }, [pickerTarget, rangeFrom, rangeTo, anchorDate]);

  const openPicker = (t: PickerTarget) => {
    Keyboard.dismiss();
    setPickerTarget(t);
    if (t === 'anchor') setIosTemp(anchorDate);
    else if (t === 'rangeFrom') setIosTemp(rangeFrom);
    else setIosTemp(rangeTo);
    if (Platform.OS === 'android') {
      setAndroidOpen(true);
    } else {
      setIosOpen(true);
    }
  };

  const onAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setAndroidOpen(false);
    if (event.type !== 'set' || !date) return;
    if (pickerTarget === 'anchor') setAnchorDate(date);
    else if (pickerTarget === 'rangeFrom') setRangeFrom(date);
    else setRangeTo(date);
  };

  const applyIosDate = () => {
    if (pickerTarget === 'anchor') setAnchorDate(iosTemp);
    else if (pickerTarget === 'rangeFrom') setRangeFrom(iosTemp);
    else setRangeTo(iosTemp);
    setIosOpen(false);
  };

  const exportPdf = useCallback(async () => {
    if (roster.length === 0) {
      showWarning('No students', 'Add students to this class before exporting attendance.');
      return;
    }

    const sid =
      scope === 'one' ? (selectedStudentId ?? filteredStudents[0]?.id ?? null) : null;
    if (scope === 'one' && !sid) {
      showWarning('Pick a student', 'Search and select a student for this report.');
      return;
    }
    const student =
      scope === 'one' && sid ? (roster.find((s) => s.id === sid) ?? null) : null;
    if (scope === 'one' && !student) {
      showWarning('Pick a student', 'That student is not on this roster.');
      return;
    }

    const inRange = history.filter((r) => r.dateKey >= startKey && r.dateKey <= endKey);
    if (inRange.length === 0) {
      showWarning(
        'No attendance in range',
        'There are no saved attendance records for this period. Mark attendance on the Attendance screen first.',
      );
      return;
    }

    setDownloading(true);
    try {
      const scopeLabel =
        scope === 'all' ? 'Entire class' : student ? student.name : 'One student';

      const singleDay = startKey === endKey;

      let html: string;

      if (scope === 'one' && student) {
        const keys = eachDateKeyInRange(startKey, endKey);
        const timelineRows = keys.map((dk) => {
          const rec = inRange.find((r) => r.dateKey === dk);
          const ent = rec?.entries.find((e) => e.studentId === student.id);
          return {
            dateKey: dk,
            status: ent ? statusWord(ent.status) : '—',
          };
        });
        html = buildAttendancePdfHtml({
          className: classData.name,
          subject: classData.subject,
          periodLabel,
          scopeLabel,
          isSingleDayClass: false,
          isSingleStudent: true,
          timelineRows,
        });
      } else if (singleDay) {
        const rec = inRange.find((r) => r.dateKey === startKey);
        const dayRows = roster.map((s) => {
          const ent = rec?.entries.find((e) => e.studentId === s.id);
          return {
            name: s.name,
            email: s.email,
            status: ent ? statusWord(ent.status) : '—',
          };
        });
        html = buildAttendancePdfHtml({
          className: classData.name,
          subject: classData.subject,
          periodLabel,
          scopeLabel,
          isSingleDayClass: true,
          isSingleStudent: false,
          dayRows,
        });
      } else {
        const aggRows = roster.map((s) => {
          let p = 0;
          let l = 0;
          let a = 0;
          for (const r of inRange) {
            const ent = r.entries.find((e) => e.studentId === s.id);
            if (!ent) continue;
            if (ent.status === 'present') p++;
            else if (ent.status === 'late') l++;
            else a++;
          }
          const marked = p + l + a;
          const rate =
            marked === 0 ? '—' : `${Math.round(((p + l) / marked) * 100)}%`;
          return { name: s.name, email: s.email, p, l, a, rate };
        });
        html = buildAttendancePdfHtml({
          className: classData.name,
          subject: classData.subject,
          periodLabel,
          scopeLabel,
          isSingleDayClass: false,
          isSingleStudent: false,
          aggRows,
        });
      }

      const { filePath } = await generatePDF({
        html,
        fileName: safePdfName(classData.name),
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
        title: 'Attendance report',
        subject: `${classData.name} — attendance`,
        failOnCancel: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (__DEV__) console.warn('Attendance PDF', e);
      showError('Could not create PDF', msg);
    } finally {
      setDownloading(false);
    }
  }, [
    roster,
    history,
    startKey,
    endKey,
    periodLabel,
    classData.name,
    classData.subject,
    scope,
    selectedStudentId,
    filteredStudents,
    showError,
    showWarning,
  ]);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.sectionTitle}>Attendance report</Text>
      <Text style={styles.lead}>
        Choose a period, optionally one student, then download a PDF.
      </Text>

      <Text style={styles.fieldLab}>Period</Text>
      <View style={styles.chips}>
        {(
          [
            ['day', 'Day'],
            ['week', 'Week'],
            ['month', 'Month'],
            ['custom', 'Custom'],
          ] as const
        ).map(([id, lab]) => (
          <Pressable
            key={id}
            style={[styles.chip, periodMode === id && styles.chipOn]}
            onPress={() => {
              setPeriodMode(id);
              if (id === 'month') {
                setAnchorDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), 1));
              }
            }}
          >
            <Text style={[styles.chipTxt, periodMode === id && styles.chipTxtOn]}>{lab}</Text>
          </Pressable>
        ))}
      </View>

      {periodMode === 'custom' ? (
        <View style={styles.dateRow}>
          <Pressable style={styles.dateBtn} onPress={() => openPicker('rangeFrom')}>
            <Text style={styles.dateBtnLab}>From</Text>
            <Text style={styles.dateBtnVal}>{localDateKey(rangeFrom)}</Text>
          </Pressable>
          <Pressable style={styles.dateBtn} onPress={() => openPicker('rangeTo')}>
            <Text style={styles.dateBtnLab}>To</Text>
            <Text style={styles.dateBtnVal}>{localDateKey(rangeTo)}</Text>
          </Pressable>
        </View>
      ) : periodMode === 'week' ? (
        <View style={styles.periodBlock}>
          <Text style={styles.periodBlockTitle}>Week period</Text>
          <View style={styles.dateRow}>
            <Pressable style={styles.dateBtn} onPress={() => openPicker('anchor')}>
              <Text style={styles.dateBtnLab}>Start</Text>
              <Text style={styles.dateBtnVal}>{formatMediumDate(weekRange.mon)}</Text>
            </Pressable>
            <Pressable style={styles.dateBtn} onPress={() => openPicker('anchor')}>
              <Text style={styles.dateBtnLab}>End</Text>
              <Text style={styles.dateBtnVal}>{formatMediumDate(weekRange.sun)}</Text>
            </Pressable>
          </View>
          <Text style={styles.periodHint}>Tap either date to choose a day in that week (Mon–Sun).</Text>
        </View>
      ) : periodMode === 'month' ? (
        <View style={styles.periodBlock}>
          <Pressable style={styles.dateBtnFull} onPress={() => setMonthModalOpen(true)}>
            <Text style={styles.dateBtnLab}>Month</Text>
            <Text style={styles.dateBtnVal}>
              {anchorDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </Text>
          </Pressable>
          <Text style={styles.periodHint}>
            January through December for {monthYear}. The sheet opens with your month centered.
          </Text>
        </View>
      ) : (
        <Pressable
          style={[styles.dateBtnFull, styles.dateBtnFullSpaced]}
          onPress={() => openPicker('anchor')}
        >
          <Text style={styles.dateBtnLab}>Date</Text>
          <Text style={styles.dateBtnVal}>{localDateKey(anchorDate)}</Text>
        </Pressable>
      )}

      <Text style={styles.fieldLab}>Who</Text>
      <View style={styles.chips}>
        <Pressable
          style={[styles.chip, scope === 'all' && styles.chipOn]}
          onPress={() => {
            setScope('all');
            setSelectedStudentId(null);
          }}
        >
          <Text style={[styles.chipTxt, scope === 'all' && styles.chipTxtOn]}>Entire class</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, scope === 'one' && styles.chipOn]}
          onPress={() => {
            setScope('one');
            if (!selectedStudentId && filteredStudents[0]) {
              setSelectedStudentId(filteredStudents[0].id);
            }
          }}
        >
          <Text style={[styles.chipTxt, scope === 'one' && styles.chipTxtOn]}>One student</Text>
        </Pressable>
      </View>

      {scope === 'one' ? (
        <>
          <TextInput
            style={styles.search}
            placeholder="Search name or email…"
            placeholderTextColor="#94A3B8"
            value={studentQuery}
            onChangeText={setStudentQuery}
          />
          <View style={styles.pickList}>
            {filteredStudents.slice(0, 8).map((s) => (
              <Pressable
                key={s.id}
                style={[styles.pickRow, selectedStudentId === s.id && styles.pickRowOn]}
                onPress={() => setSelectedStudentId(s.id)}
              >
                <Text style={styles.pickName} numberOfLines={1}>
                  {s.name}
                </Text>
                {s.email ? (
                  <Text style={styles.pickEmail} numberOfLines={1}>
                    {s.email}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <Pressable
        style={[styles.downloadRow, downloading && styles.downloadRowDisabled]}
        onPress={exportPdf}
        disabled={downloading}
        android_ripple={{ color: 'rgba(160,96,255,0.15)' }}
      >
        {downloading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <DownloadIcon size={22} color={theme.primary} />
        )}
        <Text style={styles.downloadTxt}>Download PDF</Text>
      </Pressable>

      {androidOpen ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          onChange={onAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setIosOpen(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Select date</Text>
              <DateTimePicker
                value={iosTemp}
                mode="date"
                display="spinner"
                themeVariant="light"
                onChange={(_, d) => d && setIosTemp(d)}
              />
              <View style={styles.modalActions}>
                <Pressable style={styles.modalBtnGhost} onPress={() => setIosOpen(false)}>
                  <Text style={styles.modalBtnGhostTxt}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalBtn} onPress={applyIosDate}>
                  <Text style={styles.modalBtnTxt}>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      <Modal
        visible={monthModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMonthModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMonthModalOpen(false)}>
          <Pressable style={styles.monthSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select month</Text>
            <Text style={styles.monthSheetSub}>
              January–December {monthYear} · current choice stays centered
            </Text>
            <FlatList
              ref={monthListRef}
              style={styles.monthScroll}
              data={monthOptions}
              keyExtractor={(item) => `${item.getFullYear()}-${item.getMonth()}`}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: MONTH_ROW_HEIGHT,
                offset: MONTH_ROW_HEIGHT * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  monthListRef.current?.scrollToOffset({
                    offset: info.index * MONTH_ROW_HEIGHT,
                    animated: false,
                  });
                }, 120);
              }}
              renderItem={({ item: opt }) => {
                const selected =
                  opt.getFullYear() === anchorDate.getFullYear() &&
                  opt.getMonth() === anchorDate.getMonth();
                return (
                  <Pressable
                    style={[styles.monthRow, selected && styles.monthRowOn]}
                    onPress={() => {
                      setAnchorDate(new Date(opt.getFullYear(), opt.getMonth(), 1));
                      setMonthModalOpen(false);
                    }}
                  >
                    <Text style={[styles.monthRowTxt, selected && styles.monthRowTxtOn]}>
                      {opt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </Text>
                  </Pressable>
                );
              }}
            />
            <Pressable style={styles.monthDismiss} onPress={() => setMonthModalOpen(false)}>
              <Text style={styles.modalBtnGhostTxt}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ClassDetailsAttendanceReport;
