import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import {
  useClasses,
  ClassData,
  type SchoolTypeOption,
  type ClassStudentRecord,
} from '../context/ClassesContext';
import Svg, { Path } from 'react-native-svg';
import { useCreateClassStyles } from './useCreateClassStyles';
import { PulseScrollView } from '../components/PulseScrollView';
import { usePulseAlert } from '../context/AlertModalContext';
import BackButton from '../components/Reusable-Components/BackButton';
import { parseStudentCsvRows as parseCsvRows } from '../utils/parseStudentCsv';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateClass'>;

interface Student {
  id: string;
  name: string;
  email?: string;
  rollNumber?: string;
}

const SCHOOL_TYPES: SchoolTypeOption[] = ['School', 'College', 'University', 'Others'];

/** Mon–Sun ids 1–7 for chip state */
const WEEK_CHIPS: { id: number; label: string }[] = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' },
];

const DAY_ID_TO_LABEL: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatScheduleFromSelection(dayIds: number[], start: Date, end: Date): string {
  const sorted = [...new Set(dayIds)].sort((a, b) => a - b);
  const dayPart = sorted.map((id) => DAY_ID_TO_LABEL[id] ?? '').filter(Boolean).join(', ');
  const range = `${formatTime(start)} – ${formatTime(end)}`;
  return dayPart ? `${dayPart} · ${range}` : range;
}

/** K–12 only when School type is selected */
const GRADE_LEVELS_SCHOOL: string[] = [
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

const GRADE_LEVELS_COLLEGE: string[] = [
  '1st year',
  '2nd year',
  '3rd year',
  '4th year',
  'Graduate / PG',
  'Certificate / Diploma',
];

const GRADE_LEVELS_UNIVERSITY: string[] = [
  'UG — Year 1',
  'Year 2',
  'Year 3',
  'Year 4 / Honours',
  "Master's",
  'Doctoral',
  'Postdoctoral',
];

const GRADE_LEVELS_OTHERS: string[] = [
  'General',
  'Mixed levels',
  'Adult / continuing education',
  'Professional',
  'Not specified',
];

type ScheduleBlock = {
  id: string;
  dayIds: number[];
  start: Date;
  end: Date;
};

function newScheduleBlock(id: string): ScheduleBlock {
  const start = new Date();
  start.setHours(9, 0, 0, 0);
  const end = new Date();
  end.setHours(10, 0, 0, 0);
  return { id, dayIds: [], start, end };
}

function timeToMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

const XIcon = ({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CreateClass: React.FC<Props> = ({ navigation }) => {
  const { styles, ink, theme } = useCreateClassStyles();
  const PlusIcon = ({ size = 20, color = theme.white }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
  const UserIcon = ({ size = 20, color = theme.white }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const { addClass } = useClasses();
  const { showAlert, showSuccess } = usePulseAlert();

  const [schoolName, setSchoolName] = useState('');
  const [schoolType, setSchoolType] = useState<SchoolTypeOption>('School');
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>(() => [newScheduleBlock('block-0')]);
  /** Which block + start/end the time picker is editing */
  const [editingTime, setEditingTime] = useState<{ blockId: string; field: 'start' | 'end' } | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [androidTimeOpen, setAndroidTimeOpen] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvPaste, setCsvPaste] = useState('');

  const gradeLevelOptions = useMemo((): string[] => {
    switch (schoolType) {
      case 'School':
        return GRADE_LEVELS_SCHOOL;
      case 'College':
        return GRADE_LEVELS_COLLEGE;
      case 'University':
        return GRADE_LEVELS_UNIVERSITY;
      case 'Others':
        return GRADE_LEVELS_OTHERS;
      default:
        return GRADE_LEVELS_SCHOOL;
    }
  }, [schoolType]);

  useEffect(() => {
    setGradeLevel('');
  }, [schoolType]);

  const activeBlockForPicker = editingTime
    ? scheduleBlocks.find((b) => b.id === editingTime.blockId)
    : undefined;
  const pickerValue =
    activeBlockForPicker && editingTime
      ? editingTime.field === 'start'
        ? activeBlockForPicker.start
        : activeBlockForPicker.end
      : (() => {
          const d = new Date();
          d.setHours(9, 0, 0, 0);
          return d;
        })();

  const setPickerTime = (d: Date) => {
    if (!editingTime) return;
    setScheduleBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== editingTime.blockId) return b;
        return editingTime.field === 'start' ? { ...b, start: d } : { ...b, end: d };
      }),
    );
  };

  /** At most one day per meeting block; tap the same day again to clear. */
  const toggleDayInBlock = (blockId: string, dayId: number) => {
    setScheduleBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        if (b.dayIds.length === 1 && b.dayIds[0] === dayId) {
          return { ...b, dayIds: [] };
        }
        return { ...b, dayIds: [dayId] };
      }),
    );
  };

  const addScheduleBlock = () => {
    setScheduleBlocks((prev) => [...prev, newScheduleBlock(`block-${Date.now()}`)]);
  };

  const removeScheduleBlock = (blockId: string) => {
    setScheduleBlocks((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.id !== blockId)));
  };

  const handleAddStudent = () => {
    if (!studentName.trim()) {
      showAlert({
        variant: 'warning',
        title: 'Name required',
        message: 'Enter a student name before adding.',
      });
      return;
    }
    const roll = studentRoll.trim();
    const newStudent: Student = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: studentName.trim(),
      email: studentEmail.trim() || undefined,
      rollNumber: roll || undefined,
    };
    setStudents((s) => [...s, newStudent]);
    setStudentName('');
    setStudentEmail('');
    setStudentRoll('');
  };

  const handleRemoveStudent = (studentId: string) => {
    setStudents((s) => s.filter((x) => x.id !== studentId));
  };

  const handleImportCsv = () => {
    const rows = parseCsvRows(csvPaste);
    if (rows.length === 0) {
      showAlert({
        variant: 'warning',
        title: 'No rows found',
        message: 'Paste CSV lines with name and optional email, separated by commas.',
      });
      return;
    }
    const added = rows.map((r, i) => ({
      id: `csv-${Date.now()}-${i}`,
      name: r.name,
      email: r.email,
      rollNumber: r.rollNumber,
    }));
    setStudents((s) => [...s, ...added]);
    setCsvPaste('');
    setCsvModalOpen(false);
    showAlert({
      variant: 'success',
      title: 'Imported',
      message: `Added ${added.length} student${added.length === 1 ? '' : 's'} from CSV.`,
    });
  };

  const onAndroidTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    setAndroidTimeOpen(false);
    if (event.type === 'set' && date) {
      setPickerTime(date);
    }
    setEditingTime(null);
  };

  const openTimePicker = (blockId: string, field: 'start' | 'end') => {
    Keyboard.dismiss();
    setEditingTime({ blockId, field });
    if (Platform.OS === 'android') {
      setAndroidTimeOpen(true);
    } else {
      setShowTimeModal(true);
    }
  };

  const handleCreate = async () => {
    if (!schoolName.trim() || !className.trim() || !subject.trim() || !gradeLevel) {
      showAlert({
        variant: 'warning',
        title: 'Missing class details',
        message: 'Please enter school name, class name, subject, and grade level.',
      });
      return;
    }
    for (let i = 0; i < scheduleBlocks.length; i++) {
      const b = scheduleBlocks[i];
      if (b.dayIds.length === 0) {
        showAlert({
          variant: 'warning',
          title: 'Schedule',
          message:
            scheduleBlocks.length > 1
              ? `Meeting time ${i + 1}: select at least one day, or remove that block.`
              : 'Select at least one day your class meets.',
        });
        return;
      }
      if (timeToMinutes(b.end) <= timeToMinutes(b.start)) {
        showAlert({
          variant: 'warning',
          title: 'End time',
          message:
            scheduleBlocks.length > 1
              ? `Meeting time ${i + 1}: end time must be after start time.`
              : 'End time must be after start time.',
        });
        return;
      }
    }
    if (students.length === 0) {
      showAlert({
        variant: 'warning',
        title: 'Students required',
        message: 'Add at least one student, or import a CSV, before creating the class.',
      });
      return;
    }
    const scheduleStr = scheduleBlocks
      .map((b) => formatScheduleFromSelection(b.dayIds, b.start, b.end))
      .join(' | ');

    const roster: ClassStudentRecord[] = students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      rollNumber: s.rollNumber,
    }));

    const newClass: ClassData = {
      id: Date.now().toString(),
      name: className.trim(),
      subject: subject.trim(),
      gradeLevel,
      studentCount: students.length,
      schedule: scheduleStr,
      schoolName: schoolName.trim(),
      schoolType,
      students: roster,
      createdAt: new Date().toISOString(),
    };

    await addClass(newClass);

    showSuccess(
      'Class created',
      `${newClass.name} is ready with ${students.length} student${students.length === 1 ? '' : 's'}.`,
      () => navigation.goBack(),
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Create new class
          </Text>
        </View>
      </View>

      <PulseScrollView
        customTrack={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.section, styles.sectionFirst]}>
          <Text style={styles.sectionEyebrow}>School</Text>
          <View style={styles.field}>
            <Text style={styles.label}>School name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Westside Academy"
              placeholderTextColor={ink.placeholder}
              value={schoolName}
              onChangeText={setSchoolName}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>School type *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gradeScrollContent}
            >
              {SCHOOL_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.gradeChip, schoolType === type && styles.gradeChipOn]}
                  onPress={() => setSchoolType(type)}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <Text style={[styles.gradeChipTxt, schoolType === type && styles.gradeChipTxtOn]}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>
              {schoolType === 'School' ? 'Grade level (K–12) *' : 'Level / year *'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gradeScrollContent}
            >
              {gradeLevelOptions.map((grade) => (
                <Pressable
                  key={grade}
                  style={[styles.gradeChip, gradeLevel === grade && styles.gradeChipOn]}
                  onPress={() => setGradeLevel(grade)}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <Text style={[styles.gradeChipTxt, gradeLevel === grade && styles.gradeChipTxtOn]}>
                    {grade}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Basics</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Class name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mathematics 101"
              placeholderTextColor={ink.placeholder}
              value={className}
              onChangeText={setClassName}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mathematics"
              placeholderTextColor={ink.placeholder}
              value={subject}
              onChangeText={setSubject}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Schedule</Text>
          <Text style={styles.sectionLead}>
            Add one or more meeting times. Pick a single day per block, then set the hours. Use
            &quot;Add another meeting time&quot; for more days (e.g. Mon 9–10 AM and Thu 2–3 PM).
          </Text>

          {scheduleBlocks.map((block, blockIndex) => (
            <View key={block.id} style={styles.scheduleBlock}>
              {scheduleBlocks.length > 1 ? (
                <View style={styles.scheduleBlockHeader}>
                  <Text style={styles.scheduleBlockTitle}>Meeting time {blockIndex + 1}</Text>
                  <Pressable
                    onPress={() => removeScheduleBlock(block.id)}
                    hitSlop={8}
                    android_ripple={{ color: ink.pressTint }}
                  >
                    <Text style={styles.scheduleBlockRemove}>Remove</Text>
                  </Pressable>
                </View>
              ) : null}

              <Text style={styles.label}>Days *</Text>
              <View style={styles.dayGrid}>
                {WEEK_CHIPS.map(({ id, label }) => {
                  const on = block.dayIds.includes(id);
                  return (
                    <Pressable
                      key={id}
                      style={[styles.dayChip, on && styles.dayChipOn]}
                      onPress={() => toggleDayInBlock(block.id, id)}
                      android_ripple={{ color: theme.rippleLight }}
                    >
                      <Text style={[styles.dayChipTxt, on && styles.dayChipTxtOn]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, styles.labelSpaced]}>Start time *</Text>
              <Pressable
                style={styles.timeTrigger}
                onPress={() => openTimePicker(block.id, 'start')}
                android_ripple={{ color: ink.pressTint }}
              >
                <Text style={styles.timeTriggerLabel}>Start</Text>
                <Text style={styles.timeTriggerValue}>{formatTime(block.start)}</Text>
                <Text style={styles.timeTriggerHint}>Tap to change</Text>
              </Pressable>

              <Text style={[styles.label, styles.labelSpaced]}>End time *</Text>
              <Pressable
                style={styles.timeTrigger}
                onPress={() => openTimePicker(block.id, 'end')}
                android_ripple={{ color: ink.pressTint }}
              >
                <Text style={styles.timeTriggerLabel}>End</Text>
                <Text style={styles.timeTriggerValue}>{formatTime(block.end)}</Text>
                <Text style={styles.timeTriggerHint}>Tap to change</Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            style={styles.addMeetingBtn}
            onPress={addScheduleBlock}
            android_ripple={{ color: ink.pressTint }}
          >
            <Text style={styles.addMeetingBtnTxt}>+ Add another meeting time</Text>
          </Pressable>

          {Platform.OS === 'android' && androidTimeOpen && editingTime && (
            <DateTimePicker
              value={pickerValue}
              mode="time"
              display="default"
              onChange={onAndroidTimeChange}
            />
          )}

          {Platform.OS === 'ios' && (
            <Modal visible={showTimeModal} transparent animationType="fade">
              <TouchableWithoutFeedback
                onPress={() => {
                  setShowTimeModal(false);
                  setEditingTime(null);
                }}
              >
                <View style={styles.modalBackdrop}>
                  <TouchableWithoutFeedback>
                    <View style={styles.timeSheet}>
                      <Text style={styles.timeSheetTitle}>
                        {editingTime?.field === 'end' ? 'End time' : 'Start time'}
                      </Text>
                      <DateTimePicker
                        value={pickerValue}
                        mode="time"
                        display="spinner"
                        themeVariant="light"
                        onChange={(_, d) => d && setPickerTime(d)}
                        style={styles.iosPicker}
                      />
                      <Pressable
                        style={styles.timeSheetDone}
                        onPress={() => {
                          setShowTimeModal(false);
                          setEditingTime(null);
                        }}
                        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                      >
                        <Text style={styles.timeSheetDoneTxt}>Done</Text>
                      </Pressable>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}
        </View>

        <View style={styles.studentsSection}>
          <Text style={styles.sectionEyebrow}>Students *</Text>
          <Text style={styles.sectionLead}>
            Add at least one student. You can type them in, or paste / import a CSV list.
          </Text>

          <View style={styles.studentActions}>
            <Pressable
              style={styles.csvBtn}
              onPress={() => setCsvModalOpen(true)}
              android_ripple={{ color: ink.pressTint }}
            >
              <Text style={styles.csvBtnTxt}>Import CSV</Text>
            </Pressable>
          </View>

          <Text style={styles.subLabel}>Add manually</Text>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, styles.addInput]}
              placeholder="Student name"
              placeholderTextColor={ink.placeholder}
              value={studentName}
              onChangeText={setStudentName}
            />
            <TextInput
              style={[styles.input, styles.addInputNarrow]}
              placeholder="Roll (opt.)"
              placeholderTextColor={ink.placeholder}
              value={studentRoll}
              onChangeText={setStudentRoll}
              maxLength={16}
            />
            <TextInput
              style={[styles.input, styles.addInput]}
              placeholder="Email (optional)"
              placeholderTextColor={ink.placeholder}
              value={studentEmail}
              onChangeText={setStudentEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Pressable
              style={styles.addCircle}
              onPress={handleAddStudent}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <PlusIcon size={22} color={theme.white} />
            </Pressable>
          </View>

          {students.length > 0 && (
            <View style={styles.roster}>
              <Text style={styles.rosterTitle}>Roster ({students.length})</Text>
              {students.map((student) => (
                <View key={student.id} style={styles.studentRow}>
                  <View style={styles.studentLeft}>
                    <View style={styles.avatar}>
                      <UserIcon size={16} color={theme.white} />
                    </View>
                    <View style={styles.studentTxt}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {student.rollNumber ? `#${student.rollNumber} ` : ''}
                        {student.name}
                      </Text>
                      {student.email ? (
                        <Text style={styles.studentEmail} numberOfLines={1}>
                          {student.email}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Pressable
                    hitSlop={8}
                    onPress={() => handleRemoveStudent(student.id)}
                    android_ripple={{ color: 'rgba(220,38,38,0.12)', borderless: true }}
                  >
                    <XIcon size={18} color="#DC2626" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <Pressable
          style={styles.createBtn}
          onPress={handleCreate}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <Text style={styles.createBtnTxt}>Create class</Text>
        </Pressable>
        <View style={styles.bottomPad} />
      </PulseScrollView>

      <Modal visible={csvModalOpen} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setCsvModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.csvSheet}>
                <Text style={styles.csvSheetTitle}>Import from CSV</Text>
                <Text style={styles.csvBulkHeading}>Adding students in bulk</Text>
                <Text style={styles.csvBulkBody}>
                  Paste a full class list at once instead of typing each student. Each line below
                  becomes one roster entry—useful for spreadsheet exports or copying from another class.
                </Text>
                <Text style={styles.csvFormatLabel}>Format</Text>
                <Text style={styles.csvSheetHelp}>
                  One student per line: <Text style={styles.csvMono}>Name, email</Text>. Email is optional.
                  Optional header row with “name” and “email” is supported.
                </Text>
                <TextInput
                  style={styles.csvTextarea}
                  multiline
                  placeholder={'Jamie Lee, jamie@school.edu\nAlex Kim, alex.kim@school.edu'}
                  placeholderTextColor={ink.placeholder}
                  value={csvPaste}
                  onChangeText={setCsvPaste}
                  textAlignVertical="top"
                />
                <View style={styles.csvActions}>
                  <Pressable style={styles.csvCancel} onPress={() => setCsvModalOpen(false)}>
                    <Text style={styles.csvCancelTxt}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.csvConfirm} onPress={handleImportCsv}>
                    <Text style={styles.csvConfirmTxt}>Add to roster</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default CreateClass;
