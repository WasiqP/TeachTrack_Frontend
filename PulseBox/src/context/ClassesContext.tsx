import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ClassReminderSettings } from '../types/classReminder';
import { cancelClassReminderTriggers } from '../services/classReminderNotifications';
import { useAuth } from './AuthContext';
import * as classesApi from '../api/classes';
import * as attendanceApi from '../api/attendance';
import type {
  ActivityOut,
  AnnouncementOut,
  ClassDetailOut,
  ClassOut,
  ReminderOut,
  StudentOut,
  StudentUpdateBody,
} from '../api/classes';
import type { AttendanceDayOut } from '../api/attendance';

/** Institution category collected when creating a class */
export type SchoolTypeOption = 'School' | 'College' | 'University' | 'Others';

/** Roster entry persisted with a class (from Create Class). */
export interface ClassStudentRecord {
  id: string;
  name: string;
  /** Teacher-assigned roll / class number (shown with name in roster views). */
  rollNumber?: string;
  email?: string;
  /** Private teacher note on the student record (not shown to the student in-app). */
  teacherRemark?: string;
  teacherRemarkUpdatedAt?: string;
  /** Mark for follow-up / at-risk tracking in the teacher UI. */
  followUp?: boolean;
}

export interface ClassAnnouncement {
  id: string;
  body: string;
  createdAt: string;
}

export type ClassActivityKind = 'announcement' | 'attendance' | 'task_assigned';

/** Persisted timeline entries for class detail “Recent activity”. */
export interface ClassActivityItem {
  id: string;
  kind: ClassActivityKind;
  headline: string;
  detail?: string;
  createdAt: string;
}

/** Saved when attendance is submitted for a calendar day (local YYYY-MM-DD). */
export type AttendanceEntryStatus = 'present' | 'absent' | 'late';

export interface AttendanceDayEntry {
  studentId: string;
  status: AttendanceEntryStatus;
}

export interface AttendanceDayRecord {
  id: string;
  /** Local calendar date, e.g. 2026-04-09 */
  dateKey: string;
  takenAt: string;
  entries: AttendanceDayEntry[];
}

export interface ClassData {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  studentCount: number;
  schedule: string;
  roomNumber?: string;
  /** Display name of the school / institution */
  schoolName?: string;
  schoolType?: SchoolTypeOption;
  /** Saved roster; may be absent on older data */
  students?: ClassStudentRecord[];
  /** Posted class announcements (newest typically shown first in UI). */
  announcements?: ClassAnnouncement[];
  /** Logged actions: announcements, attendance saves, etc. (newest first in UI). */
  activityLog?: ClassActivityItem[];
  /** One record per dateKey when attendance is saved; latest save wins for that day. */
  attendanceHistory?: AttendanceDayRecord[];
  /** Weekly local notification reminder (Notifee). */
  reminder?: ClassReminderSettings;
  createdAt: string;
}

interface ClassesContextType {
  classes: ClassData[];
  addClass: (classData: ClassData) => Promise<void>;
  updateClass: (id: string, updates: Partial<ClassData>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  /** POST announcement; server also appends activity. */
  postAnnouncement: (classId: string, body: string) => Promise<void>;
  /** Save/replace one day's attendance on the server and update local state. */
  saveAttendanceDay: (
    classId: string,
    dateKey: string,
    entries: AttendanceDayEntry[],
  ) => Promise<AttendanceDayRecord>;
  /** Re-fetch one class detail (announcements / activity / reminder / roster). */
  refreshClass: (classId: string) => Promise<void>;
  refreshClasses: () => Promise<void>;
  isLoading: boolean;
}

const ClassesContext = createContext<ClassesContextType | undefined>(undefined);

function mapStudent(s: StudentOut): ClassStudentRecord {
  return {
    id: s.id,
    name: s.name,
    rollNumber: s.rollNumber ?? undefined,
    email: s.email ?? undefined,
    teacherRemark: s.teacherRemark ?? undefined,
    teacherRemarkUpdatedAt: s.teacherRemarkUpdatedAt ?? undefined,
    followUp: s.followUp ?? false,
  };
}

function mapAttendanceDay(d: AttendanceDayOut): AttendanceDayRecord {
  const dateKey = typeof d.dateKey === 'string' ? d.dateKey : String(d.dateKey);
  return {
    id: `att-${dateKey}`,
    dateKey,
    takenAt: d.takenAt,
    entries: (d.entries ?? []).map((e) => ({
      studentId: String(e.studentId),
      status: e.status,
    })),
  };
}

function mapAnnouncement(a: AnnouncementOut): ClassAnnouncement {
  return {
    id: String(a.id),
    body: a.body,
    createdAt: a.createdAt,
  };
}

function asActivityKind(kind: string): ClassActivityKind {
  if (kind === 'announcement' || kind === 'attendance' || kind === 'task_assigned') {
    return kind;
  }
  return 'announcement';
}

function mapActivity(a: ActivityOut): ClassActivityItem {
  return {
    id: String(a.id),
    kind: asActivityKind(a.kind),
    headline: a.headline,
    detail: a.detail ?? undefined,
    createdAt: a.createdAt,
  };
}

function mapReminder(r?: ReminderOut | null): ClassReminderSettings | undefined {
  if (!r) return undefined;
  return {
    enabled: Boolean(r.enabled),
    hour: r.hour,
    minute: r.minute,
    weekdays: Array.isArray(r.weekdays) ? r.weekdays : [],
  };
}

function mapClassOut(
  c: ClassOut,
  extras?: {
    students?: StudentOut[];
    announcements?: AnnouncementOut[];
    activityLog?: ActivityOut[];
    reminder?: ReminderOut | null;
    attendanceHistory?: AttendanceDayRecord[];
  },
): ClassData {
  return {
    id: c.id,
    name: c.name,
    subject: c.subject,
    gradeLevel: c.gradeLevel ?? '',
    studentCount: c.studentCount,
    schedule: c.schedule ?? '',
    roomNumber: c.roomNumber ?? undefined,
    schoolName: c.schoolName ?? undefined,
    schoolType: (c.schoolType as SchoolTypeOption | null | undefined) ?? undefined,
    students: extras?.students?.map(mapStudent),
    createdAt: c.createdAt,
    announcements: extras?.announcements?.map(mapAnnouncement),
    activityLog: extras?.activityLog?.map(mapActivity),
    attendanceHistory: extras?.attendanceHistory,
    reminder: mapReminder(extras?.reminder),
  };
}

function mapDetail(d: ClassDetailOut, attendanceHistory?: AttendanceDayRecord[]): ClassData {
  return mapClassOut(d, {
    students: d.students,
    announcements: d.announcements,
    activityLog: d.activityLog,
    reminder: d.reminder,
    attendanceHistory,
  });
}

function isTempStudentId(id: string): boolean {
  return !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

function studentPayload(s: ClassStudentRecord) {
  const body: { name: string; rollNumber?: string; email?: string } = { name: s.name };
  if (s.rollNumber) body.rollNumber = s.rollNumber;
  if (s.email) body.email = s.email;
  return body;
}

export const ClassesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshClasses = useCallback(async () => {
    if (!isAuthenticated) {
      setClasses([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Drop legacy local overlay (announcements / activity / reminder now server-backed)
      await AsyncStorage.removeItem('@teachtrack_class_local_v1').catch(() => undefined);
      const listed = await classesApi.listClasses(1, 100);
      const detailsAndAttendance = await Promise.all(
        listed.data.map(async (c) => {
          const [detail, attendance] = await Promise.all([
            classesApi.getClass(c.id).catch(() => null),
            attendanceApi.listAttendance(c.id).catch(() => ({ data: [] as AttendanceDayOut[] })),
          ]);
          return { detail, attendance: attendance.data.map(mapAttendanceDay) };
        }),
      );
      const mapped: ClassData[] = [];
      for (let i = 0; i < listed.data.length; i++) {
        const { detail, attendance } = detailsAndAttendance[i];
        if (detail) {
          mapped.push(mapDetail(detail, attendance));
        } else {
          mapped.push(mapClassOut(listed.data[i], { attendanceHistory: attendance }));
        }
      }
      setClasses(mapped);
    } catch (e) {
      console.warn('refreshClasses failed', e);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshClass = useCallback(async (classId: string) => {
    try {
      const [detail, attendance] = await Promise.all([
        classesApi.getClass(classId),
        attendanceApi.listAttendance(classId).catch(() => ({ data: [] as AttendanceDayOut[] })),
      ]);
      const mapped = mapDetail(detail, attendance.data.map(mapAttendanceDay));
      setClasses((prev) => {
        const exists = prev.some((c) => c.id === classId);
        if (!exists) return [mapped, ...prev];
        return prev.map((c) => (c.id === classId ? mapped : c));
      });
    } catch (e) {
      console.warn('refreshClass failed', e);
    }
  }, []);

  useEffect(() => {
    if (isBootstrapping) return;
    void refreshClasses();
  }, [isBootstrapping, isAuthenticated, refreshClasses]);

  const addClass = async (classData: ClassData) => {
    const created = await classesApi.createClass({
      name: classData.name,
      subject: classData.subject,
      gradeLevel: classData.gradeLevel || undefined,
      schedule: classData.schedule || undefined,
      roomNumber: classData.roomNumber,
      schoolName: classData.schoolName,
      schoolType: classData.schoolType,
    });

    const roster = classData.students ?? [];
    for (const s of roster) {
      await classesApi.addStudent(created.id, studentPayload(s));
    }

    const detail = await classesApi.getClass(created.id);
    const mapped = mapDetail(detail, []);
    setClasses((prev) => [mapped, ...prev.filter((c) => c.id !== mapped.id)]);
  };

  const syncStudents = async (
    classId: string,
    prevStudents: ClassStudentRecord[],
    nextStudents: ClassStudentRecord[],
  ) => {
    const prevMap = new Map(prevStudents.map((s) => [s.id, s]));
    const nextIds = new Set(nextStudents.map((s) => s.id));

    for (const s of prevStudents) {
      if (!nextIds.has(s.id) && !isTempStudentId(s.id)) {
        await classesApi.removeStudent(classId, s.id);
      }
    }

    const resolved: ClassStudentRecord[] = [];
    for (const s of nextStudents) {
      if (isTempStudentId(s.id) || !prevMap.has(s.id)) {
        const created = await classesApi.addStudent(classId, studentPayload(s));
        resolved.push(mapStudent(created));
        continue;
      }
      const old = prevMap.get(s.id)!;
      const patch: StudentUpdateBody = {};
      if (s.name !== old.name) patch.name = s.name;
      if ((s.rollNumber ?? '') !== (old.rollNumber ?? '')) patch.rollNumber = s.rollNumber;
      if ((s.email ?? '') !== (old.email ?? '')) patch.email = s.email;
      if ((s.teacherRemark ?? '') !== (old.teacherRemark ?? '')) {
        patch.teacherRemark = s.teacherRemark;
      }
      if (Boolean(s.followUp) !== Boolean(old.followUp)) patch.followUp = Boolean(s.followUp);

      if (Object.keys(patch).length > 0) {
        const updated = await classesApi.patchStudent(classId, s.id, patch);
        resolved.push(mapStudent(updated));
      } else {
        resolved.push(s);
      }
    }
    return resolved;
  };

  const postAnnouncement = async (classId: string, body: string) => {
    await classesApi.postAnnouncement(classId, body);
    await refreshClass(classId);
  };

  const updateClass = async (id: string, updates: Partial<ClassData>) => {
    const current = classes.find((c) => c.id === id);
    if (!current) return;

    const classFieldKeys: (keyof ClassData)[] = [
      'name',
      'subject',
      'gradeLevel',
      'schedule',
      'roomNumber',
      'schoolName',
      'schoolType',
    ];
    const classPatch: classesApi.ClassUpdateBody = {};
    for (const k of classFieldKeys) {
      if (k in updates && updates[k] !== undefined) {
        const v = updates[k];
        if (k === 'gradeLevel') classPatch.gradeLevel = (v as string) || undefined;
        else if (k === 'name') classPatch.name = v as string;
        else if (k === 'subject') classPatch.subject = v as string;
        else if (k === 'schedule') classPatch.schedule = (v as string) || undefined;
        else if (k === 'roomNumber') classPatch.roomNumber = v as string | undefined;
        else if (k === 'schoolName') classPatch.schoolName = v as string | undefined;
        else if (k === 'schoolType') classPatch.schoolType = v as SchoolTypeOption | undefined;
      }
    }

    let nextStudents = current.students ?? [];
    if (updates.students) {
      nextStudents = await syncStudents(id, current.students ?? [], updates.students);
    }

    let serverClass: ClassOut | null = null;
    if (Object.keys(classPatch).length > 0) {
      serverClass = await classesApi.patchClass(id, classPatch);
    }

    let nextReminder = current.reminder;
    if (updates.reminder !== undefined) {
      nextReminder = mapReminder(
        await classesApi.patchReminder(id, {
          enabled: updates.reminder.enabled,
          hour: updates.reminder.hour,
          minute: updates.reminder.minute,
          weekdays: updates.reminder.weekdays,
        }),
      );
    }

    // Attendance: if caller still passes attendanceHistory, sync the newest day to API
    let nextAttendance = current.attendanceHistory ?? [];
    let attendanceTouched = false;
    if (updates.attendanceHistory) {
      const incoming = updates.attendanceHistory;
      const newest = incoming[0];
      if (newest?.dateKey && newest.entries?.length) {
        const saved = await attendanceApi.putAttendanceDay(
          id,
          newest.dateKey,
          newest.entries.map((e) => ({
            studentId: e.studentId,
            status: e.status,
          })),
        );
        const day = mapAttendanceDay(saved);
        nextAttendance = [day, ...incoming.filter((r) => r.dateKey !== day.dateKey)].slice(
          0,
          400,
        );
        attendanceTouched = true;
      } else {
        nextAttendance = incoming;
      }
    }

    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== id) return cls;
        return {
          ...cls,
          ...(serverClass
            ? {
                name: serverClass.name,
                subject: serverClass.subject,
                gradeLevel: serverClass.gradeLevel ?? '',
                schedule: serverClass.schedule ?? '',
                roomNumber: serverClass.roomNumber ?? undefined,
                schoolName: serverClass.schoolName ?? undefined,
                schoolType:
                  (serverClass.schoolType as SchoolTypeOption | null | undefined) ??
                  undefined,
                studentCount: serverClass.studentCount,
              }
            : {}),
          students: updates.students ? nextStudents : cls.students,
          studentCount: updates.students
            ? nextStudents.length
            : serverClass?.studentCount ?? cls.studentCount,
          reminder: nextReminder,
          attendanceHistory: updates.attendanceHistory
            ? nextAttendance
            : cls.attendanceHistory,
        };
      }),
    );

    if (updates.students || attendanceTouched || updates.reminder !== undefined) {
      await refreshClass(id);
    }
  };

  const saveAttendanceDay = async (
    classId: string,
    dateKey: string,
    entries: AttendanceDayEntry[],
  ): Promise<AttendanceDayRecord> => {
    const saved = await attendanceApi.putAttendanceDay(
      classId,
      dateKey,
      entries.map((e) => ({ studentId: e.studentId, status: e.status })),
    );
    const day = mapAttendanceDay(saved);
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        const without = (cls.attendanceHistory ?? []).filter((r) => r.dateKey !== dateKey);
        return {
          ...cls,
          attendanceHistory: [day, ...without].slice(0, 400),
        };
      }),
    );
    // Server auto-logs attendance activity
    await refreshClass(classId);
    return day;
  };

  const deleteClass = async (id: string) => {
    try {
      await cancelClassReminderTriggers(id);
    } catch (e) {
      if (__DEV__) console.warn('cancelClassReminderTriggers', e);
    }
    await classesApi.deleteClassApi(id);
    setClasses((prev) => prev.filter((cls) => cls.id !== id));
  };

  return (
    <ClassesContext.Provider
      value={{
        classes,
        addClass,
        updateClass,
        deleteClass,
        postAnnouncement,
        saveAttendanceDay,
        refreshClass,
        refreshClasses,
        isLoading,
      }}
    >
      {children}
    </ClassesContext.Provider>
  );
};

export const useClasses = () => {
  const context = useContext(ClassesContext);
  if (!context) {
    throw new Error('useClasses must be used within a ClassesProvider');
  }
  return context;
};
