import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, unwrapResource } from '../api/client';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../api/tokenStorage';
import { emptyProfile, type UserProfile } from '../types/user';

export type AuthUser = UserProfile & { id?: string };

type Tokens = { accessToken: string; refreshToken: string };

type AuthContextType = {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  applyUser: (user: AuthUser | null) => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (
    email: string,
    code: string,
    purpose: 'signup' | 'reset',
  ) => Promise<{ resetToken?: string }>;
  resendOtp: (email: string, purpose: 'signup' | 'reset') => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (resetToken: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : '');
  return {
    id: str('id') || undefined,
    displayName: str('displayName'),
    avatarUri: typeof o.avatarUri === 'string' ? o.avatarUri : o.avatarUri === null ? null : null,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isBootstrapping, setBootstrapping] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  const applyUser = useCallback((next: AuthUser | null) => setUser(next), []);

  const persistSession = useCallback(async (tokens: Tokens, rawUser?: unknown) => {
    await setTokens(tokens.accessToken, tokens.refreshToken);
    let mapped = mapUser(rawUser);
    if (!mapped?.email && !mapped?.id) {
      try {
        const me = await api.get<{ user?: unknown }>('/me');
        mapped = mapUser(unwrapResource(me, 'user'));
      } catch {
        mapped = { ...emptyProfile() };
      }
    }
    setUser(mapped ?? { ...emptyProfile() });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const access = await getAccessToken();
        const refresh = await getRefreshToken();
        if (!access && !refresh) return;
        const me = await api.get<{ user?: unknown }>('/me');
        if (!cancelled) setUser(mapUser(unwrapResource(me, 'user')));
      } catch {
        await clearTokens();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await api.post('/auth/register', { name, email, password }, false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.post<{ user?: unknown; tokens?: Tokens } & Partial<Tokens>>(
        '/auth/login',
        { email, password },
        false,
      );
      const tokens = data.tokens ?? (data.accessToken ? { accessToken: data.accessToken, refreshToken: data.refreshToken ?? '' } : undefined);
      if (!tokens?.accessToken) {
        throw new Error('Login did not return tokens.');
      }
      await persistSession(tokens as Tokens, unwrapResource(data, 'user') ?? data.user);
    },
    [persistSession],
  );

  const verifyOtp = useCallback(
    async (email: string, code: string, purpose: 'signup' | 'reset') => {
      const data = await api.post<{
        user?: unknown;
        tokens?: Tokens;
        resetToken?: string;
      }>('/auth/otp/verify', { email, code, purpose }, false);
      if (purpose === 'signup' && (data.tokens || (data as { accessToken?: string }).accessToken)) {
        const tokens = data.tokens ?? {
          accessToken: (data as { accessToken: string }).accessToken,
          refreshToken: (data as { refreshToken?: string }).refreshToken ?? '',
        };
        await persistSession(tokens, unwrapResource(data, 'user') ?? data.user);
        return {};
      }
      return { resetToken: data.resetToken };
    },
    [persistSession],
  );

  const resendOtp = useCallback(async (email: string, purpose: 'signup' | 'reset') => {
    await api.post('/auth/otp/resend', { email, purpose }, false);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await api.post('/auth/forgot-password', { email }, false);
  }, []);

  const resetPassword = useCallback(async (resetToken: string, password: string) => {
    await api.post('/auth/reset-password', { resetToken, password }, false);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = await getRefreshToken();
      await api.post('/auth/logout', refreshToken ? { refreshToken } : {});
    } catch {
      /* still clear local session */
    }
    await clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isBootstrapping,
      isAuthenticated: !!user,
      user,
      applyUser,
      register,
      login,
      verifyOtp,
      resendOtp,
      forgotPassword,
      resetPassword,
      logout,
    }),
    [
      isBootstrapping,
      user,
      applyUser,
      register,
      login,
      verifyOtp,
      resendOtp,
      forgotPassword,
      resetPassword,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
