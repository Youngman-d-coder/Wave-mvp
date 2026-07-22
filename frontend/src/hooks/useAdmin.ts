import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { DashboardStats, Rider, Delivery, PaginatedResponse } from '../types';

export interface Transaction {
  id: string;
  type: 'payment' | 'commission' | 'payout' | 'withdrawal';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export function useAdmin() {
  const api = useApi();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const getDashboardStats = useCallback(async () => {
    const response = await api.get<DashboardStats>('/admin/dashboard/');
    if (response.success && response.data) setDashboardStats(response.data);
    return response;
  }, [api]);

  const getRiders = useCallback(async (filters?: Record<string, string>) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    const response = await api.get<PaginatedResponse<Rider>>(`/admin/riders/${query}`);
    if (response.success && response.data) setRiders(response.data.results || []);
    return response;
  }, [api]);

  const getCustomers = useCallback(async () => {
    const response = await api.get<PaginatedResponse<any>>('/admin/customers/');
    if (response.success && response.data) setCustomers(response.data.results || []);
    return response;
  }, [api]);

  const getDeliveries = useCallback(async (filters?: Record<string, string>) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    const response = await api.get<PaginatedResponse<Delivery>>(`/admin/deliveries/${query}`);
    if (response.success && response.data) setDeliveries(response.data.results || []);
    return response;
  }, [api]);

  const getTransactions = useCallback(async (period?: string) => {
    const query = period ? `?period=${period}` : '';
    const response = await api.get<PaginatedResponse<Transaction>>(`/admin/transactions/${query}`);
    if (response.success && response.data) setTransactions(response.data.results || []);
    return response;
  }, [api]);

  const updateRiderStatus = useCallback(async (riderId: string, status: string) => {
    return await api.patch(`/admin/riders/${riderId}/`, { status });
  }, [api]);

  const updatePricing = useCallback(async (config: any) => {
    return await api.post('/admin/pricing/', config);
  }, [api]);

  return {
    isLoading: api.isLoading,
    error: api.error,
    dashboardStats,
    riders,
    customers,
    deliveries,
    transactions,
    getDashboardStats,
    getRiders,
    getCustomers,
    getDeliveries,
    getTransactions,
    updateRiderStatus,
    updatePricing,
  };
}

export default useAdmin;