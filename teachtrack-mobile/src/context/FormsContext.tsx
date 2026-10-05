import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, asList, unwrapResource } from '../api/client';
import { STUDENT_FORM_BASE } from '../config/api';
import { useAuth } from './AuthContext';

export interface FormData {
  id: string;
  name: string;
  iconId: string;
  answers: any;
  createdAt: string;
  shareUrl?: string;
}

interface FormsContextType {
  forms: FormData[];
  addForm: (form: FormData) => Promise<FormData>;
  updateForm: (id: string, updates: Partial<FormData>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  isLoading: boolean;
}

const FormsContext = createContext<FormsContextType | undefined>(undefined);

function mapForm(raw: unknown): FormData {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const id = String(o.id ?? '');
  return {
    id,
    name: String(o.name ?? ''),
    iconId: String(o.iconId ?? 'clipboard'),
    answers: o.answers ?? {},
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
    shareUrl: typeof o.shareUrl === 'string' ? o.shareUrl : id ? `${STUDENT_FORM_BASE}/${id}` : undefined,
  };
}

export const FormsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await api.get<unknown>('/forms');
    setForms(asList<unknown>(data, 'forms').map(mapForm));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setForms([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    load()
      .catch(() => {
        if (!cancelled) setForms([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, load]);

  const addForm = async (form: FormData): Promise<FormData> => {
    const data = await api.post<unknown>('/forms', {
      name: form.name,
      iconId: form.iconId,
      answers: form.answers,
    });
    const created = mapForm(unwrapResource(data, 'form'));
    setForms(prev => [created, ...prev.filter(f => f.id !== created.id)]);
    return created;
  };

  const updateForm = async (id: string, updates: Partial<FormData>) => {
    setForms(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    const payload: Record<string, unknown> = {};
    if (updates.name != null) payload.name = updates.name;
    if (updates.iconId != null) payload.iconId = updates.iconId;
    if (updates.answers != null) payload.answers = updates.answers;
    if (Object.keys(payload).length) await api.patch(`/forms/${id}`, payload);
  };

  const deleteForm = async (id: string) => {
    await api.del(`/forms/${id}`);
    setForms(prev => prev.filter(f => f.id !== id));
  };

  return (
    <FormsContext.Provider value={{ forms, addForm, updateForm, deleteForm, isLoading }}>
      {children}
    </FormsContext.Provider>
  );
};

export const useForms = () => {
  const context = useContext(FormsContext);
  if (!context) {
    throw new Error('useForms must be used within a FormsProvider');
  }
  return context;
};
