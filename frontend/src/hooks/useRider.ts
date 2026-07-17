import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { Rider, Withdrawal, BankAccount, PaginatedResponse } from '../types';

interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  total: number;
}

export function useRider() {
  const api = useApi<Rider>();
  const [riderProfile, setRiderProfile] = useState<Rider | null>(null);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const getProfile = useCallback(async () => {
    const response = await api.get<Rider>('/riders/profile/');
    if (response.success && response.data) {
      setRiderProfile(response.data);
    }
    return response;
  }, [api]);

  const toggleOnline = useCallback(async (isOnline: boolean) => {
    const response = await api.post<Rider>('/riders/toggle-status/', { is_online: isOnline });
    if (response.success && response.data) {
      setRiderProfile(prev => prev ? { ...prev, is_online: isOnline } : null);
    }
    return response;
  }, [api]);

  const acceptDelivery = useCallback(async (deliveryId: string) => {
    return await api.post(`/riders/deliveries/${deliveryId}/accept/`);
  }, [api]);

  const rejectDelivery = useCallback(async (deliveryId: string, reason?: string) => {
    return await api.post(`/riders/deliveries/${deliveryId}/reject/`, { reason });
  }, [api]);

  const updateDeliveryStatus = useCallback(async (deliveryId: string, status: string, location?: any) => {
    return await api.post(`/riders/deliveries/${deliveryId}/update-status/`, { status, location });
  }, [api]);

  const getEarnings = useCallback(async () => {
    const response = await api.get<EarningsSummary>('/riders/earnings/');
    if (response.success && response.data) {
      setEarnings(response.data);
    }
    return response;
  }, [api]);

  const getWithdrawals = useCallback(async () => {
    const response = await api.get<PaginatedResponse<Withdrawal>>('/riders/withdrawals/');
    if (response.success && response.data) {
      setWithdrawals(response.data.results || []);
    }
    return response;
  }, [api]);

  const requestWithdrawal = useCallback(async (amount: number, bankAccountId: string) => {
    return await api.post('/riders/withdrawals/', { amount, bank_account_id: bankAccountId });
  }, [api]);

  const addBankAccount = useCallback(async (account: Omit<BankAccount, 'id'>) => {
    return await api.post('/riders/bank-accounts/', account);
  }, [api]);

  return {
    isLoading: api.isLoading,
    error: api.error,
    riderProfile,
    earnings,
    withdrawals,
    getProfile,
    toggleOnline,
    acceptDelivery,
    rejectDelivery,
    updateDeliveryStatus,
    getEarnings,
    getWithdrawals,
    requestWithdrawal,
    addBankAccount,
  };
}

export default useRider;
