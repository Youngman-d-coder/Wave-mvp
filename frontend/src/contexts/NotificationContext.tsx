import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './WebSocketContext';

export interface Notification {
  id: string;
  type: 'delivery' | 'payment' | 'system' | 'promo' | 'message';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'created_at'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem('wave_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const { subscribe } = useWebSocket();

  // Persist notifications
  useEffect(() => {
    localStorage.setItem('wave_notifications', JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  // Listen for WebSocket notifications
  useEffect(() => {
    const unsub = subscribe('notification', (data) => {
      const newNotification: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: data.type || 'system',
        title: data.title || 'Notification',
        message: data.message || '',
        read: false,
        created_at: new Date().toISOString(),
        data: data.data,
      };
      setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    });
    return unsub;
  }, [subscribe]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'created_at'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead,
      removeNotification,
      addNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export default NotificationContext;