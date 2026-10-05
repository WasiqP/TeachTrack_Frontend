import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ClassReminderSettings } from '../types/classReminder';
import { cancelClassReminderTriggers } from '../services/classReminderNotifications';
import { api, asList, isUuid, unwrapResource } from '../api/client';
import { useAuth } from './AuthContext';

export type SchoolTypeOption = 'School' | 'College' | 'University' | 'Others';

export interface ClassStudentRecord {
  id: string;
  name: string;
  rollNumber?: string;
  email?: string;
  teacherRemark?: string;
  teacherRemarkUpdatedAt?: string;
  followUp?: boolean;
}

export interface ClassAnnouncement {
  id: string;
  body: string;
  createdAt: string;
}

export type ClassActivityKind = 'announcement' | 'attendance' | 'task_assigned';

export interface ClassActivityItem {
  id: string;
  kind: ClassActivityKind;
  headline: string;
  detail?: string;
  createdAt: string;
}

export type AttendanceEntryStatus = 'present' | 'absent' | 'late';

export interface AttendanceDayEntry {
  studentId: string;
  status: AttendanceEntryStatus;
}

export interface AttendanceDayRecord {
  id: string;
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
  schoolName?: string;
  schoolType?: SchoolTypeOption;
  students?: ClassStudentRecord[];
  announcements?: ClassAnnouncement[];
  activityLog?: ClassActivityItem[];
  attendanceHistory?: AttendanceDayRecord[];
  reminder?: ClassReminderSettings;
  createdAt: string;
}

interface ClassesContextType {
  classes: ClassData[];
  addClass: (classData: ClassData) => Promise<void>;
  updateClass: (id: string, updates: Partial<ClassData>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  refreshClasses: () => Promise<void>;
  isLoading: boolean;
}

const ClassesContext = createContext<ClassesContextType | undefined>(undefined);

function iso(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  return fallback;
}

function mapStudent(raw: unknown): ClassStudentRecord {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: String(o.id ?? ''),
    name: String(o.name ?? ''),
    rollNumber: typeof o.rollNumber === 'string' ? o.rollNumber : undefined,
    email: typeof o.email === 'string' ? o.email : undefined,
    teacherRemark: typeof o.teacherRemark === 'string' ? o.teacherRemark : undefined,
    teacherRemarkUpdatedAt:
      typeof o.teacherRemarkUpdatedAt === 'string' ? o.teacherRemarkUpdatedAt : undefined,
    followUp: Boolean(o.followUp),
  };
}

function mapClass(raw: unknown): ClassData {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const students = asList<unknown>(o.students, 'students').map(mapStudent);
  const reminder = o.reminder && typeof o.reminder === 'object' ? (o.reminder as ClassReminderSettings) : undefined;
  return {
    id: String(o.id ?? ''),
    name: String(o.name ?? ''),
    subject: String(o.subject ?? ''),
    gradeLevel: String(o.gradeLevel ?? ''),
    studentCount: typeof o.studentCount === 'number' ? o.studentCount : students.length,
    schedule: String(o.schedule ?? ''),
    roomNumber: typeof o.roomNumber === 'string' ? o.roomNumber : undefined,
    schoolName: typeof o.schoolName === 'string' ? o.schoolName : undefined,
    schoolType: o.schoolType as SchoolTypeOption | undefined,
    students,
    announcements: asList<ClassAnnouncement>(o.announcements, 'announcements'),
    activityLog: asList<ClassActivityItem>(o.activityLog, 'activityLog'),
    attendanceHistory: asList<AttendanceDayRecord>(o.attendanceHistory, 'attendanceHistory'),
    reminder,
    createdAt: iso(o.createdAt, new Date().toISOString()),
  };
}

async function fetchClasses(): Promise<ClassData[]> {
  const data = await api.get<unknown>('/classes');
  const list = asList<unknown>(data, 'classes');
  const detailed = await Promise.all(
    list.map(async raw => {
      const id = String((raw as { id?: unknown }).id ?? '');
      if (!id) return mapClass(raw);
      try {
        const detail = await api.get<unknown>(`/classes/${id}`);
        return mapClass(unwrapResource(detail, 'class'));
      } catch {
        return mapClass(raw);
      }
    }),
  );
  return detailed;
}

async function syncRoster(
  classId: string,
  prev: ClassStudentRecord[],
  next: ClassStudentRecord[],
) {
  const prevMap = new Map(prev.map(s => [s.id, s]));
  const nextIds = new Set(next.map(s => s.id));
  for (const s of prev) {
    if (!nextIds.has(s.id) && isUuid(s.id)) {
      await api.del(`/classes/${classId}/students/${s.id}`);
    }
  }
  const toCreate = next.filter(s => !isUuid(s.id) || !prevMap.has(s.id));
  const rollAssignments: { studentId: string; rollNumber: string }[] = [];

  if (toCreate.length > 1) {
    await api.post(`/classes/${classId}/students/import`, {
      students: toCreate.map(s => ({
        name: s.name,
        email: s.email,
        rollNumber: s.rollNumber,
      })),
    });
  } else {
    for (const s of toCreate) {
      await api.post(`/classes/${classId}/students`, {
        name: s.name,
        email: s.email,
        rollNumber: s.rollNumber,
      });
    }
  }

  for (const s of next) {
    if (!isUuid(s.id) || !prevMap.has(s.id)) continue;
    const old = prevMap.get(s.id);
    if (!old) continue;
    const changed =
      old.name !== s.name ||
      old.email !== s.email ||
      old.teacherRemark !== s.teacherRemark ||
      old.followUp !== s.followUp;
    if (changed) {
      await api.patch(`/classes/${classId}/students/${s.id}`, {
        name: s.name,
        email: s.email,
        rollNumber: s.rollNumber,
        teacherRemark: s.teacherRemark,
        followUp: s.followUp,
      });
    } else if (old.rollNumber !== s.rollNumber && s.rollNumber != null) {
      rollAssignments.push({ studentId: s.id, rollNumber: s.rollNumber });
    }
  }
  if (rollAssignments.length) {
    try {
      await api.post(`/classes/${classId}/students/assign-rolls`, { assignments: rollAssignments });
    } catch {
      for (const a of rollAssignments) {
        await api.patch(`/classes/${classId}/students/${a.studentId}`, { rollNumber: a.rollNumber });
      }
    }
  }
}

export const ClassesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshClasses = useCallback(async () => {
    const list = await fetchClasses();
    setClasses(list);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setClasses([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetchClasses()
      .then(list => {
        if (!cancelled) setClasses(list);
      })
      .catch(() => {
        if (!cancelled) setClasses([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const addClass = async (classData: ClassData) => {
    await api.post('/classes', {
      name: classData.name,
      subject: classData.subject,
      gradeLevel: classData.gradeLevel,
      schedule: classData.schedule,
      roomNumber: classData.roomNumber,
      schoolName: classData.schoolName,
      schoolType: classData.schoolType,
      students: (classData.students ?? []).map(s => ({
        name: s.name,
        email: s.email,
        rollNumber: s.rollNumber,
      })),
    });
    await refreshClasses();
  };

  const updateClass = async (id: string, updates: Partial<ClassData>) => {
    const prev = classes.find(c => c.id === id);
    setClasses(list => list.map(c => (c.id === id ? { ...c, ...updates } : c)));
    try {
      if (updates.announcements && prev) {
        const oldIds = new Set((prev.announcements ?? []).map(a => a.id));
        const added = (updates.announcements ?? []).filter(a => !oldIds.has(a.id));
        for (const a of added) {
          await api.post(`/classes/${id}/announcements`, { body: a.body });
        }
      }
      if (updates.attendanceHistory?.[0]) {
        const day = updates.attendanceHistory[0];
        await api.put(`/classes/${id}/attendance/${day.dateKey}`, { entries: day.entries });
      }
      if (updates.students) {
        await syncRoster(id, prev?.students ?? [], updates.students);
      }
      const meta: Record<string, unknown> = {};
      (['name', 'subject', 'gradeLevel', 'schedule', 'roomNumber', 'schoolName', 'schoolType'] as const).forEach(
        k => {
          if (k in updates) meta[k] = updates[k];
        },
      );
      if (updates.reminder) meta.reminder = updates.reminder;
      if (Object.keys(meta).length) await api.patch(`/classes/${id}`, meta);
      await refreshClasses();
    } catch (e) {
      try {
        await refreshClasses();
      } catch {
        /* ignore */
      }
      throw e;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      await cancelClassReminderTriggers(id);
    } catch (e) {
      if (__DEV__) console.warn('cancelClassReminderTriggers', e);
    }
    await api.del(`/classes/${id}`);
    setClasses(list => list.filter(c => c.id !== id));
  };

  return (
    <ClassesContext.Provider
      value={{ classes, addClass, updateClass, deleteClass, refreshClasses, isLoading }}
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
