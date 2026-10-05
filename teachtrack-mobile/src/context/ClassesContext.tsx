import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ClassReminderSettings } from '../types/classReminder';
import { cancelClassReminderTriggers } from '../services/classReminderNotifications';

/** Institution category collected when creating a class */
export type SchoolTypeOption = 'School' | 'College' | 'University' | 'Others';

/** Roster entry persisted with a class (from Create Class). */
export interface ClassStudentRecord {
  id: string;
  name: string;
  /** Teacher-assigned roll / class number (shown with name in roster views). */
  rollNumber?: string;
  email?: string;
  /** Private teacher note on the student record (not shown to the student in-app). */
  teacherRemark?: string;
  teacherRemarkUpdatedAt?: string;
  /** Mark for follow-up / at-risk tracking in the teacher UI. */
  followUp?: boolean;
}

export interface ClassAnnouncement {
  id: string;
  body: string;
  createdAt: string;
}

export type ClassActivityKind = 'announcement' | 'attendance' | 'task_assigned';

/** Persisted timeline entries for class detail “Recent activity”. */
export interface ClassActivityItem {
  id: string;
  kind: ClassActivityKind;
  headline: string;
  detail?: string;
  createdAt: string;
}

/** Saved when attendance is submitted for a calendar day (local YYYY-MM-DD). */
export type AttendanceEntryStatus = 'present' | 'absent' | 'late';

export interface AttendanceDayEntry {
  studentId: string;
  status: AttendanceEntryStatus;
}

export interface AttendanceDayRecord {
  id: string;
  /** Local calendar date, e.g. 2026-04-09 */
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
  /** Display name of the school / institution */
  schoolName?: string;
  schoolType?: SchoolTypeOption;
  /** Saved roster; may be absent on older data */
  students?: ClassStudentRecord[];
  /** Posted class announcements (newest typically shown first in UI). */
  announcements?: ClassAnnouncement[];
  /** Logged actions: announcements, attendance saves, etc. (newest first in UI). */
  activityLog?: ClassActivityItem[];
  /** One record per dateKey when attendance is saved; latest save wins for that day. */
  attendanceHistory?: AttendanceDayRecord[];
  /** Weekly local notification reminder (Notifee). */
  reminder?: ClassReminderSettings;
  createdAt: string;
}

interface ClassesContextType {
  classes: ClassData[];
  addClass: (classData: ClassData) => Promise<void>;
  updateClass: (id: string, updates: Partial<ClassData>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  isLoading: boolean;
}

const ClassesContext = createContext<ClassesContextType | undefined>(undefined);

export const ClassesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const storedClasses = await AsyncStorage.getItem('classes');
      if (storedClasses) {
        setClasses(JSON.parse(storedClasses));
      } else {
        // Initialize with some default classes if none exist
        const defaultClasses: ClassData[] = [
          {
            id: '1',
            name: 'Mathematics 101',
            subject: 'Mathematics',
            gradeLevel: 'Grade 10',
            studentCount: 3,
            schedule: 'Mon, Wed, Fri - 9:00 AM',
            roomNumber: 'Room 205',
            schoolName: 'Westside Academy',
            schoolType: 'School',
            students: [
              { id: 's1', name: 'Alex Morgan', email: 'alex.m@school.edu' },
              { id: 's2', name: 'Jordan Lee', email: 'jordan.l@school.edu' },
              { id: 's3', name: 'Sam Rivera', email: 'sam.r@school.edu' },
            ],
            activityLog: [
              {
                id: 'act-seed-m1',
                kind: 'announcement',
                headline: 'Posted an announcement',
                detail: 'Welcome back — syllabus week is on the portal.',
                createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
              },
              {
                id: 'act-seed-m1-att',
                kind: 'attendance',
                headline: 'Attendance marked',
                detail: '3 present · 0 late · 0 absent',
                createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'English Literature',
            subject: 'English',
            gradeLevel: 'Grade 11',
            studentCount: 2,
            schedule: 'Tue, Thu - 10:30 AM',
            roomNumber: 'Room 301',
            schoolName: 'Westside Academy',
            schoolType: 'School',
            students: [
              { id: 's4', name: 'Casey Kim', email: 'casey.k@school.edu' },
              { id: 's5', name: 'Riley Chen', email: 'riley.c@school.edu' },
            ],
            activityLog: [
              {
                id: 'act-seed-e1',
                kind: 'announcement',
                headline: 'Posted an announcement',
                detail: 'Reading circle meets Thursdays after school.',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
          },
        ];
        setClasses(defaultClasses);
        await AsyncStorage.setItem('classes', JSON.stringify(defaultClasses));
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addClass = async (classData: ClassData) => {
    try {
      const updatedClasses = [classData, ...classes];
      setClasses(updatedClasses);
      await AsyncStorage.setItem('classes', JSON.stringify(updatedClasses));
    } catch (error) {
      console.error('Error saving class:', error);
    }
  };

  const updateClass = async (id: string, updates: Partial<ClassData>) => {
    try {
      const updatedClasses = classes.map(cls => 
        cls.id === id ? { ...cls, ...updates } : cls
      );
      setClasses(updatedClasses);
      await AsyncStorage.setItem('classes', JSON.stringify(updatedClasses));
    } catch (error) {
      console.error('Error updating class:', error);
    }
  };

  const deleteClass = async (id: string) => {
    try {
      try {
        await cancelClassReminderTriggers(id);
      } catch (e) {
        if (__DEV__) console.warn('cancelClassReminderTriggers', e);
      }
      const updatedClasses = classes.filter(cls => cls.id !== id);
      setClasses(updatedClasses);
      await AsyncStorage.setItem('classes', JSON.stringify(updatedClasses));
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  return (
    <ClassesContext.Provider value={{ classes, addClass, updateClass, deleteClass, isLoading }}>
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


