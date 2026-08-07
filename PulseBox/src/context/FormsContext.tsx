import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import * as formsApi from '../api/forms';
import type { FormOut } from '../api/forms';

export interface FormData {
  id: string;
  name: string;
  iconId: string;
  answers: any;
  createdAt: string;
  shareToken?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
}

interface FormsContextType {
  forms: FormData[];
  /** Creates on server; returns the saved form (use returned id for navigation). */
  addForm: (form: FormData) => Promise<FormData>;
  updateForm: (id: string, updates: Partial<FormData>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  refreshForms: () => Promise<void>;
  isLoading: boolean;
}

const FormsContext = createContext<FormsContextType | undefined>(undefined);

function mapForm(f: FormOut): FormData {
  return {
    id: String(f.id),
    name: f.name,
    iconId: f.iconId,
    answers: f.answers ?? {},
    createdAt: f.createdAt,
    shareToken: f.shareToken,
    publishedAt: f.publishedAt,
    updatedAt: f.updatedAt,
  };
}

export const FormsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshForms = useCallback(async () => {
    if (!isAuthenticated) {
      setForms([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await formsApi.listForms(1, 100);
      setForms(res.data.map(mapForm));
    } catch (e) {
      console.warn('refreshForms failed', e);
      setForms([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isBootstrapping) return;
    void refreshForms();
  }, [isBootstrapping, isAuthenticated, refreshForms]);

  const addForm = async (form: FormData): Promise<FormData> => {
    const created = await formsApi.createForm({
      name: form.name,
      iconId: form.iconId || 'clipboard',
      answers: form.answers ?? {},
    });
    const mapped = mapForm(created);
    setForms((prev) => [mapped, ...prev.filter((f) => f.id !== mapped.id)]);
    return mapped;
  };

  const updateForm = async (id: string, updates: Partial<FormData>) => {
    const current = forms.find((f) => f.id === id);
    if (!current) return;

    let saved: FormOut;
    const questionsOnly =
      updates.answers != null &&
      updates.name === undefined &&
      updates.iconId === undefined &&
      Array.isArray(updates.answers.questions);

    if (questionsOnly) {
      saved = await formsApi.replaceQuestions(id, updates.answers!.questions);
      // If other answer fields also changed (rare), follow up with patch
      const metaKeys = Object.keys(updates.answers!).filter((k) => k !== 'questions');
      const metaChanged = metaKeys.some(
        (k) => JSON.stringify(updates.answers![k]) !== JSON.stringify(current.answers?.[k]),
      );
      if (metaChanged) {
        saved = await formsApi.patchForm(id, {
          answers: { ...current.answers, ...updates.answers },
        });
      }
    } else {
      const body: formsApi.FormUpdateBody = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.iconId !== undefined) body.iconId = updates.iconId;
      if (updates.answers !== undefined) {
        body.answers = { ...current.answers, ...updates.answers };
      }
      saved = await formsApi.patchForm(id, body);
    }

    const mapped = mapForm(saved);
    setForms((prev) => prev.map((f) => (f.id === id ? mapped : f)));
  };

  const deleteForm = async (id: string) => {
    await formsApi.deleteFormApi(id);
    setForms((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <FormsContext.Provider
      value={{ forms, addForm, updateForm, deleteForm, refreshForms, isLoading }}
    >
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
