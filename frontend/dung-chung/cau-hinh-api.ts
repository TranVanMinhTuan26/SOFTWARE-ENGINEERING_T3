export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiFetchOptions extends RequestInit {
  token?: string | null;
}

/**
 * Standardized API client with automatic token attachment and unified 401/403 error handling.
 */
export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, headers = {}, ...rest } = options;
  const url = endpoint.startsWith('http') ? endpoint : `${API}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const resolvedToken =
    token ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('brewlite-token') || localStorage.getItem('brewlite_token')
      : null);

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (resolvedToken && !reqHeaders.Authorization && !reqHeaders.authorization) {
    reqHeaders.Authorization = `Bearer ${resolvedToken}`;
  }

  const res = await fetch(url, {
    ...rest,
    headers: reqHeaders,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      // Clear expired session if 401 Unauthorized
      const currentToken = localStorage.getItem('brewlite-token') || localStorage.getItem('brewlite_token');
      if (currentToken) {
        localStorage.removeItem('brewlite-token');
        localStorage.removeItem('brewlite_token');
        localStorage.removeItem('brewlite-user');
        localStorage.removeItem('brewlite_user');
      }
    }
  }

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const errorMsg = data?.message || `Yêu cầu thất bại với mã lỗi HTTP ${res.status}`;
    const error: any = new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data as T;
}
