import { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface UseApiOptions { requireAuth?: boolean; }

function extractError(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Request failed';
  const data = payload as Record<string, unknown>;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.detail === 'string') return data.detail;
  for (const [field, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length) return `${field.replace(/_/g, ' ')}: ${String(value[0])}`;
    if (typeof value === 'string') return `${field.replace(/_/g, ' ')}: ${value}`;
  }
  return 'Request failed';
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/json')) {
    const statusText = response.statusText ? ` ${response.statusText}` : '';
    throw new Error(`Backend returned HTTP ${response.status}${statusText} instead of JSON.`);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Backend returned invalid JSON (HTTP ${response.status}).`);
  }
}

export function useApi<T = unknown>(options: UseApiOptions = {}) {
  const { requireAuth = true } = options;
  const { token, refreshAccessToken, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const request = useCallback(async <R = T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown,
    customHeaders?: Record<string, string>,
  ): Promise<ApiResponse<R>> => {
    setIsLoading(true);
    setError(null);

    try {
      const buildHeaders = (accessToken: string | null): Record<string, string> => ({
        'Content-Type': 'application/json',
        ...(requireAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...customHeaders,
      });

      const makeRequest = (accessToken: string | null) => fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: buildHeaders(accessToken),
        ...(body !== undefined && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
      });

      let response = await makeRequest(token);
      if (response.status === 401 && requireAuth) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          logout();
          throw new Error('Your session has expired. Please sign in again.');
        }
        response = await makeRequest(refreshed);
      }

      const result = await parseResponse(response);
      if (!response.ok) throw new Error(extractError(result));

      setData(result as T);
      return { success: true, data: result as R };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [logout, refreshAccessToken, requireAuth, token]);

  const get = useCallback(<R = T>(endpoint: string) => request<R>(endpoint, 'GET'), [request]);
  const post = useCallback(<R = T>(endpoint: string, body?: unknown) => request<R>(endpoint, 'POST', body), [request]);
  const put = useCallback(<R = T>(endpoint: string, body?: unknown) => request<R>(endpoint, 'PUT', body), [request]);
  const patch = useCallback(<R = T>(endpoint: string, body?: unknown) => request<R>(endpoint, 'PATCH', body), [request]);
  const del = useCallback(<R = T>(endpoint: string) => request<R>(endpoint, 'DELETE'), [request]);

  return { isLoading, error, data, request, get, post, put, patch, del };
}

export default useApi;
