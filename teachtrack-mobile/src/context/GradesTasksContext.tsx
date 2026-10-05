import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, asList } from '../api/client';
import { useAuth } from './AuthContext';
import { useClasses } from './ClassesContext';

export type TaskKind = 'quiz' | 'assignment' | 'project' | 'test';

export interface ClassTask {
  id: string;
  classId: string;
  title: string;
  kind: TaskKind;
  dueLabel?: string;
  dueAt?: string;
  createdAt: string;
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
  dueAt?: string;
  targets: { classId: string; studentIds: string[] }[];
};

type GradesTasksContextValue = {
  tasks: ClassTask[];
  grades: TaskGradeRecord[];
  isLoading: boolean;
  getGrade: (classId: string, taskId: string, studentId: string) => TaskGradeRecord | undefined;
  getTasksForClass: (classId: string) => ClassTask[];
  assignFormToClasses: (payload: AssignFormToClassesPayload) => Promise<void>;
  removeTasksForForm: (formId: string) => Promise<void>;
};

const GradesTasksContext = createContext<GradesTasksContextValue | undefined>(undefined);

function mapTask(raw: unknown): ClassTask {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: String(o.id ?? ''),
    classId: String(o.classId ?? ''),
    title: String(o.title ?? ''),
    kind: (o.kind as TaskKind) || 'quiz',
    dueLabel: typeof o.dueLabel === 'string' ? o.dueLabel : undefined,
    dueAt: typeof o.dueAt === 'string' ? o.dueAt : undefined,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date(0).toISOString(),
    formId: typeof o.formId === 'string' ? o.formId : undefined,
  };
}

function mapGrade(raw: unknown): TaskGradeRecord {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: String(o.id ?? ''),
    classId: String(o.classId ?? ''),
    taskId: String(o.taskId ?? ''),
    studentId: String(o.studentId ?? ''),
    grade: String(o.grade ?? '—'),
    status: (o.status as TaskGradeRecord['status']) || 'pending',
  };
}

export const GradesTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { classes, isLoading: classesLoading } = useClasses();
  const [tasks, setTasks] = useState<ClassTask[]>([]);
  const [grades, setGrades] = useState<TaskGradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async (classIds: string[]) => {
    const allTasks: ClassTask[] = [];
    const allGrades: TaskGradeRecord[] = [];
    for (const classId of classIds) {
      try {
        const tData = await api.get<unknown>(`/classes/${classId}/tasks`);
        allTasks.push(...asList<unknown>(tData, 'tasks').map(mapTask));
      } catch {
        try {
          const tData = await api.get<unknown>(`/tasks?classId=${encodeURIComponent(classId)}`);
          allTasks.push(...asList<unknown>(tData, 'tasks').map(mapTask));
        } catch {
          /* skip */
        }
      }
      try {
        const gData = await api.get<unknown>(`/grades?classId=${encodeURIComponent(classId)}`);
        allGrades.push(...asList<unknown>(gData, 'grades').map(mapGrade));
      } catch {
        /* grades may be nested on the task payload */
      }
    }
    setTasks(allTasks);
    setGrades(allGrades);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setTasks([]);
      setGrades([]);
      setIsLoading(false);
      return;
    }
    if (classesLoading) return;
    let cancelled = false;
    setIsLoading(true);
    reload(classes.map(c => c.id))
      .catch(() => {
        if (!cancelled) {
          setTasks([]);
          setGrades([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, classesLoading, classes, reload]);

  const getGrade = useCallback(
    (classId: string, taskId: string, studentId: string) =>
      grades.find(g => g.classId === classId && g.taskId === taskId && g.studentId === studentId),
    [grades],
  );

  const getTasksForClass = useCallback(
    (classId: string) =>
      tasks.filter(t => t.classId === classId).sort((a, b) => a.title.localeCompare(b.title)),
    [tasks],
  );

  const assignFormToClasses = useCallback(async (payload: AssignFormToClassesPayload) => {
    await api.post(`/forms/${payload.formId}/assign`, {
      title: payload.title,
      kind: payload.kind,
      dueLabel: payload.dueLabel,
      dueAt: payload.dueAt,
      targets: payload.targets.map(t =>
        t.studentIds.length ? t : { classId: t.classId },
      ),
    });
    await reload(classes.map(c => c.id));
  }, [reload, classes]);

  const removeTasksForForm = useCallback(async (formId: string) => {
    setTasks(prev => prev.filter(t => t.formId !== formId));
    setGrades(prev => {
      const removed = new Set(tasks.filter(t => t.formId === formId).map(t => t.id));
      return prev.filter(g => !removed.has(g.taskId));
    });
  }, [tasks]);

  const value = useMemo(
    () => ({
      tasks,
      grades,
      isLoading,
      getGrade,
      getTasksForClass,
      assignFormToClasses,
      removeTasksForForm,
    }),
    [tasks, grades, isLoading, getGrade, getTasksForClass, assignFormToClasses, removeTasksForForm],
  );

  return <GradesTasksContext.Provider value={value}>{children}</GradesTasksContext.Provider>;
};

export const useGradesTasks = () => {
  const context = useContext(GradesTasksContext);
  if (!context) {
    throw new Error('useGradesTasks must be used within a GradesTasksProvider');
  }
  return context;
};
