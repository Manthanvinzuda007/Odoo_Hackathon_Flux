const API_BASE = '/api/v1';

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T = any>(
  endpoint: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers: extraHeaders, signal } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('bl_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  const init: RequestInit = {
    method,
    credentials: 'include',
    headers,
    signal,
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  let response = await fetch(url, init);

  if (response.status === 401) {
    // Try refresh
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshRes.ok) {
      const refreshedToken = sessionStorage.getItem('bl_token');
      if (refreshedToken) {
        headers['Authorization'] = `Bearer ${refreshedToken}`;
      }
      response = await fetch(url, init);
    } else {
      sessionStorage.removeItem('bl_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new ApiError(401, 'UNAUTHORIZED', 'Session expired');
    }
  }

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const error = err.error as Record<string, unknown> | undefined;
    throw new ApiError(
      response.status,
      (error?.code as string) || (err.message as string) || 'UNKNOWN',
      (error?.message as string) || (err.message as string) || 'Request failed',
      error?.details as Record<string, string[]> | undefined,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, 'GET', undefined, options),

  post: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'POST', body, options),

  put: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'PUT', body, options),

  patch: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'PATCH', body, options),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, 'DELETE', undefined, options),
};

export { ApiError };
export type { RequestOptions };
