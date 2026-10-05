/**
 * Public API for class reminders. Loads Notifee only when needed so imports stay defined even if
 * the native module is missing until a full rebuild.
 */
import type { ClassReminderSettings } from '../types/classReminder';

export type ClassReminderSchedulePayload = {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  schedule: string;
  roomNumber?: string;
  reminder: ClassReminderSettings;
};

function mapNotifeeFailure(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  if (/Notifee native module not found/i.test(msg) || /Cannot read property.*of undefined/i.test(msg)) {
    return new Error('NOTIFEE_NATIVE_MISSING');
  }
  return e instanceof Error ? e : new Error(msg);
}

export async function cancelClassReminderTriggers(classId: string): Promise<void> {
  try {
    const core = await import('./classReminderNotifeeCore');
    await core.cancelClassReminderTriggers(classId);
  } catch (e) {
    throw mapNotifeeFailure(e);
  }
}

export async function syncClassReminderSchedule(
  payload: ClassReminderSchedulePayload,
): Promise<void> {
  try {
    const core = await import('./classReminderNotifeeCore');
    await core.syncClassReminderSchedule(payload);
  } catch (e) {
    throw mapNotifeeFailure(e);
  }
}
