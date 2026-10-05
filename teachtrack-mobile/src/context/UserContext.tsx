import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Legacy key: plain string display name only. */
const LEGACY_DISPLAY_KEY = '@groovebox_user_display_name';
const PROFILE_KEY = '@groovebox_user_profile_v1';

export type UserProfile = {
  displayName: string;
  /** Local `file://` or content URI from the image picker. */
  avatarUri: string | null;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  institutionName: string;
  /** e.g. “Mathematics teacher”, “Department head”. */
  professionalTitle: string;
  /** Free text, e.g. “Algebra, Geometry”. */
  subjectsTeach: string;
};

function defaultProfile(): UserProfile {
  return {
    displayName: '',
    avatarUri: null,
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    institutionName: '',
    professionalTitle: '',
    subjectsTeach: '',
  };
}

function normalizeProfile(raw: unknown): UserProfile {
  const base = defaultProfile();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : '');
  const avatar =
    o.avatarUri === null || o.avatarUri === undefined
      ? null
      : typeof o.avatarUri === 'string'
        ? o.avatarUri
        : null;
  return {
    displayName: str('displayName'),
    avatarUri: avatar,
    email: str('email'),
    phone: str('phone'),
    country: str('country'),
    city: str('city'),
    address: str('address'),
    institutionName: str('institutionName'),
    professionalTitle: str('professionalTitle'),
    subjectsTeach: str('subjectsTeach'),
  };
}

type UserContextType = {
  profile: UserProfile;
  displayName: string;
  setDisplayName: (name: string) => Promise<void>;
  firstName: string;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (!cancelled) setProfile(normalizeProfile(parsed));
          return;
        } catch {
          /* fall through */
        }
      }
      const legacy = await AsyncStorage.getItem(LEGACY_DISPLAY_KEY);
      const initial = defaultProfile();
      if (legacy) {
        initial.displayName = legacy.trim();
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(initial));
        await AsyncStorage.removeItem(LEGACY_DISPLAY_KEY);
      }
      if (!cancelled) setProfile(initial);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: UserProfile) => {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  }, []);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = normalizeProfile({ ...prev, ...patch });
      void persist(next);
      return next;
    });
  }, [persist]);

  const setDisplayName = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      await updateProfile({ displayName: trimmed });
    },
    [updateProfile],
  );

  const firstName = useMemo(() => {
    const n = profile.displayName.trim();
    if (!n) return '';
    return n.split(/\s+/)[0];
  }, [profile.displayName]);

  const value = useMemo(
    () => ({
      profile,
      displayName: profile.displayName,
      setDisplayName,
      firstName,
      updateProfile,
    }),
    [profile, setDisplayName, firstName, updateProfile],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within UserProvider');
  }
  return ctx;
}
