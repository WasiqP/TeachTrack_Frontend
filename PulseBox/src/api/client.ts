import { API_V1 } from './config';

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody | null, fallbackMessage: string) {
    const message = body?.error?.message ?? fallbackMessage;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.error?.code ?? 'UNKNOWN';
    this.fields = body?.error?.fields;
  }
}

type TokenGetter = () => string | null;
type TokenRefresher = () => Promise<string | null>;

let getAccessToken: TokenGetter = () => null;
let refreshAccessToken: TokenRefresher = async () => null;

/** Wire from AuthContext so every request can attach / refresh tokens. */
export function configureApiAuth(opts: {
  getAccessToken: TokenGetter;
  refreshAccessToken: TokenRefresher;
}) {
  getAccessToken = opts.getAccessToken;
  refreshAccessToken = opts.refreshAccessToken;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    /* ignore */
  }
  return new ApiError(res.status, body, res.statusText || 'Request failed');
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  /** Skip one retry after refresh (internal). */
  _retried?: boolean;
};

/**
 * JSON fetch against /v1. On 401 with auth, tries refresh once then retries.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, _retried = false } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_V1}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !_retried) {
    const next = await refreshAccessToken();
    if (next) {
      return apiRequest<T>(path, { ...options, _retried: true });
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/**
 * Multipart upload (do not set Content-Type — RN sets the boundary).
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(`${API_V1}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    const next = await refreshAccessToken();
    if (next) {
      headers.Authorization = `Bearer ${next}`;
      res = await fetch(`${API_V1}${path}`, {
        method: 'POST',
        headers,
        body: formData,
      });
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  return (await res.json()) as T;
}

export function peekAccessToken(): string | null {
  return getAccessToken();
}
