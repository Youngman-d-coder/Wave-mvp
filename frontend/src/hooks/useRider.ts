import { useCallback, useState } from 'react';
import { useApi } from './useApi';
import { Rider, Withdrawal, BankAccount, PaginatedResponse, DeliveryRequest, DeliveryStatus, GeoLocation } from '../types';

export interface EarningsSummary { today: number; week: number; month: number; last_month: number; total: number; }

export function useRider() {
  const { get, post, isLoading, error } = useApi<Rider>();
  const [riderProfile, setRiderProfile] = useState<Rider | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary>({ today: 0, week: 0, month: 0, last_month: 0, total: 0 });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const getProfile = useCallback(async () => {
    const response = await get<Rider>('/riders/profile/');
    if (response.success && response.data) setRiderProfile(response.data);
    return response;
  }, [get]);

  const toggleOnline = useCallback(async (isOnline: boolean) => {
    const response = await post<Rider>('/riders/toggle-status/', { is_online: isOnline });
    if (response.success) setRiderProfile(prev => prev ? { ...prev, is_online: isOnline, status: isOnline ? 'online' : 'offline' } : null);
    return response;
  }, [post]);

  const getAvailableDeliveries = useCallback(async () => {
    const response = await get<{ count: number; results: DeliveryRequest[] }>('/riders/deliveries/available/');
    return response.success ? (response.data?.results ?? []) : [];
  }, [get]);

  const acceptDelivery = useCallback((deliveryId: string) => post(`/riders/deliveries/${deliveryId}/accept/`), [post]);
  const rejectDelivery = useCallback((deliveryId: string, reason?: string) => post(`/riders/deliveries/${deliveryId}/reject/`, { reason: reason ?? '' }), [post]);
  const updateDeliveryStatus = useCallback((deliveryId: string, status: DeliveryStatus, location?: GeoLocation) => post(`/riders/deliveries/${deliveryId}/update-status/`, { status, ...(location ? { location } : {}) }), [post]);

  const getEarnings = useCallback(async () => {
    const response = await get<EarningsSummary>('/riders/earnings/');
    if (response.success && response.data) setEarnings(response.data);
    return response;
  }, [get]);

  const getWithdrawals = useCallback(async () => {
    const response = await get<PaginatedResponse<Withdrawal>>('/riders/withdrawals/');
    if (response.success && response.data) setWithdrawals(response.data.results || []);
    return response;
  }, [get]);

  const requestWithdrawal = useCallback((amount: number, bankAccountId: string) => post('/riders/withdrawals/', { amount, bank_account_id: bankAccountId }), [post]);
  const addBankAccount = useCallback((account: Omit<BankAccount, 'id'>) => post('/riders/bank-accounts/', account), [post]);

  return { isLoading, error, riderProfile, earnings, withdrawals, getProfile, toggleOnline, getAvailableDeliveries, acceptDelivery, rejectDelivery, updateDeliveryStatus, getEarnings, getWithdrawals, requestWithdrawal, addBankAccount };
}

export default useRider;
