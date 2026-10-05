import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

export type NotificationPrefs = {
  taskReminders: boolean;
  gradeUpdates: boolean;
  classAnnouncements: boolean;
};

export type AppLanguageCode = 'en' | 'es' | 'fr';

export const LANGUAGE_OPTIONS: {
  code: AppLanguageCode;
  label: string;
  nativeLabel: string;
  ready: boolean;
}[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', ready: true },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', ready: false },
  { code: 'fr', label: 'French', nativeLabel: 'Français', ready: false },
];

export function languageLabel(code: AppLanguageCode): string {
  return LANGUAGE_OPTIONS.find(o => o.code === code)?.label ?? 'English';
}

type AppSettingsContextType = {
  notifications: NotificationPrefs;
  setNotificationPrefs: (patch: Partial<NotificationPrefs>) => Promise<void>;
  language: AppLanguageCode;
  setLanguage: (code: AppLanguageCode) => Promise<void>;
};

const defaultNotifications: NotificationPrefs = {
  taskReminders: true,
  gradeUpdates: true,
  classAnnouncements: true,
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

function readSettings(raw: unknown): { notifications: NotificationPrefs; language: AppLanguageCode } {
  const notifications = { ...defaultNotifications };
  let language: AppLanguageCode = 'en';
  const root = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const n =
    (root.settings as Record<string, unknown> | undefined)?.notifications ??
    root.notifications;
  if (n && typeof n === 'object') {
    const o = n as Record<string, unknown>;
    if (typeof o.taskReminders === 'boolean') notifications.taskReminders = o.taskReminders;
    if (typeof o.gradeUpdates === 'boolean') notifications.gradeUpdates = o.gradeUpdates;
    if (typeof o.classAnnouncements === 'boolean') {
      notifications.classAnnouncements = o.classAnnouncements;
    }
  }
  const lang =
    ((root.settings as Record<string, unknown> | undefined)?.language as string | undefined) ??
    (root.language as string | undefined);
  if (lang === 'en' || lang === 'es' || lang === 'fr') language = lang;
  return { notifications, language };
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [language, setLanguageState] = useState<AppLanguageCode>('en');

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications(defaultNotifications);
      setLanguageState('en');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await api.get('/me');
        if (cancelled) return;
        const next = readSettings(me);
        setNotifications(next.notifications);
        setLanguageState(next.language);
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const setNotificationPrefs = useCallback(async (patch: Partial<NotificationPrefs>) => {
    setNotifications(prev => {
      const notifications = { ...prev, ...patch };
      void api.patch('/me/settings', { notifications }).catch(() => undefined);
      return notifications;
    });
  }, []);

  const setLanguage = useCallback(async (code: AppLanguageCode) => {
    setLanguageState(code);
    await api.patch('/me/settings', { language: code });
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      setNotificationPrefs,
      language,
      setLanguage,
    }),
    [notifications, language, setNotificationPrefs, setLanguage],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): AppSettingsContextType {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return ctx;
}
