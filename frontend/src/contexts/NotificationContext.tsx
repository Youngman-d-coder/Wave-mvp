import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  type: 'delivery' | 'payment' | 'system' | 'promo' | 'message';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
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

function parseStored(key: string): Notification[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as Notification[] : [];
  } catch {
    return [];
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const storageKey = useMemo(() => `wave_notifications_${user?.id ?? 'anonymous'}`, [user?.id]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => { setNotifications(parseStored(storageKey)); }, [storageKey]);
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, 50)));
  }, [notifications, storageKey, user]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'created_at'>) => {
    const item: Notification = {
      ...notification,
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [item, ...prev].slice(0, 50));
  }, []);

  useEffect(() => subscribe('delivery_update', data => {
    if (!data || typeof data !== 'object') return;
    const update = data as { delivery_id?: string; status?: string };
    if (!update.delivery_id || !update.status) return;
    addNotification({
      type: 'delivery',
      title: 'Delivery update',
      message: `Delivery status changed to ${update.status.replace(/_/g, ' ')}.`,
      data: data as Record<string, unknown>,
    });
  }), [addNotification, subscribe]);

  const markAsRead = useCallback((id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const markAllAsRead = useCallback(() => setNotifications(prev => prev.map(n => ({ ...n, read: true }))), []);
  const removeNotification = useCallback((id: string) => setNotifications(prev => prev.filter(n => n.id !== id)), []);
  const unreadCount = notifications.filter(n => !n.read).length;

  return <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, addNotification }}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export default NotificationContext;
