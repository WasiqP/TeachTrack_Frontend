import { API_BASE, API_ORIGIN } from '../config/api';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

let refreshInFlight: Promise<boolean> | null = null;

type TokensLike = { accessToken?: string; refreshToken?: string };

async function parseBody(res: Response): Promise<Envelope<unknown>> {
  const text = await res.text();
  if (!text) return { success: res.ok };
  try {
    return JSON.parse(text) as Envelope<unknown>;
  } catch {
    return {
      success: false,
      error: { code: 'INVALID_RESPONSE', message: text.slice(0, 180) || res.statusText },
    };
  }
}

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const body = await parseBody(res);
      const d = body.data as Record<string, unknown> | undefined;
      const nested = d?.tokens as TokensLike | undefined;
      const tokens: TokensLike | undefined =
        nested?.accessToken
          ? nested
          : typeof d?.accessToken === 'string'
            ? (d as TokensLike)
            : undefined;
      if (!body.success || !tokens?.accessToken) {
        await clearTokens();
        return false;
      }
      await setTokens(tokens.accessToken, tokens.refreshToken ?? refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

type RequestOpts = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  formData?: FormData;
  retried?: boolean;
};

export async function apiRequest<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = 'GET', body, auth = true, formData, retried } = opts;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (!formData) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: formData ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch {
    throw new ApiError(
      'NETWORK',
      `Can't reach the FastAPI server at ${API_ORIGIN}. Start uvicorn on port 8000. On the Android emulator use 10.0.2.2, not localhost.`,
      0,
    );
  }

  const parsed = await parseBody(res);
  const errCode = parsed.error?.code ?? '';
  const shouldRefresh =
    auth &&
    !retried &&
    res.status === 401 &&
    (errCode === 'UNAUTHORIZED' || errCode === '' || errCode === 'TOKEN_EXPIRED');
  if (shouldRefresh) {
    const ok = await tryRefresh();
    if (ok) return apiRequest<T>(path, { ...opts, retried: true });
  }
  if (!res.ok || parsed.success === false) {
    throw new ApiError(
      parsed.error?.code ?? 'ERROR',
      parsed.error?.message ?? `Request failed (${res.status})`,
      res.status,
    );
  }
  return parsed.data as T;
}

export const api = {
  get: <T>(path: string, auth = true) => apiRequest<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  del: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) =>
    apiRequest<T>(path, { method: 'POST', formData }),
};

export function unwrapResource<T>(data: unknown, key: string): T {
  if (data && typeof data === 'object' && key in (data as object)) {
    const inner = (data as Record<string, unknown>)[key];
    if (inner != null) return inner as T;
  }
  return data as T;
}

export function asList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)[key])) {
    return (data as Record<string, T[]>)[key];
  }
  return [];
}

export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
