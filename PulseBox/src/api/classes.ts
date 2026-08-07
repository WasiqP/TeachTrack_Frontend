import { apiRequest } from './client';

export type SchoolType = 'School' | 'College' | 'University' | 'Others';

export type ClassOut = {
  id: string;
  name: string;
  subject: string;
  gradeLevel?: string | null;
  schedule?: string | null;
  roomNumber?: string | null;
  schoolName?: string | null;
  schoolType?: SchoolType | null;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type StudentOut = {
  id: string;
  name: string;
  rollNumber?: string | null;
  email?: string | null;
  teacherRemark?: string | null;
  teacherRemarkUpdatedAt?: string | null;
  followUp: boolean;
  createdAt: string;
};

export type AnnouncementOut = {
  id: string;
  body: string;
  createdAt: string;
};

export type ActivityOut = {
  id: string;
  kind: string;
  headline: string;
  detail?: string | null;
  createdAt: string;
};

export type ReminderOut = {
  enabled: boolean;
  hour: number;
  minute: number;
  weekdays: number[];
};

export type ClassDetailOut = ClassOut & {
  students: StudentOut[];
  announcements?: AnnouncementOut[];
  activityLog?: ActivityOut[];
  reminder?: ReminderOut | null;
};

export type ClassCreateBody = {
  name: string;
  subject: string;
  gradeLevel?: string;
  schedule?: string;
  roomNumber?: string;
  schoolName?: string;
  schoolType?: SchoolType;
};

export type ClassUpdateBody = Partial<ClassCreateBody>;

export type StudentCreateBody = {
  name: string;
  rollNumber?: string;
  email?: string;
};

export type StudentUpdateBody = {
  name?: string;
  rollNumber?: string;
  email?: string;
  teacherRemark?: string;
  followUp?: boolean;
};

export type ReminderUpdateBody = {
  enabled?: boolean;
  hour?: number;
  minute?: number;
  weekdays?: number[];
};

export type PageMeta = { page: number; size: number; total: number };

export function listClasses(page = 1, size = 100) {
  return apiRequest<{ data: ClassOut[]; meta: PageMeta }>(
    `/classes?page=${page}&size=${size}`,
    { auth: true },
  );
}

export function createClass(body: ClassCreateBody) {
  return apiRequest<ClassOut>('/classes', { method: 'POST', body, auth: true });
}

export function getClass(id: string) {
  return apiRequest<ClassDetailOut>(`/classes/${id}`, { auth: true });
}

export function patchClass(id: string, body: ClassUpdateBody) {
  return apiRequest<ClassOut>(`/classes/${id}`, { method: 'PATCH', body, auth: true });
}

export function deleteClassApi(id: string) {
  return apiRequest<{ message: string }>(`/classes/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function addStudent(classId: string, body: StudentCreateBody) {
  return apiRequest<StudentOut>(`/classes/${classId}/students`, {
    method: 'POST',
    body,
    auth: true,
  });
}

export function patchStudent(classId: string, studentId: string, body: StudentUpdateBody) {
  return apiRequest<StudentOut>(`/classes/${classId}/students/${studentId}`, {
    method: 'PATCH',
    body,
    auth: true,
  });
}

export function removeStudent(classId: string, studentId: string) {
  return apiRequest<{ message: string }>(
    `/classes/${classId}/students/${studentId}`,
    { method: 'DELETE', auth: true },
  );
}

export function postAnnouncement(classId: string, body: string) {
  return apiRequest<AnnouncementOut>(`/classes/${classId}/announcements`, {
    method: 'POST',
    body: { body },
    auth: true,
  });
}

export function deleteAnnouncement(classId: string, announcementId: string) {
  return apiRequest<{ message: string }>(
    `/classes/${classId}/announcements/${announcementId}`,
    { method: 'DELETE', auth: true },
  );
}

export function listActivity(classId: string, page = 1, size = 30) {
  return apiRequest<{ data: ActivityOut[]; meta: PageMeta }>(
    `/classes/${classId}/activity?page=${page}&size=${size}`,
    { auth: true },
  );
}

export function getReminder(classId: string) {
  return apiRequest<ReminderOut>(`/classes/${classId}/reminder`, { auth: true });
}

export function patchReminder(classId: string, body: ReminderUpdateBody) {
  return apiRequest<ReminderOut>(`/classes/${classId}/reminder`, {
    method: 'PATCH',
    body,
    auth: true,
  });
}
