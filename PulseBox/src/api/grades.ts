import { apiRequest } from './client';
import { mediaUrl } from './config';

export type TaskKind = 'quiz' | 'assignment' | 'project' | 'test';

export type TaskOut = {
  id: string;
  classId: string;
  title: string;
  kind: TaskKind | string;
  dueLabel?: string | null;
  dueAt?: string | null;
  createdAt: string;
  formId?: string | null;
};

export type GradeOut = {
  id: string;
  classId: string;
  taskId: string;
  studentId: string;
  grade: string;
  status: 'graded' | 'pending' | 'missing';
};

export type AssignTarget = {
  classId: string;
  studentIds: string[];
};

export type AssignRequest = {
  title: string;
  kind: TaskKind;
  dueLabel?: string;
  dueAt?: string;
  targets: AssignTarget[];
};

export type AssignResponse = {
  tasks: TaskOut[];
  gradesCreated: number;
  message: string;
};

export type PublishResponse = {
  shareToken: string;
  shareUrl: string;
  publishedAt: string;
};

export type PageMeta = { page: number; size: number; total: number };

export function assignForm(formId: string, body: AssignRequest) {
  return apiRequest<AssignResponse>(`/forms/${formId}/assign`, {
    method: 'POST',
    body,
    auth: true,
  });
}

export function deleteFormAssignments(formId: string) {
  return apiRequest<{ message: string }>(`/forms/${formId}/assignments`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function publishForm(formId: string) {
  const res = await apiRequest<PublishResponse>(`/forms/${formId}/publish`, {
    method: 'POST',
    auth: true,
  });
  return {
    ...res,
    shareUrl: mediaUrl(res.shareUrl) ?? res.shareUrl,
  };
}

export function listTasks(page = 1, size = 100, classId?: string) {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (classId) q.set('classId', classId);
  return apiRequest<{ data: TaskOut[]; meta: PageMeta }>(`/tasks?${q}`, {
    auth: true,
  });
}

export function listGrades(page = 1, size = 500, opts?: { classId?: string; taskId?: string }) {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (opts?.classId) q.set('classId', opts.classId);
  if (opts?.taskId) q.set('taskId', opts.taskId);
  return apiRequest<{ data: GradeOut[]; meta: PageMeta }>(`/grades?${q}`, {
    auth: true,
  });
}

export function patchGrade(
  gradeId: string,
  body: { grade?: string; status?: 'graded' | 'pending' | 'missing' },
) {
  return apiRequest<GradeOut>(`/grades/${gradeId}`, {
    method: 'PATCH',
    body,
    auth: true,
  });
}

export function deleteTask(taskId: string) {
  return apiRequest<{ message: string }>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
    auth: true,
  });
}
