import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Platform,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useClasses, type ClassStudentRecord } from '../context/ClassesContext';
import { parseStudentCsvRows } from '../utils/parseStudentCsv';
import {
  formatBulkRollIndex,
  validateBulkRollAssignments,
  type BulkRollPattern,
} from '../utils/bulkRollNumberFormat';
import { usePulseAlert } from '../context/AlertModalContext';
import { PulseScrollView } from '../components/PulseScrollView';
import { useViewStudentsStyles } from './useViewStudentsStyles';
import BackButton from '../components/Reusable-Components/BackButton';
import Svg, { Path } from 'react-native-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'ViewStudents'>;

const TrashIcon = ({ size = 20, color = '#DC2626' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6H5H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
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

const ViewStudents: React.FC<Props> = ({ route, navigation }) => {
  const { styles, ink, theme } = useViewStudentsStyles();
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
  const PlusIcon = ({ size = 22, color = theme.white }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
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

  const { classId } = route.params;
  const { classes, updateClass } = useClasses();
  const { showAlert, showSuccess, showError } = usePulseAlert();

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvPaste, setCsvPaste] = useState('');
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [assignEveryoneOpen, setAssignEveryoneOpen] = useState(false);
  const [bulkOrder, setBulkOrder] = useState<'roster' | 'name'>('roster');
  const [assignPrefix, setAssignPrefix] = useState('');
  const [assignSuffix, setAssignSuffix] = useState('');
  const [assignStart, setAssignStart] = useState('1');
  const [assignStep, setAssignStep] = useState('1');
  const [assignPad, setAssignPad] = useState('0');

  const classData = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);
  const roster: ClassStudentRecord[] = classData?.students ?? [];

  const filteredRoster = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)),
    );
  }, [roster, search]);

  const allVisibleSelected =
    filteredRoster.length > 0 && filteredRoster.every((s) => selectedIds.has(s.id));

  const selectedCount = selectedIds.size;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    if (filteredRoster.length === 0) return;
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const n = new Set(prev);
        filteredRoster.forEach((s) => n.delete(s.id));
        return n;
      });
    } else {
      setSelectedIds((prev) => {
        const n = new Set(prev);
        filteredRoster.forEach((s) => n.add(s.id));
        return n;
      });
    }
  }, [filteredRoster, allVisibleSelected]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const persistRoster = useCallback(
    (next: ClassStudentRecord[]) => {
      if (!classData) return;
      void updateClass(classData.id, {
        students: next,
        studentCount: next.length,
      });
    },
    [classData, updateClass],
  );

  const openAssignEveryone = useCallback(() => {
    setBulkOrder('roster');
    setAssignPrefix('');
    setAssignSuffix('');
    setAssignStart('1');
    setAssignStep('1');
    setAssignPad('0');
    setAssignEveryoneOpen(true);
  }, []);

  const rosterOrderedForBulk = useMemo(() => {
    if (bulkOrder === 'name') {
      return [...roster].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...roster];
  }, [roster, bulkOrder]);

  const bulkAssignPreview = useMemo(() => {
    const start = parseInt(assignStart.trim(), 10);
    const step = parseInt(assignStep.trim(), 10);
    const pad = parseInt(assignPad.trim(), 10);
    if (
      Number.isNaN(start) ||
      Number.isNaN(step) ||
      step === 0 ||
      Number.isNaN(pad) ||
      pad < 0
    ) {
      return null;
    }
    const pattern: BulkRollPattern = {
      prefix: assignPrefix,
      suffix: assignSuffix,
      start,
      step,
      padLength: pad,
    };
    const n = Math.min(3, rosterOrderedForBulk.length);
    if (n === 0) return null;
    const samples = [];
    for (let i = 0; i < n; i++) {
      samples.push(formatBulkRollIndex(pattern, i));
    }
    return { samples, total: rosterOrderedForBulk.length };
  }, [
    rosterOrderedForBulk,
    assignPrefix,
    assignSuffix,
    assignStart,
    assignStep,
    assignPad,
  ]);

  const runBulkAssign = useCallback(() => {
    if (roster.length === 0) return;
    const start = parseInt(assignStart.trim(), 10);
    const step = parseInt(assignStep.trim(), 10);
    const pad = parseInt(assignPad.trim(), 10);
    const pattern: BulkRollPattern = {
      prefix: assignPrefix.trim(),
      suffix: assignSuffix.trim(),
      start,
      step,
      padLength: pad,
    };
    const ordered =
      bulkOrder === 'name'
        ? [...roster].sort((a, b) => a.name.localeCompare(b.name))
        : [...roster];
    const validated = validateBulkRollAssignments(ordered.length, pattern);
    if (!validated.ok) {
      showError('Check your format', validated.message);
      return;
    }
    const rollById = new Map<string, string>();
    ordered.forEach((s, i) => rollById.set(s.id, validated.rolls[i]!));
    const next = roster.map((s) => ({
      ...s,
      rollNumber: rollById.get(s.id),
    }));
    persistRoster(next);
    setAssignEveryoneOpen(false);
    showSuccess(
      'Roll numbers assigned',
      `Updated ${ordered.length} student${ordered.length === 1 ? '' : 's'}.`,
    );
  }, [
    roster,
    bulkOrder,
    assignPrefix,
    assignSuffix,
    assignStart,
    assignStep,
    assignPad,
    showError,
    showSuccess,
    persistRoster,
  ]);

  const confirmBulkAssign = useCallback(() => {
    if (roster.length === 0) return;
    const start = parseInt(assignStart.trim(), 10);
    const step = parseInt(assignStep.trim(), 10);
    const pad = parseInt(assignPad.trim(), 10);
    const pattern: BulkRollPattern = {
      prefix: assignPrefix.trim(),
      suffix: assignSuffix.trim(),
      start,
      step,
      padLength: pad,
    };
    const ordered =
      bulkOrder === 'name'
        ? [...roster].sort((a, b) => a.name.localeCompare(b.name))
        : [...roster];
    const validated = validateBulkRollAssignments(ordered.length, pattern);
    if (!validated.ok) {
      showError('Check your format', validated.message);
      return;
    }
    showAlert({
      variant: 'warning',
      title: 'Assign roll numbers to everyone?',
      message: `This replaces roll numbers for all ${ordered.length} students in this class. Students without a roll today will get one; existing rolls will be overwritten.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Assign everyone', style: 'default', onPress: () => runBulkAssign() },
      ],
    });
  }, [
    roster.length,
    roster,
    bulkOrder,
    assignPrefix,
    assignSuffix,
    assignStart,
    assignStep,
    assignPad,
    showAlert,
    showError,
    runBulkAssign,
  ]);

  const openAddMenu = () => {
    setAddMenuOpen(true);
  };

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
    if (!classData) return;
    const rows = parseStudentCsvRows(csvPaste);
    if (rows.length === 0) {
      showError('No rows found', 'Paste CSV lines with name and optional email, separated by commas.');
      return;
    }
    const added: ClassStudentRecord[] = rows.map((r) => ({
      id: newStudentId(),
      name: r.name,
      email: r.email,
    }));
    persistRoster([...roster, ...added]);
    setCsvPaste('');
    setCsvOpen(false);
    showSuccess(
      'Imported',
      `Added ${added.length} student${added.length === 1 ? '' : 's'} from CSV.`,
    );
  };

  const submitAdd = () => {
    if (!classData) return;
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
    const next = [...roster, row];
    persistRoster(next);
    setAddOpen(false);
    showSuccess('Student added', `${name} was added to the class.`);
  };

  const confirmDeleteSelected = () => {
    if (!classData || selectedCount === 0) return;
    showAlert({
      variant: 'warning',
      title: selectedCount === 1 ? 'Remove student?' : `Remove ${selectedCount} students?`,
      message:
        'They will be removed from this class roster. Grade links for this class may need review.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const next = roster.filter((s) => !selectedIds.has(s.id));
            persistRoster(next);
            clearSelection();
            showSuccess('Removed', 'Roster updated.');
          },
        },
      ],
    });
  };

  if (!classData) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Students
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Class not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          Students
        </Text>
        <Pressable
          style={({ pressed }) => [styles.headerAddBtn, pressed && styles.headerAddBtnPressed]}
          onPress={openAddMenu}
          accessibilityLabel="Add student or import from CSV"
        >
          <PlusIcon size={22} color={theme.white} />
        </Pressable>
      </View>

      <PulseScrollView
        customTrack={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Text style={styles.className}>{classData.name}</Text>
          <Text style={styles.heroMeta}>
            {roster.length === 0
              ? 'No students on roster yet — add names below.'
              : `${roster.length} student${roster.length === 1 ? '' : 's'} on roster`}
            {search.trim() ? ` · ${filteredRoster.length} match search` : ''}
          </Text>
        </View>

        <View style={styles.toolbar}>
          <Pressable
            style={({ pressed }) => [
              styles.toolBtn,
              styles.toolBtnOutline,
              filteredRoster.length === 0 && styles.toolBtnDisabled,
              pressed && filteredRoster.length > 0 && styles.toolBtnPressed,
            ]}
            onPress={toggleSelectAllVisible}
            disabled={filteredRoster.length === 0}
          >
            <Text
              style={[
                styles.toolBtnTxt,
                filteredRoster.length === 0 && styles.toolBtnTxtDisabled,
              ]}
            >
              {allVisibleSelected ? 'Deselect visible' : 'Select all'}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.toolBtn,
              styles.toolBtnOutline,
              selectedCount === 0 && styles.toolBtnDisabled,
              pressed && selectedCount > 0 && styles.toolBtnPressed,
            ]}
            onPress={clearSelection}
            disabled={selectedCount === 0}
          >
            <Text style={[styles.toolBtnTxt, selectedCount === 0 && styles.toolBtnTxtDisabled]}>
              Clear selection
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.toolBtn,
              styles.toolBtnDanger,
              selectedCount === 0 && styles.toolBtnDisabled,
              pressed && selectedCount > 0 && styles.toolBtnPressed,
            ]}
            onPress={confirmDeleteSelected}
            disabled={selectedCount === 0}
          >
            <TrashIcon size={18} color={selectedCount === 0 ? ink.inkSoft : '#DC2626'} />
            <Text
              style={[
                styles.toolBtnTxtDanger,
                selectedCount === 0 && styles.toolBtnTxtDisabled,
              ]}
            >
              Delete
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <SearchIcon size={20} color={ink.inkSoft} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email…"
            placeholderTextColor={ink.placeholder}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable
          style={styles.addWideBtn}
          onPress={openAddMenu}
          android_ripple={{ color: theme.rippleLight }}
          accessibilityLabel="Add student or import from CSV"
        >
          <PlusIcon size={20} color={theme.white} />
          <Text style={styles.addWideBtnTxt}>Add student</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.assignEveryoneBtn,
            roster.length === 0 && styles.assignEveryoneBtnDisabled,
            pressed && roster.length > 0 && styles.assignEveryoneBtnPressed,
          ]}
          onPress={openAssignEveryone}
          disabled={roster.length === 0}
          android_ripple={{ color: ink.pressTint }}
          accessibilityLabel="Assign roll numbers to all students"
        >
          <Text
            style={[
              styles.assignEveryoneBtnTxt,
              roster.length === 0 && styles.toolBtnTxtDisabled,
            ]}
          >
            Assign everyone
          </Text>
        </Pressable>

        {roster.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Build your roster</Text>
            <Text style={styles.emptyBody}>
              {`Tap Add to enter one student or import a list from CSV. Names and emails are saved to this class and used in grades and attendance. After you have a roster, use Assign everyone to set roll numbers for the whole class, or open a student's record to edit one person.`}
            </Text>
          </View>
        ) : filteredRoster.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyBody}>Try a different search term.</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {filteredRoster.map((s, index) => {
              const selected = selectedIds.has(s.id);
              return (
                <View
                  key={s.id}
                  style={[styles.row, index < filteredRoster.length - 1 && styles.rowDivider]}
                >
                  <Pressable
                    onPress={() => toggleSelect(s.id)}
                    hitSlop={8}
                    android_ripple={{ color: theme.rippleLight }}
                    accessibilityLabel={selected ? 'Deselect student' : 'Select student'}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                      {selected ? (
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M20 6L9 17L4 12"
                            stroke={theme.white}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      ) : null}
                    </View>
                  </Pressable>
                  <Pressable
                    style={styles.rowMainPress}
                    onPress={() =>
                      navigation.navigate('StudentRecords', { classId, studentId: s.id })
                    }
                    android_ripple={{ color: theme.rippleLight }}
                    accessibilityLabel={`Open records for ${s.name}`}
                  >
                    <View style={styles.avatar}>
                      <UserIcon size={18} color={theme.white} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.name} numberOfLines={2}>
                        {s.rollNumber ? `#${s.rollNumber} ` : ''}
                        {s.name}
                      </Text>
                      {s.email ? (
                        <Text style={styles.email} numberOfLines={1}>
                          {s.email}
                        </Text>
                      ) : (
                        <Text style={styles.emailMuted}>No email</Text>
                      )}
                    </View>
                    <Text style={styles.rowChevron}>›</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </PulseScrollView>

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

      <Modal
        visible={assignEveryoneOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAssignEveryoneOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalDimmer} onPress={() => setAssignEveryoneOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCenter}
            pointerEvents="box-none"
          >
            <View style={styles.assignModalCard}>
              <ScrollView
                style={styles.assignScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>Assign everyone</Text>
                <Text style={styles.assignHint}>
                  Set roll numbers for the whole class in one go. Default is simple numbering (1, 2, 3…)
                  in roster order. Add a prefix or suffix, change start and step, or zero-pad digits.
                </Text>

                <Text style={styles.assignSectionLabel}>Order</Text>
                <View style={styles.orderRow}>
                  <Pressable
                    style={[styles.orderChip, bulkOrder === 'roster' && styles.orderChipOn]}
                    onPress={() => setBulkOrder('roster')}
                    android_ripple={{ color: theme.rippleLight }}
                  >
                    <Text style={styles.orderChipTxt}>Roster (top → bottom)</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.orderChip, bulkOrder === 'name' && styles.orderChipOn]}
                    onPress={() => setBulkOrder('name')}
                    android_ripple={{ color: theme.rippleLight }}
                  >
                    <Text style={styles.orderChipTxt}>A–Z by name</Text>
                  </Pressable>
                </View>

                <Text style={styles.inputLabel}>Prefix (optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. GR10- or A-"
                  placeholderTextColor={ink.placeholder}
                  value={assignPrefix}
                  onChangeText={setAssignPrefix}
                  maxLength={12}
                />
                <Text style={styles.inputLabel}>Suffix (optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. -B"
                  placeholderTextColor={ink.placeholder}
                  value={assignSuffix}
                  onChangeText={setAssignSuffix}
                  maxLength={12}
                />
                <Text style={styles.inputLabel}>Start at</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="1"
                  placeholderTextColor={ink.placeholder}
                  value={assignStart}
                  onChangeText={setAssignStart}
                  keyboardType="number-pad"
                />
                <Text style={styles.inputLabel}>Step</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="1"
                  placeholderTextColor={ink.placeholder}
                  value={assignStep}
                  onChangeText={setAssignStep}
                  keyboardType="number-pad"
                />
                <Text style={styles.inputLabel}>Zero-pad length</Text>
                <Text style={[styles.modalHint, { marginBottom: 8 }]}>
                  0 = no padding. 2 turns 1 into 01. Applies to the number part only.
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor={ink.placeholder}
                  value={assignPad}
                  onChangeText={setAssignPad}
                  keyboardType="number-pad"
                />

                <View style={styles.assignPreview}>
                  <Text style={styles.assignPreviewLabel}>Preview</Text>
                  {bulkAssignPreview ? (
                    <Text style={styles.assignPreviewTxt}>
                      {bulkAssignPreview.samples.join(', ')}
                      {bulkAssignPreview.total > bulkAssignPreview.samples.length
                        ? `, … (${bulkAssignPreview.total} total)`
                        : ''}
                    </Text>
                  ) : (
                    <Text style={styles.assignPreviewMuted}>
                      Enter valid start, step, and pad values to preview.
                    </Text>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable style={styles.modalCancel} onPress={() => setAssignEveryoneOpen(false)}>
                  <Text style={styles.modalCancelTxt}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalSave} onPress={confirmBulkAssign}>
                  <Text style={styles.modalSaveTxt}>Apply</Text>
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

export default ViewStudents;
