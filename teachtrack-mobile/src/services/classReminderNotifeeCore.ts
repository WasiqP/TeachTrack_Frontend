/**
 * Notifee-backed implementation. Loaded lazily via `classReminderNotifications.ts` so a missing
 * native build does not break module evaluation at app startup.
 */
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import type { ClassReminderSettings } from '../types/classReminder';

const CHANNEL_ID = 'class-reminders';

function isoToJsWeekday(iso: number): number {
  if (iso < 1 || iso > 7) return 1;
  return iso === 7 ? 0 : iso;
}

function nextDateForWeekdayAtTime(isoWeekday: number, hour: number, minute: number): Date {
  const jsDay = isoToJsWeekday(isoWeekday);
  const now = new Date();
  const target = new Date(now);
  target.setMilliseconds(0);
  target.setSeconds(0, 0);
  const daysAhead = (jsDay - target.getDay() + 7) % 7;
  target.setDate(target.getDate() + daysAhead);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 7);
  }
  return target;
}

function buildReminderBody(
  schedule: string,
  subject: string,
  gradeLevel: string,
  roomNumber?: string,
): string {
  const tail = [subject, gradeLevel, roomNumber].filter(Boolean).join(' · ');
  return tail ? `${schedule} · ${tail}` : schedule;
}

export async function ensureClassReminderChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Class reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const r = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (r !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }
  }
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

export async function cancelClassReminderTriggers(classId: string): Promise<void> {
  const prefix = `class-${classId}-`;
  const ids = await notifee.getTriggerNotificationIds();
  await Promise.all(
    ids.filter(id => id.startsWith(prefix)).map(id => notifee.cancelTriggerNotification(id)),
  );
}

export type SchedulePayload = {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  schedule: string;
  roomNumber?: string;
  reminder: ClassReminderSettings;
};

export async function syncClassReminderSchedule(payload: SchedulePayload): Promise<void> {
  await cancelClassReminderTriggers(payload.id);
  const r = payload.reminder;
  if (!r.enabled || !r.weekdays?.length) {
    return;
  }

  await ensureClassReminderChannel();
  const permitted = await requestReminderPermission();
  if (!permitted) {
    throw new Error('NOTIFICATION_PERMISSION_DENIED');
  }

  const body = buildReminderBody(
    payload.schedule,
    payload.subject,
    payload.gradeLevel,
    payload.roomNumber,
  );
  const unique = [...new Set(r.weekdays)].filter(d => d >= 1 && d <= 7);

  for (const iso of unique) {
    const id = `class-${payload.id}-iso${iso}`;
    const timestamp = nextDateForWeekdayAtTime(iso, r.hour, r.minute).getTime();
    await notifee.createTriggerNotification(
      {
        id,
        title: `Class reminder: ${payload.name}`,
        body,
        android: {
          channelId: CHANNEL_ID,
          pressAction: { id: 'default' },
        },
        ios: {
          sound: 'default',
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp,
        repeatFrequency: RepeatFrequency.WEEKLY,
      },
    );
  }
}
