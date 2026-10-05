import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'groove_grades_tasks_v1';

export type TaskKind = 'quiz' | 'assignment' | 'project' | 'test';

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

type Store = {
  tasks: ClassTask[];
  grades: TaskGradeRecord[];
};

const SEED: Store = {
  tasks: [
    {
      id: 'task-m1-mid',
      classId: '1',
      title: 'Midterm quiz',
      kind: 'quiz',
      dueLabel: 'Oct 15',
      createdAt: '2024-10-01T12:00:00.000Z',
    },
    {
      id: 'task-m1-ps',
      classId: '1',
      title: 'Problem set 3',
      kind: 'assignment',
      dueLabel: 'Oct 18',
      createdAt: '2024-10-03T09:30:00.000Z',
    },
    {
      id: 'task-m1-lab',
      classId: '1',
      title: 'Lab report — motion',
      kind: 'project',
      dueLabel: 'Oct 22',
      createdAt: '2024-10-05T16:00:00.000Z',
    },
    {
      id: 'task-e1-essay',
      classId: '2',
      title: 'Essay draft',
      kind: 'assignment',
      dueLabel: 'Oct 20',
      createdAt: '2024-10-02T11:00:00.000Z',
    },
    {
      id: 'task-e1-vocab',
      classId: '2',
      title: 'Vocabulary test',
      kind: 'test',
      dueLabel: 'Oct 12',
      createdAt: '2024-09-28T14:00:00.000Z',
    },
  ],
  grades: [
    // Mathematics 101 — class 1, students s1–s3
    { id: 'g1', classId: '1', taskId: 'task-m1-mid', studentId: 's1', grade: '92%', status: 'graded' },
    { id: 'g2', classId: '1', taskId: 'task-m1-mid', studentId: 's2', grade: '88%', status: 'graded' },
    { id: 'g3', classId: '1', taskId: 'task-m1-mid', studentId: 's3', grade: '76%', status: 'graded' },
    { id: 'g4', classId: '1', taskId: 'task-m1-ps', studentId: 's1', grade: 'A−', status: 'graded' },
    { id: 'g5', classId: '1', taskId: 'task-m1-ps', studentId: 's2', grade: 'B+', status: 'graded' },
    { id: 'g6', classId: '1', taskId: 'task-m1-ps', studentId: 's3', grade: '—', status: 'missing' },
    { id: 'g7', classId: '1', taskId: 'task-m1-lab', studentId: 's1', grade: '18/20', status: 'graded' },
    { id: 'g8', classId: '1', taskId: 'task-m1-lab', studentId: 's2', grade: '17/20', status: 'graded' },
    { id: 'g9', classId: '1', taskId: 'task-m1-lab', studentId: 's3', grade: 'Pending', status: 'pending' },
    // English — class 2, students s4–s5
    { id: 'g10', classId: '2', taskId: 'task-e1-essay', studentId: 's4', grade: 'B', status: 'graded' },
    { id: 'g11', classId: '2', taskId: 'task-e1-essay', studentId: 's5', grade: 'A−', status: 'graded' },
    { id: 'g12', classId: '2', taskId: 'task-e1-vocab', studentId: 's4', grade: '40/45', status: 'graded' },
    { id: 'g13', classId: '2', taskId: 'task-e1-vocab', studentId: 's5', grade: '42/45', status: 'graded' },
  ],
};

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
};

const GradesTasksContext = createContext<GradesTasksContextValue | undefined>(undefined);

export const GradesTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<ClassTask[]>([]);
  const [grades, setGrades] = useState<TaskGradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tasksRef = useRef(tasks);
  const gradesRef = useRef(grades);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  useEffect(() => {
    gradesRef.current = grades;
  }, [grades]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as Store;
          const loaded = (parsed.tasks ?? []).map((t) => ({
            ...t,
            createdAt: t.createdAt ?? new Date(0).toISOString(),
          }));
          setTasks(loaded);
          setGrades(parsed.grades ?? []);
        } else {
          setTasks(SEED.tasks);
          setGrades(SEED.grades);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
        }
      } catch (e) {
        console.warn('GradesTasks load failed', e);
        setTasks(SEED.tasks);
        setGrades(SEED.grades);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getGrade = useCallback(
    (classId: string, taskId: string, studentId: string) =>
      grades.find((g) => g.classId === classId && g.taskId === taskId && g.studentId === studentId),
    [grades],
  );

  const getTasksForClass = useCallback(
    (classId: string) => tasks.filter((t) => t.classId === classId).sort((a, b) => a.title.localeCompare(b.title)),
    [tasks],
  );

  const assignFormToClasses = useCallback(async (payload: AssignFormToClassesPayload) => {
    const now = new Date().toISOString();
    let nextTasks = [...tasksRef.current];
    let nextGrades = [...gradesRef.current];

    for (const target of payload.targets) {
      const taskId = `form-${payload.formId}-cls-${target.classId}`;
      const taskRow: ClassTask = {
        id: taskId,
        classId: target.classId,
        title: payload.title,
        kind: payload.kind,
        dueLabel: payload.dueLabel,
        dueAt: payload.dueAt,
        createdAt: now,
        formId: payload.formId,
      };
      const idx = nextTasks.findIndex((t) => t.id === taskId);
      if (idx >= 0) {
        nextTasks[idx] = taskRow;
      } else {
        nextTasks.push(taskRow);
      }

      for (const studentId of target.studentIds) {
        const exists = nextGrades.some(
          (g) =>
            g.classId === target.classId && g.taskId === taskId && g.studentId === studentId,
        );
        if (!exists) {
          nextGrades.push({
            id: `g-${taskId}-${studentId}`,
            classId: target.classId,
            taskId,
            studentId,
            grade: '—',
            status: 'pending',
          });
        }
      }
    }

    setTasks(nextTasks);
    setGrades(nextGrades);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: nextTasks, grades: nextGrades }));
    } catch (e) {
      console.warn('persist grades/tasks failed', e);
    }
  }, []);

  const removeTasksForForm = useCallback(async (formId: string) => {
    const prevT = tasksRef.current;
    const prevG = gradesRef.current;
    const removedIds = new Set(prevT.filter((t) => t.formId === formId).map((t) => t.id));
    if (removedIds.size === 0) {
      return;
    }
    const nextTasks = prevT.filter((t) => t.formId !== formId);
    const nextGrades = prevG.filter((g) => !removedIds.has(g.taskId));
    setTasks(nextTasks);
    setGrades(nextGrades);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: nextTasks, grades: nextGrades }));
    } catch (e) {
      console.warn('persist grades/tasks after form delete failed', e);
    }
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
    }),
    [tasks, grades, isLoading, getGrade, getTasksForClass, assignFormToClasses, removeTasksForForm],
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
