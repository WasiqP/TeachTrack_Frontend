import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, unwrapResource } from '../api/client';
import { emptyProfile, type UserProfile } from '../types/user';
import { useAuth } from './AuthContext';

export type { UserProfile } from '../types/user';

type UserContextType = {
  profile: UserProfile;
  displayName: string;
  setDisplayName: (name: string) => Promise<void>;
  firstName: string;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

function mergeProfile(raw: unknown, fallback: UserProfile): UserProfile {
  if (!raw || typeof raw !== 'object') return fallback;
  const o = raw as Record<string, unknown>;
  const str = (k: string, d = '') => (typeof o[k] === 'string' ? (o[k] as string) : d);
  const avatar =
    o.avatarUri === null
      ? null
      : typeof o.avatarUri === 'string'
        ? o.avatarUri
        : fallback.avatarUri;
  return {
    displayName: str('displayName', fallback.displayName),
    avatarUri: avatar,
    email: str('email', fallback.email),
    phone: str('phone', fallback.phone),
    country: str('country', fallback.country),
    city: str('city', fallback.city),
    address: str('address', fallback.address),
    institutionName: str('institutionName', fallback.institutionName),
    professionalTitle: str('professionalTitle', fallback.professionalTitle),
    subjectsTeach: str('subjectsTeach', fallback.subjectsTeach),
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(() => emptyProfile());

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(emptyProfile());
      return;
    }
    if (user) setProfile(p => mergeProfile(user, p));
    let cancelled = false;
    (async () => {
      try {
        const me = await api.get<{ user?: unknown }>('/me');
        const next = mergeProfile(unwrapResource(me, 'user') ?? me?.user ?? me, emptyProfile());
        if (!cancelled) setProfile(next);
      } catch {
        /* keep snapshot */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const persistRemote = useCallback(async (next: UserProfile) => {
    const { avatarUri: _a, email: _e, ...rest } = next;
    await api.patch('/me', rest);
  }, []);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    let next: UserProfile = emptyProfile();
    setProfile(prev => {
      next = { ...prev, ...patch };
      return next;
    });

    const uri = patch.avatarUri;
    if (uri && (uri.startsWith('file:') || uri.startsWith('content:'))) {
      const form = new FormData();
      const name = uri.split('/').pop() || 'avatar.jpg';
      const type = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
      form.append('file', { uri, name, type } as unknown as Blob);
      const uploaded = await api.upload<{ avatarUri?: string }>('/me/avatar', form);
      if (uploaded?.avatarUri) {
        next = { ...next, avatarUri: uploaded.avatarUri };
        setProfile(next);
      }
      const { avatarUri: _drop, ...rest } = patch;
      if (Object.keys(rest).length) await persistRemote({ ...next, ...rest });
      return;
    }

    await persistRemote(next);
  }, [persistRemote]);

  const setDisplayName = useCallback(
    async (name: string) => {
      await updateProfile({ displayName: name.trim() });
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
