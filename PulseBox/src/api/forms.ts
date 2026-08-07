import { apiRequest } from './client';

export type FormAnswers = {
  taskKind?: string;
  assessmentType?: string;
  classId?: string;
  className?: string;
  focusTopic?: string;
  duePreset?: string;
  formatIds?: string[];
  questionFormats?: string[];
  questions?: unknown[];
  [key: string]: unknown;
};

export type FormOut = {
  id: string;
  name: string;
  iconId: string;
  answers: FormAnswers;
  shareToken?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FormCreateBody = {
  name: string;
  iconId?: string;
  answers?: FormAnswers;
};

export type FormUpdateBody = {
  name?: string;
  iconId?: string;
  answers?: FormAnswers;
};

export type PageMeta = { page: number; size: number; total: number };

export function listForms(page = 1, size = 100) {
  return apiRequest<{ data: FormOut[]; meta: PageMeta }>(
    `/forms?page=${page}&size=${size}`,
    { auth: true },
  );
}

export function createForm(body: FormCreateBody) {
  return apiRequest<FormOut>('/forms', { method: 'POST', body, auth: true });
}

export function getForm(id: string) {
  return apiRequest<FormOut>(`/forms/${id}`, { auth: true });
}

export function patchForm(id: string, body: FormUpdateBody) {
  return apiRequest<FormOut>(`/forms/${id}`, { method: 'PATCH', body, auth: true });
}

export function deleteFormApi(id: string) {
  return apiRequest<{ message: string }>(`/forms/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function replaceQuestions(id: string, questions: unknown[]) {
  return apiRequest<FormOut>(`/forms/${id}/questions`, {
    method: 'PATCH',
    body: { questions },
    auth: true,
  });
}
