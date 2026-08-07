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
import { configureApiAuth } from '../api/client';
import * as authApi from '../api/auth';
import type { TokenResponse, UserOut } from '../api/auth';
import { useUser } from './UserContext';

const ACCESS_KEY = '@teachtrack_access_token';
const REFRESH_KEY = '@teachtrack_refresh_token';

type AuthContextValue = {
  user: UserOut | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<TokenResponse>;
  signUp: (name: string, email: string, password: string) => Promise<authApi.SignUpResponse>;
  verifyOtp: (email: string, code: string) => Promise<TokenResponse>;
  resendOtp: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Apply tokens from a TokenResponse (verify-otp / sign-in). */
  acceptSession: (tokens: TokenResponse) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { hydrateFromServer } = useUser();
  const [user, setUser] = useState<UserOut | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const accessRef = useRef<string | null>(null);
  const refreshRef = useRef<string | null>(null);
  accessRef.current = accessToken;
  refreshRef.current = refreshToken;

  const persistTokens = useCallback(async (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    accessRef.current = access;
    refreshRef.current = refresh;
    await AsyncStorage.multiSet([
      [ACCESS_KEY, access],
      [REFRESH_KEY, refresh],
    ]);
  }, []);

  const clearTokens = useCallback(async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    accessRef.current = null;
    refreshRef.current = null;
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
  }, []);

  const syncAfterAuth = useCallback(
    async (u: UserOut) => {
      setUser(u);
      await hydrateFromServer();
    },
    [hydrateFromServer],
  );

  const acceptSession = useCallback(
    async (tokens: TokenResponse) => {
      await persistTokens(tokens.access_token, tokens.refresh_token);
      await syncAfterAuth(tokens.user);
    },
    [persistTokens, syncAfterAuth],
  );

  const doRefresh = useCallback(async (): Promise<string | null> => {
    const rt = refreshRef.current;
    if (!rt) return null;
    try {
      const res = await authApi.refresh(rt);
      setAccessToken(res.access_token);
      accessRef.current = res.access_token;
      await AsyncStorage.setItem(ACCESS_KEY, res.access_token);
      return res.access_token;
    } catch {
      await clearTokens();
      return null;
    }
  }, [clearTokens]);

  useEffect(() => {
    configureApiAuth({
      getAccessToken: () => accessRef.current,
      refreshAccessToken: doRefresh,
    });
  }, [doRefresh]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [[, access], [, refresh]] = await AsyncStorage.multiGet([
          ACCESS_KEY,
          REFRESH_KEY,
        ]);
        if (cancelled) return;
        if (!refresh) {
          setIsBootstrapping(false);
          return;
        }
        setRefreshToken(refresh);
        refreshRef.current = refresh;
        if (access) {
          setAccessToken(access);
          accessRef.current = access;
        }
        const newAccess = await doRefresh();
        if (cancelled) return;
        if (!newAccess) {
          setIsBootstrapping(false);
          return;
        }
        const me = await authApi.getMe();
        if (cancelled) return;
        await syncAfterAuth(me);
      } catch {
        await clearTokens();
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.signIn({ email, password });
      await acceptSession(tokens);
      return tokens;
    },
    [acceptSession],
  );

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    return authApi.signUp({ name, email, password });
  }, []);

  const verifyOtp = useCallback(
    async (email: string, code: string) => {
      const tokens = await authApi.verifyOtp({ email, code });
      await acceptSession(tokens);
      return tokens;
    },
    [acceptSession],
  );

  const resendOtp = useCallback(async (email: string) => {
    await authApi.resendOtp(email);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authApi.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      await authApi.resetPassword({
        email,
        code,
        new_password: newPassword,
      });
    },
    [],
  );

  const logout = useCallback(async () => {
    const rt = refreshRef.current;
    try {
      if (rt) await authApi.logout(rt);
    } catch {
      /* always clear locally */
    }
    await clearTokens();
  }, [clearTokens]);

  const value = useMemo(
    () => ({
      user,
      isBootstrapping,
      isAuthenticated: !!user && !!accessToken,
      accessToken,
      signIn,
      signUp,
      verifyOtp,
      resendOtp,
      forgotPassword,
      resetPassword,
      logout,
      acceptSession,
    }),
    [
      user,
      isBootstrapping,
      accessToken,
      signIn,
      signUp,
      verifyOtp,
      resendOtp,
      forgotPassword,
      resetPassword,
      logout,
      acceptSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
