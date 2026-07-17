import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface UseApiOptions {
  requireAuth?: boolean;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const { requireAuth = true } = options;
  const { token, refreshToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const request = useCallback(async <R = T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<R>> => {
    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...customHeaders,
      };

      if (requireAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        method,
        headers,
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (response.status === 401 && requireAuth) {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const { access } = await refreshResponse.json();
          localStorage.setItem('wave_token', access);
          headers['Authorization'] = `Bearer ${access}`;

          response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...config,
            headers,
          });
        }
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.detail || 'Request failed');
      }

      setData(result as T);
      return { success: true, data: result as R };
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, refreshToken, requireAuth]);

  const get = useCallback(<R = T>(endpoint: string) => request<R>(endpoint, 'GET'), [request]);
  const post = useCallback(<R = T>(endpoint: string, body?: any) => request<R>(endpoint, 'POST', body), [request]);
  const put = useCallback(<R = T>(endpoint: string, body?: any) => request<R>(endpoint, 'PUT', body), [request]);
  const patch = useCallback(<R = T>(endpoint: string, body?: any) => request<R>(endpoint, 'PATCH', body), [request]);
  const del = useCallback(<R = T>(endpoint: string) => request<R>(endpoint, 'DELETE'), [request]);

  return { isLoading, error, data, request, get, post, put, patch, del };
}

export default useApi;
