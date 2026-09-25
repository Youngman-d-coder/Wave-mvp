import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

type SocketPayload = unknown;
type Subscriber = (data: SocketPayload) => void;

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: unknown;
  subscribe: (channel: string, callback: Subscriber) => () => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<Subscriber>>>(new Map());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(false);
  const tokenRef = useRef(token);

  useEffect(() => { tokenRef.current = token; }, [token]);

  const connect = useCallback(() => {
    const currentToken = tokenRef.current;
    if (!shouldReconnectRef.current || !currentToken || [WebSocket.OPEN, WebSocket.CONNECTING].includes(wsRef.current?.readyState ?? -1)) return;

    const ws = new WebSocket(`${WS_BASE_URL}/?token=${encodeURIComponent(currentToken)}`);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data) as { type?: string; data?: unknown };
        setLastMessage(message);
        if (message.type) subscribersRef.current.get(message.type)?.forEach(cb => cb(message.data));
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };
    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      setIsConnected(false);
      if (shouldReconnectRef.current) reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    shouldReconnectRef.current = isAuthenticated;
    if (isAuthenticated) connect();
    else {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
      wsRef.current?.close();
      wsRef.current = null;
      setIsConnected(false);
    }

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, isAuthenticated]);

  const reconnect = useCallback(() => {
    if (!isAuthenticated || !tokenRef.current) return;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = null;
    shouldReconnectRef.current = true;

    const current = wsRef.current;
    if (current) {
      current.onclose = null;
      current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    connect();
  }, [connect, isAuthenticated]);

  const subscribe = useCallback((channel: string, callback: Subscriber) => {
    if (!subscribersRef.current.has(channel)) subscribersRef.current.set(channel, new Set());
    subscribersRef.current.get(channel)!.add(callback);
    return () => subscribersRef.current.get(channel)?.delete(callback);
  }, []);

  return <WebSocketContext.Provider value={{ isConnected, lastMessage, subscribe, reconnect }}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
};

export default WebSocketContext;
