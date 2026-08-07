import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { peekAccessToken } from '../api/client';
import { mediaUrl } from '../api/config';
import * as profileApi from '../api/profile';
import type { ProfileOut } from '../api/profile';

export type UserProfile = {
  displayName: string;
  /** HTTPS avatar from server, or temporary local `file://` while uploading. */
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
  timezone: string;
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
    timezone: '',
  };
}

function fromServer(p: ProfileOut): UserProfile {
  return {
    displayName: p.displayName?.trim() ?? '',
    avatarUri: mediaUrl(p.avatarUrl),
    email: p.email ?? '',
    phone: p.phone ?? '',
    country: p.country ?? '',
    city: p.city ?? '',
    address: p.address ?? '',
    institutionName: p.institutionName ?? '',
    professionalTitle: p.professionalTitle ?? '',
    subjectsTeach: p.subjectsTeach ?? '',
    timezone: p.timezone ?? '',
  };
}

type UserContextType = {
  profile: UserProfile;
  displayName: string;
  setDisplayName: (name: string) => Promise<void>;
  firstName: string;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  /** Load full profile from GET /me/profile (call after login). Returns mapped profile. */
  hydrateFromServer: () => Promise<UserProfile | null>;
  /** Upload local image URI to POST /me/avatar. */
  uploadAvatar: (localUri: string, mimeType?: string) => Promise<void>;
  clearLocalAvatar: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  const hydrateFromServer = useCallback(async () => {
    if (!peekAccessToken()) return null;
    try {
      const p = await profileApi.getProfile();
      const mapped = fromServer(p);
      setProfile(mapped);
      return mapped;
    } catch (e) {
      console.warn('hydrateFromServer failed', e);
      return null;
    }
  }, []);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));

    if (!peekAccessToken()) return;

    // email is not patchable on the API; avatar goes through uploadAvatar
    const body: profileApi.ProfileUpdateBody = {};
    if (patch.displayName !== undefined) body.displayName = patch.displayName;
    if (patch.phone !== undefined) body.phone = patch.phone;
    if (patch.country !== undefined) body.country = patch.country;
    if (patch.city !== undefined) body.city = patch.city;
    if (patch.address !== undefined) body.address = patch.address;
    if (patch.institutionName !== undefined) body.institutionName = patch.institutionName;
    if (patch.professionalTitle !== undefined) {
      body.professionalTitle = patch.professionalTitle;
    }
    if (patch.subjectsTeach !== undefined) body.subjectsTeach = patch.subjectsTeach;
    if (patch.timezone !== undefined) body.timezone = patch.timezone;

    if (Object.keys(body).length === 0) return;

    try {
      const updated = await profileApi.patchProfile(body);
      setProfile(fromServer(updated));
    } catch (e) {
      console.warn('patchProfile failed', e);
      throw e;
    }
  }, []);

  const setDisplayName = useCallback(
    async (name: string) => {
      await updateProfile({ displayName: name.trim() });
    },
    [updateProfile],
  );

  const uploadAvatar = useCallback(async (localUri: string, mimeType?: string) => {
    setProfile((prev) => ({ ...prev, avatarUri: localUri }));
    if (!peekAccessToken()) return;
    try {
      const { avatarUrl } = await profileApi.uploadAvatar(localUri, mimeType);
      setProfile((prev) => ({ ...prev, avatarUri: avatarUrl }));
    } catch (e) {
      console.warn('uploadAvatar failed', e);
      throw e;
    }
  }, []);

  const clearLocalAvatar = useCallback(async () => {
    setProfile((prev) => ({ ...prev, avatarUri: null }));
  }, []);

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
      hydrateFromServer,
      uploadAvatar,
      clearLocalAvatar,
    }),
    [
      profile,
      setDisplayName,
      firstName,
      updateProfile,
      hydrateFromServer,
      uploadAvatar,
      clearLocalAvatar,
    ],
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
