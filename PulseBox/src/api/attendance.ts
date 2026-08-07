import { apiRequest } from './client';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export type AttendanceEntryIn = {
  studentId: string;
  status: AttendanceStatus;
};

export type AttendanceEntryOut = {
  studentId: string;
  status: AttendanceStatus;
};

export type AttendanceSummary = {
  present: number;
  absent: number;
  late: number;
};

export type AttendanceDayOut = {
  dateKey: string;
  takenAt: string;
  entries: AttendanceEntryOut[];
  summary: AttendanceSummary;
};

export type StudentAttendanceStats = {
  studentId: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  total: number;
};

export type AttendanceReportOut = {
  from: string;
  to: string;
  daysTaken: number;
  students: StudentAttendanceStats[];
};

/** PUT — replace one day's attendance (last write wins). */
export function putAttendanceDay(
  classId: string,
  dateKey: string,
  entries: AttendanceEntryIn[],
) {
  return apiRequest<AttendanceDayOut>(`/classes/${classId}/attendance/${dateKey}`, {
    method: 'PUT',
    body: { entries },
    auth: true,
  });
}

/** GET — attendance history. Optional from/to as YYYY-MM-DD. */
export function listAttendance(classId: string, from?: string, to?: string) {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  const qs = q.toString();
  return apiRequest<{ data: AttendanceDayOut[] }>(
    `/classes/${classId}/attendance${qs ? `?${qs}` : ''}`,
    { auth: true },
  );
}

/** GET — per-student totals for a date range (both from & to required). */
export function attendanceReport(classId: string, from: string, to: string) {
  const q = new URLSearchParams({ from, to });
  return apiRequest<AttendanceReportOut>(
    `/classes/${classId}/attendance/report?${q.toString()}`,
    { auth: true },
  );
}
