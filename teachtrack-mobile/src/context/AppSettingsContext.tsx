import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@groovebox_app_settings_v1';

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

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(
  undefined,
);

type StoredShape = {
  notifications?: Partial<NotificationPrefs>;
  language?: AppLanguageCode;
};

type FullState = { notifications: NotificationPrefs; language: AppLanguageCode };

function normalizeStored(raw: unknown): FullState {
  const notifications = { ...defaultNotifications };
  let language: AppLanguageCode = 'en';
  if (raw && typeof raw === 'object') {
    const o = raw as StoredShape;
    if (o.notifications && typeof o.notifications === 'object') {
      if (typeof o.notifications.taskReminders === 'boolean') {
        notifications.taskReminders = o.notifications.taskReminders;
      }
      if (typeof o.notifications.gradeUpdates === 'boolean') {
        notifications.gradeUpdates = o.notifications.gradeUpdates;
      }
      if (typeof o.notifications.classAnnouncements === 'boolean') {
        notifications.classAnnouncements = o.notifications.classAnnouncements;
      }
    }
    if (o.language === 'en' || o.language === 'es' || o.language === 'fr') {
      language = o.language;
    }
  }
  return { notifications, language };
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FullState>({
    notifications: defaultNotifications,
    language: 'en',
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as unknown;
        setState(normalizeStored(parsed));
      } catch {
        /* ignore */
      }
    });
  }, []);

  const persist = useCallback(async (next: FullState) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setNotificationPrefs = useCallback(
    async (patch: Partial<NotificationPrefs>) => {
      setState(prev => {
        const next = {
          ...prev,
          notifications: { ...prev.notifications, ...patch },
        };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const setLanguage = useCallback(
    async (code: AppLanguageCode) => {
      setState(prev => {
        const next = { ...prev, language: code };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      notifications: state.notifications,
      setNotificationPrefs,
      language: state.language,
      setLanguage,
    }),
    [state.notifications, state.language, setNotificationPrefs, setLanguage],
  );

  return (
    <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextType {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return ctx;
}
