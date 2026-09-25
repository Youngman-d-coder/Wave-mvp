import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthState, User, LoginCredentials, RegisterData } from '../types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<Record<string, unknown>>;
  logout: () => void;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  resendOTP: (phone: string) => Promise<Record<string, unknown>>;
  updateProfile: (data: Partial<Pick<User, 'full_name'>>) => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const data = payload as Record<string, unknown>;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.detail === 'string') return data.detail;

  for (const [field, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0) {
      return `${field.replace(/_/g, ' ')}: ${String(value[0])}`;
    }
    if (typeof value === 'string') return `${field.replace(/_/g, ' ')}: ${value}`;
  }
  return fallback;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('wave_token'),
    refreshToken: localStorage.getItem('wave_refresh_token'),
    isAuthenticated: false,
    isLoading: true,
  });

  const logout = useCallback(() => {
    localStorage.removeItem('wave_token');
    localStorage.removeItem('wave_refresh_token');
    localStorage.removeItem('wave_debug_otp');
    setState({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refresh = localStorage.getItem('wave_refresh_token');
    if (!refresh) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) {
        logout();
        return null;
      }

      const data = await response.json() as { access: string; refresh?: string };
      localStorage.setItem('wave_token', data.access);
      const rotatedRefresh = data.refresh ?? refresh;
      localStorage.setItem('wave_refresh_token', rotatedRefresh);
      setState(prev => ({ ...prev, token: data.access, refreshToken: rotatedRefresh }));
      return data.access;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = async (accessToken: string): Promise<User | null> => {
      const response = await fetch(`${API_BASE_URL}/auth/me/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.ok ? await response.json() as User : null;
    };

    const initAuth = async () => {
      try {
        let token = localStorage.getItem('wave_token');
        let user = token ? await loadCurrentUser(token) : null;

        if (!user && localStorage.getItem('wave_refresh_token')) {
          token = await refreshAccessToken();
          user = token ? await loadCurrentUser(token) : null;
        }

        if (cancelled) return;
        if (user && token) {
          setState(prev => ({ ...prev, user, token, isAuthenticated: true, isLoading: false }));
        } else {
          localStorage.removeItem('wave_token');
          localStorage.removeItem('wave_refresh_token');
          setState({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        }
      } catch {
        if (!cancelled) logout();
      }
    };

    void initAuth();
    return () => { cancelled = true; };
  }, [logout, refreshAccessToken]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = Object.assign(new Error(getErrorMessage(data, 'Login failed')), { data });
      throw error;
    }

    const result = data as { access: string; refresh: string; user: User };
    localStorage.setItem('wave_token', result.access);
    localStorage.setItem('wave_refresh_token', result.refresh);
    setState({ user: result.user, token: result.access, refreshToken: result.refresh, isAuthenticated: true, isLoading: false });
    return result.user;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getErrorMessage(result, 'Registration failed'));
    return result as Record<string, unknown>;
  }, []);

  const verifyOTP = useCallback(async (phone: string, otp: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getErrorMessage(result, 'OTP verification failed'));
  }, []);

  const resendOTP = useCallback(async (phone: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getErrorMessage(result, 'Could not resend OTP'));
    return result as Record<string, unknown>;
  }, []);

  const updateProfile = useCallback(async (data: Partial<Pick<User, 'full_name'>>) => {
    let token = localStorage.getItem('wave_token');
    if (!token) throw new Error('Please sign in again.');

    let response = await fetch(`${API_BASE_URL}/auth/profile/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (response.status === 401) {
      token = await refreshAccessToken();
      if (!token) throw new Error('Your session has expired.');
      response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getErrorMessage(result, 'Profile update failed'));
    setState(prev => ({ ...prev, user: result as User }));
  }, [refreshAccessToken]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, verifyOTP, resendOTP, updateProfile, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
