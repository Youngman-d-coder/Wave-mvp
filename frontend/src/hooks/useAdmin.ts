import { useCallback, useState } from 'react';
import { useApi } from './useApi';
import { DashboardStats, Rider, Delivery, PaginatedResponse, User, PricingConfig, VerificationStatus } from '../types';

export interface AdminWithdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  rider_name: string;
  rider_email: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  requested_at: string;
  processed_at: string | null;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'earning' | 'withdrawal';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export function useAdmin() {
  const { get, post, patch, isLoading, error } = useApi();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);

  const getDashboardStats = useCallback(async () => {
    const response = await get<DashboardStats>('/admin/dashboard/');
    if (response.success && response.data) setDashboardStats(response.data);
    return response;
  }, [get]);

  const getRiders = useCallback(async (filters?: Record<string, string>) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    const response = await get<PaginatedResponse<Rider>>(`/admin/riders/${query}`);
    if (response.success && response.data) setRiders(response.data.results || []);
    return response;
  }, [get]);

  const getCustomers = useCallback(async () => {
    const response = await get<PaginatedResponse<User>>('/admin/customers/');
    if (response.success && response.data) setCustomers(response.data.results || []);
    return response;
  }, [get]);

  const getDeliveries = useCallback(async (filters?: Record<string, string>) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    const response = await get<PaginatedResponse<Delivery>>(`/admin/deliveries/${query}`);
    if (response.success && response.data) setDeliveries(response.data.results || []);
    return response;
  }, [get]);

  const getTransactions = useCallback(async (period?: string) => {
    const query = period ? `?period=${encodeURIComponent(period)}` : '';
    const response = await get<PaginatedResponse<Transaction>>(`/admin/transactions/${query}`);
    if (response.success && response.data) setTransactions(response.data.results || []);
    return response;
  }, [get]);


  const getWithdrawals = useCallback(async (status?: AdminWithdrawal['status']) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await get<PaginatedResponse<AdminWithdrawal>>(`/admin/withdrawals/${query}`);
    if (response.success && response.data) setWithdrawals(response.data.results || []);
    return response;
  }, [get]);

  const updateWithdrawal = useCallback((withdrawalId: string, withdrawalStatus: 'processing' | 'completed' | 'rejected') => (
    patch<{ id: string; status: string }>(`/admin/withdrawals/${withdrawalId}/`, { status: withdrawalStatus })
  ), [patch]);

  const updateRiderStatus = useCallback((riderId: string, verificationStatus: VerificationStatus) => (
    patch(`/admin/riders/${riderId}/`, { status: verificationStatus })
  ), [patch]);

  const updatePricing = useCallback((config: PricingConfig) => post('/admin/pricing/', config), [post]);

  return { isLoading, error, dashboardStats, riders, customers, deliveries, transactions, withdrawals, getDashboardStats, getRiders, getCustomers, getDeliveries, getTransactions, getWithdrawals, updateWithdrawal, updateRiderStatus, updatePricing };
}

export default useAdmin;
