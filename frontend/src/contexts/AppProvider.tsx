import React from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastContext';
import { NotificationProvider } from './NotificationContext';
import { WebSocketProvider } from './WebSocketContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <WebSocketProvider>
              {children}
            </WebSocketProvider>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppProvider;