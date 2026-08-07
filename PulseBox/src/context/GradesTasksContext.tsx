import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import * as gradesApi from '../api/grades';
import type { GradeOut, TaskKind, TaskOut } from '../api/grades';

export type { TaskKind };

export interface ClassTask {
  id: string;
  classId: string;
  title: string;
  kind: TaskKind;
  /** Short label e.g. "Due Fri" */
  dueLabel?: string;
  /** End of deadline window (ISO), for time-left / progress in UI. */
  dueAt?: string;
  /** When the task was assigned (for Recent activity). */
  createdAt: string;
  /** Source form when this task was published from the form builder. */
  formId?: string;
}

export interface TaskGradeRecord {
  id: string;
  classId: string;
  taskId: string;
  studentId: string;
  grade: string;
  status: 'graded' | 'pending' | 'missing';
}

export type AssignFormToClassesPayload = {
  formId: string;
  title: string;
  kind: TaskKind;
  dueLabel?: string;
  /** Deadline end instant (ISO), optional; used for time remaining and progress. */
  dueAt?: string;
  /** One entry per class to assign; studentIds drive grade rows (pending) in View grades. */
  targets: { classId: string; studentIds: string[] }[];
};

type GradesTasksContextValue = {
  tasks: ClassTask[];
  grades: TaskGradeRecord[];
  isLoading: boolean;
  getGrade: (classId: string, taskId: string, studentId: string) => TaskGradeRecord | undefined;
  getTasksForClass: (classId: string) => ClassTask[];
  /** Creates/updates tasks and pending grade rows so the task appears under each class in View grades. */
  assignFormToClasses: (payload: AssignFormToClassesPayload) => Promise<void>;
  /** Removes gradebook tasks and grades tied to a deleted form (Share task → classes). */
  removeTasksForForm: (formId: string) => Promise<void>;
  /** PATCH one grade row on the server. */
  updateGrade: (
    gradeId: string,
    patch: { grade?: string; status?: TaskGradeRecord['status'] },
  ) => Promise<void>;
  /** Ensure form has a share token; returns absolute share URL for QR/link. */
  publishForm: (formId: string) => Promise<{ shareToken: string; shareUrl: string }>;
  refreshGradebook: () => Promise<void>;
};

const GradesTasksContext = createContext<GradesTasksContextValue | undefined>(undefined);

function asTaskKind(k: string): TaskKind {
  if (k === 'quiz' || k === 'assignment' || k === 'project' || k === 'test') return k;
  return 'quiz';
}

function mapTask(t: TaskOut): ClassTask {
  return {
    id: t.id,
    classId: String(t.classId),
    title: t.title,
    kind: asTaskKind(String(t.kind)),
    dueLabel: t.dueLabel ?? undefined,
    dueAt: t.dueAt ?? undefined,
    createdAt: t.createdAt,
    formId: t.formId ? String(t.formId) : undefined,
  };
}

function mapGrade(g: GradeOut): TaskGradeRecord {
  return {
    id: String(g.id),
    classId: String(g.classId),
    taskId: g.taskId,
    studentId: String(g.studentId),
    grade: g.grade,
    status: g.status,
  };
}

export const GradesTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [tasks, setTasks] = useState<ClassTask[]>([]);
  const [grades, setGrades] = useState<TaskGradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshGradebook = useCallback(async () => {
    if (!isAuthenticated) {
      setTasks([]);
      setGrades([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [tRes, gRes] = await Promise.all([
        gradesApi.listTasks(1, 100),
        gradesApi.listGrades(1, 500),
      ]);
      setTasks(tRes.data.map(mapTask));
      setGrades(gRes.data.map(mapGrade));
    } catch (e) {
      console.warn('refreshGradebook failed', e);
      setTasks([]);
      setGrades([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isBootstrapping) return;
    void refreshGradebook();
  }, [isBootstrapping, isAuthenticated, refreshGradebook]);

  const getGrade = useCallback(
    (classId: string, taskId: string, studentId: string) =>
      grades.find(
        (g) => g.classId === classId && g.taskId === taskId && g.studentId === studentId,
      ),
    [grades],
  );

  const getTasksForClass = useCallback(
    (classId: string) =>
      tasks.filter((t) => t.classId === classId).sort((a, b) => a.title.localeCompare(b.title)),
    [tasks],
  );

  const assignFormToClasses = useCallback(async (payload: AssignFormToClassesPayload) => {
    await gradesApi.assignForm(payload.formId, {
      title: payload.title,
      kind: payload.kind,
      dueLabel: payload.dueLabel,
      dueAt: payload.dueAt,
      targets: payload.targets,
    });
    // Re-hydrate so grade ids match server UUIDs
    const [tRes, gRes] = await Promise.all([
      gradesApi.listTasks(1, 100),
      gradesApi.listGrades(1, 500),
    ]);
    setTasks(tRes.data.map(mapTask));
    setGrades(gRes.data.map(mapGrade));
  }, []);

  const removeTasksForForm = useCallback(async (formId: string) => {
    await gradesApi.deleteFormAssignments(formId);
    try {
      const [tRes, gRes] = await Promise.all([
        gradesApi.listTasks(1, 100),
        gradesApi.listGrades(1, 500),
      ]);
      setTasks(tRes.data.map(mapTask));
      setGrades(gRes.data.map(mapGrade));
    } catch {
      setTasks((prev) => prev.filter((t) => t.formId !== formId));
      setGrades((prev) => prev.filter((g) => !g.taskId.includes(`form-${formId}-`)));
    }
  }, []);

  const updateGrade = useCallback(
    async (
      gradeId: string,
      patch: { grade?: string; status?: TaskGradeRecord['status'] },
    ) => {
      const updated = await gradesApi.patchGrade(gradeId, patch);
      const mapped = mapGrade(updated);
      setGrades((prev) => prev.map((g) => (g.id === gradeId ? mapped : g)));
    },
    [],
  );

  const publishForm = useCallback(async (formId: string) => {
    const res = await gradesApi.publishForm(formId);
    return { shareToken: res.shareToken, shareUrl: res.shareUrl };
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      grades,
      isLoading,
      getGrade,
      getTasksForClass,
      assignFormToClasses,
      removeTasksForForm,
      updateGrade,
      publishForm,
      refreshGradebook,
    }),
    [
      tasks,
      grades,
      isLoading,
      getGrade,
      getTasksForClass,
      assignFormToClasses,
      removeTasksForForm,
      updateGrade,
      publishForm,
      refreshGradebook,
    ],
  );

  return <GradesTasksContext.Provider value={value}>{children}</GradesTasksContext.Provider>;
};

export function useGradesTasks(): GradesTasksContextValue {
  const ctx = useContext(GradesTasksContext);
  if (!ctx) {
    throw new Error('useGradesTasks must be used within GradesTasksProvider');
  }
  return ctx;
}
