import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  Platform,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Svg, { Path } from 'react-native-svg';
import type { ClassData } from '../context/ClassesContext';
import { usePulseAlert } from '../context/AlertModalContext';
import { fonts as F, radius, useThemeMode } from '../theme';
import { DEFAULT_CLASS_REMINDER, type ClassReminderSettings } from '../types/classReminder';
import {
  syncClassReminderSchedule,
  cancelClassReminderTriggers,
} from '../services/classReminderNotifications';

type Props = {
  classData: ClassData;
  updateClass: (id: string, updates: Partial<ClassData>) => Promise<void>;
};

const WEEKDAY_CHIPS: { iso: number; label: string }[] = [
  { iso: 1, label: 'Mon' },
  { iso: 2, label: 'Tue' },
  { iso: 3, label: 'Wed' },
  { iso: 4, label: 'Thu' },
  { iso: 5, label: 'Fri' },
  { iso: 6, label: 'Sat' },
  { iso: 7, label: 'Sun' },
];

const BellIcon = ({ size = 20, color }: { size?: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 106 8c0 7-3 7-3 14h18c0-7-3-7-3-14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21a2 2 0 01-3.46 0"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClassReminderSection: React.FC<Props> = ({ classData, updateClass }) => {
  const { ink, theme } = useThemeMode();
  const { showAlert, showSuccess, showWarning } = usePulseAlert();
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [iosDraft, setIosDraft] = useState(() => new Date());

  const reminder = useMemo(
    () => classData.reminder ?? DEFAULT_CLASS_REMINDER,
    [classData.reminder],
  );

  const timeDate = useMemo(() => {
    const d = new Date();
    d.setHours(reminder.hour, reminder.minute, 0, 0);
    return d;
  }, [reminder.hour, reminder.minute]);

  const timeLabel = useMemo(
    () =>
      timeDate.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
    [timeDate],
  );

  const persistReminder = useCallback(
    async (next: ClassReminderSettings): Promise<boolean> => {
      if (next.enabled && !next.weekdays.length) {
        showWarning('Choose days', 'Select at least one weekday for your reminder.');
        return false;
      }
      await updateClass(classData.id, { reminder: next });
      if (next.enabled) {
        try {
          await syncClassReminderSchedule({
            id: classData.id,
            name: classData.name,
            subject: classData.subject,
            gradeLevel: classData.gradeLevel,
            schedule: classData.schedule,
            roomNumber: classData.roomNumber,
            reminder: next,
          });
          return true;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg === 'NOTIFICATION_PERMISSION_DENIED') {
            const off: ClassReminderSettings = { ...next, enabled: false };
            await updateClass(classData.id, { reminder: off });
            await cancelClassReminderTriggers(classData.id);
            showAlert({
              variant: 'warning',
              title: 'Notifications are off',
              message:
                Platform.OS === 'android'
                  ? 'Allow TeachTrack to send notifications in system settings, then turn the reminder on again.'
                  : 'Allow notifications for TeachTrack in Settings, then turn the reminder on again.',
            });
            return false;
          }
          if (msg === 'NOTIFEE_NATIVE_MISSING') {
            const off: ClassReminderSettings = { ...next, enabled: false };
            await updateClass(classData.id, { reminder: off });
            await cancelClassReminderTriggers(classData.id).catch(() => {});
            showAlert({
              variant: 'warning',
              title: 'Rebuild required',
              message:
                'The notification module is not in your current build. Stop Metro, run a clean Android build (e.g. cd android && gradlew clean), then npx react-native run-android again.',
            });
            return false;
          }
          showAlert({
            variant: 'error',
            title: 'Could not schedule reminder',
            message: msg,
          });
          return false;
        }
      } else {
        await cancelClassReminderTriggers(classData.id);
        return true;
      }
    },
    [classData, updateClass, showAlert, showWarning],
  );

  const onToggleEnabled = useCallback(
    async (enabled: boolean) => {
      const base: ClassReminderSettings = {
        ...(classData.reminder ?? DEFAULT_CLASS_REMINDER),
        enabled,
      };
      if (enabled && base.weekdays.length === 0) {
        base.weekdays = [...DEFAULT_CLASS_REMINDER.weekdays];
      }
      const ok = await persistReminder(base);
      if (enabled && ok) {
        const t = new Date();
        t.setHours(base.hour, base.minute, 0, 0);
        const tl = t.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        showSuccess('Reminders on', `Weekly alerts at ${tl} on the days you selected.`);
      } else if (!enabled && ok) {
        showSuccess('Reminders off', 'Scheduled alerts for this class were removed.');
      }
    },
    [classData.reminder, persistReminder, showSuccess],
  );

  const openTimeEditor = useCallback(() => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(true);
    } else {
      setIosDraft(timeDate);
      setShowIosModal(true);
    }
  }, [timeDate]);

  const onAndroidTimeChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      setShowAndroidPicker(false);
      if (event.type !== 'set' || !date) return;
      const next: ClassReminderSettings = {
        ...reminder,
        hour: date.getHours(),
        minute: date.getMinutes(),
      };
      void persistReminder(next);
    },
    [reminder, persistReminder],
  );

  const confirmIosTime = useCallback(() => {
    const next: ClassReminderSettings = {
      ...reminder,
      hour: iosDraft.getHours(),
      minute: iosDraft.getMinutes(),
    };
    setShowIosModal(false);
    void persistReminder(next);
  }, [iosDraft, reminder, persistReminder]);

  const toggleWeekday = useCallback(
    (iso: number) => {
      const set = new Set(reminder.weekdays);
      if (set.has(iso)) set.delete(iso);
      else set.add(iso);
      const weekdays = [...set].sort((a, b) => a - b);
      void persistReminder({ ...reminder, weekdays });
    },
    [reminder, persistReminder],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: 18,
          paddingTop: 18,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(160, 96, 255, 0.35)',
        },
        rowTop: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          paddingRight: 12,
        },
        bellPad: {
          marginRight: 10,
        },
        title: {
          fontSize: 16,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.2,
        },
        sub: {
          fontSize: 13,
          lineHeight: 18,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 14,
        },
        timeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        timeLabel: {
          fontSize: 14,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        timeBtn: {
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: radius.btn,
          backgroundColor: theme.white,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        timeBtnTxt: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: theme.primary,
        },
        daysLabel: {
          fontSize: 12,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginBottom: 8,
        },
        chipsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        chip: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 10,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: theme.white,
        },
        chipOn: {
          backgroundColor: theme.primarySoft,
          borderColor: theme.primary,
        },
        chipTxt: {
          fontSize: 13,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        chipTxtOn: {
          color: theme.primary,
        },
        hint: {
          marginTop: 12,
          fontSize: 12,
          lineHeight: 17,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
        },
        modalRoot: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.45)',
        },
        modalCard: {
          backgroundColor: ink.canvas,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 28,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderBottomWidth: 0,
        },
        modalTitle: {
          fontSize: 17,
          fontFamily: F.outfitBold,
          color: ink.ink,
          marginBottom: 12,
          textAlign: 'center',
        },
        modalActions: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 16,
          gap: 12,
        },
        modalBtnGhost: {
          flex: 1,
          paddingVertical: 14,
          alignItems: 'center',
          borderRadius: radius.btn,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        modalBtnGhostTxt: {
          fontSize: 16,
          fontFamily: F.dmSemi,
          color: ink.ink,
        },
        modalBtnPrimary: {
          flex: 1,
          paddingVertical: 14,
          alignItems: 'center',
          borderRadius: radius.btn,
          backgroundColor: theme.primary,
          borderWidth: ink.borderWidth,
          borderColor: '#000000',
        },
        modalBtnPrimaryTxt: {
          fontSize: 16,
          fontFamily: F.outfitBold,
          color: theme.white,
        },
      }),
    [ink, theme],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.rowTop}>
        <View style={styles.titleRow}>
          <View style={styles.bellPad}>
            <BellIcon color={theme.primary} size={22} />
          </View>
          <Text style={styles.title}>Class reminder</Text>
        </View>
        <Switch
          value={reminder.enabled}
          onValueChange={v => void onToggleEnabled(v)}
          trackColor={{ false: ink.rowDivider, true: theme.primarySoft }}
          thumbColor={
            Platform.OS === 'android'
              ? reminder.enabled
                ? theme.primary
                : ink.inkSoft
              : undefined
          }
        />
      </View>
      <Text style={styles.sub}>
        Get a weekly notification for this class on the days you pick. Time uses your phone’s local
        timezone.
      </Text>

      {reminder.enabled ? (
        <>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Reminder time</Text>
            <Pressable
              style={styles.timeBtn}
              onPress={openTimeEditor}
              android_ripple={{ color: ink.pressTint }}
            >
              <Text style={styles.timeBtnTxt}>{timeLabel}</Text>
            </Pressable>
          </View>
          {showAndroidPicker ? (
            <DateTimePicker
              value={timeDate}
              mode="time"
              display="default"
              onChange={onAndroidTimeChange}
            />
          ) : null}

          <Modal
            visible={showIosModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowIosModal(false)}
          >
            <Pressable style={styles.modalRoot} onPress={() => setShowIosModal(false)}>
              <KeyboardAvoidingView behavior="padding">
                <Pressable onPress={e => e.stopPropagation()}>
                  <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Reminder time</Text>
                    <DateTimePicker
                      value={iosDraft}
                      mode="time"
                      display="spinner"
                      onChange={(_, d) => {
                        if (d) setIosDraft(d);
                      }}
                    />
                    <View style={styles.modalActions}>
                      <Pressable style={styles.modalBtnGhost} onPress={() => setShowIosModal(false)}>
                        <Text style={styles.modalBtnGhostTxt}>Cancel</Text>
                      </Pressable>
                      <Pressable style={styles.modalBtnPrimary} onPress={confirmIosTime}>
                        <Text style={styles.modalBtnPrimaryTxt}>Save</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              </KeyboardAvoidingView>
            </Pressable>
          </Modal>

          <Text style={styles.daysLabel}>Repeat on</Text>
          <View style={styles.chipsRow}>
            {WEEKDAY_CHIPS.map(({ iso, label }) => {
              const on = reminder.weekdays.includes(iso);
              return (
                <Pressable
                  key={iso}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => toggleWeekday(iso)}
                  android_ripple={{ color: ink.pressTint }}
                >
                  <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>
            Tip: set the time to 15–30 minutes before class so you have time to open materials or
            attendance.
          </Text>
        </>
      ) : null}
    </View>
  );
};

export default ClassReminderSection;
