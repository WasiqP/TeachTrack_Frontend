import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import * as profileApi from '../api/profile';

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
  return LANGUAGE_OPTIONS.find((o) => o.code === code)?.label ?? 'English';
}

type AppSettingsContextType = {
  notifications: NotificationPrefs;
  setNotificationPrefs: (patch: Partial<NotificationPrefs>) => Promise<void>;
  language: AppLanguageCode;
  setLanguage: (code: AppLanguageCode) => Promise<void>;
  isLoading: boolean;
};

const defaultNotifications: NotificationPrefs = {
  taskReminders: true,
  gradeUpdates: true,
  classAnnouncements: true,
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(
  undefined,
);

type FullState = { notifications: NotificationPrefs; language: AppLanguageCode };

function fromServer(s: profileApi.SettingsOut): FullState {
  const language: AppLanguageCode =
    s.language === 'es' || s.language === 'fr' ? s.language : 'en';
  return {
    language,
    notifications: {
      taskReminders: s.notifyTaskReminders,
      gradeUpdates: s.notifyGradeUpdates,
      classAnnouncements: s.notifyClassAnnouncements,
    },
  };
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [state, setState] = useState<FullState>({
    notifications: defaultNotifications,
    language: 'en',
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadFromServer = useCallback(async () => {
    if (!isAuthenticated) {
      setState({ notifications: defaultNotifications, language: 'en' });
      return;
    }
    setIsLoading(true);
    try {
      const s = await profileApi.getSettings();
      setState(fromServer(s));
    } catch (e) {
      console.warn('getSettings failed', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isBootstrapping) return;
    void loadFromServer();
  }, [isBootstrapping, isAuthenticated, loadFromServer]);

  const setNotificationPrefs = useCallback(
    async (patch: Partial<NotificationPrefs>) => {
      setState((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, ...patch },
      }));
      if (!isAuthenticated) return;

      const body: profileApi.SettingsUpdateBody = {};
      if (patch.taskReminders !== undefined) {
        body.notifyTaskReminders = patch.taskReminders;
      }
      if (patch.gradeUpdates !== undefined) {
        body.notifyGradeUpdates = patch.gradeUpdates;
      }
      if (patch.classAnnouncements !== undefined) {
        body.notifyClassAnnouncements = patch.classAnnouncements;
      }
      if (Object.keys(body).length === 0) return;

      try {
        const s = await profileApi.patchSettings(body);
        setState(fromServer(s));
      } catch (e) {
        console.warn('patchSettings failed', e);
        throw e;
      }
    },
    [isAuthenticated],
  );

  const setLanguage = useCallback(
    async (code: AppLanguageCode) => {
      setState((prev) => ({ ...prev, language: code }));
      if (!isAuthenticated) return;
      try {
        const s = await profileApi.patchSettings({ language: code });
        setState(fromServer(s));
      } catch (e) {
        console.warn('setLanguage failed', e);
        throw e;
      }
    },
    [isAuthenticated],
  );

  const value = useMemo(
    () => ({
      notifications: state.notifications,
      setNotificationPrefs,
      language: state.language,
      setLanguage,
      isLoading,
    }),
    [state.notifications, state.language, setNotificationPrefs, setLanguage, isLoading],
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
