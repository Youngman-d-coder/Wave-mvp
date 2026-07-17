import React from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastContext';
import { WebSocketProvider } from './WebSocketContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppProvider;
