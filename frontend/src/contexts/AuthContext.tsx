import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthState, User, LoginCredentials, RegisterData } from '../types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('wave_token'),
    refreshToken: localStorage.getItem('wave_refresh_token'),
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('wave_token');
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const user = await response.json();
            setState(prev => ({ ...prev, user, isAuthenticated: true, isLoading: false }));
          } else {
            throw new Error('Token invalid');
          }
        } catch {
          localStorage.removeItem('wave_token');
          localStorage.removeItem('wave_refresh_token');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('wave_token', data.access);
    localStorage.setItem('wave_refresh_token', data.refresh);
    setState({
      user: data.user,
      token: data.access,
      refreshToken: data.refresh,
      isAuthenticated: true,
      isLoading: false,
    });

    return data.user;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return await response.json();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wave_token');
    localStorage.removeItem('wave_refresh_token');
    setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const verifyOTP = useCallback(async (phone: string, otp: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });

    if (!response.ok) {
      throw new Error('OTP verification failed');
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Profile update failed');

    const updatedUser = await response.json();
    setState(prev => ({ ...prev, user: updatedUser }));
  }, [state.token]);

  const refreshAccessToken = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: state.refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('wave_token', data.access);
      setState(prev => ({ ...prev, token: data.access }));
    } else {
      logout();
    }
  }, [state.refreshToken, logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, verifyOTP, updateProfile, refreshAccessToken }}>
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
