import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { Delivery, FareBreakdown, GeoLocation, PaginatedResponse } from '../types';

export function useDelivery() {
  const api = useApi<Delivery>();
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<Delivery[]>([]);

  const calculateFare = useCallback(async (
    pickup: GeoLocation,
    dropoff: GeoLocation,
    weight: number
  ): Promise<FareBreakdown | null> => {
    const response = await api.post<FareBreakdown>('/deliveries/calculate-fare/', {
      pickup,
      dropoff,
      weight,
    });
    return response.success ? response.data : null;
  }, [api]);

  const createDelivery = useCallback(async (deliveryData: Partial<Delivery>): Promise<Delivery | null> => {
    const response = await api.post<Delivery>('/deliveries/', deliveryData);
    if (response.success && response.data) {
      setActiveDelivery(response.data);
      return response.data;
    }
    return null;
  }, [api]);

  const getDelivery = useCallback(async (id: string): Promise<Delivery | null> => {
    const response = await api.get<Delivery>(`/deliveries/${id}/`);
    if (response.success && response.data) {
      setActiveDelivery(response.data);
      return response.data;
    }
    return null;
  }, [api]);

  const cancelDelivery = useCallback(async (id: string, reason?: string) => {
    const response = await api.post(`/deliveries/${id}/cancel/`, { reason });
    if (response.success) {
      setActiveDelivery(null);
    }
    return response;
  }, [api]);

  const getHistory = useCallback(async (page: number = 1, limit: number = 10) => {
    const response = await api.get<PaginatedResponse<Delivery>>(`/deliveries/history/?page=${page}&limit=${limit}`);
    if (response.success && response.data) {
      setDeliveryHistory(response.data.results || []);
    }
    return response;
  }, [api]);

  const rateRider = useCallback(async (deliveryId: string, rating: number, review?: string) => {
    return await api.post(`/deliveries/${deliveryId}/rate/`, { rating, review });
  }, [api]);

  return {
    isLoading: api.isLoading,
    error: api.error,
    activeDelivery,
    deliveryHistory,
    calculateFare,
    createDelivery,
    getDelivery,
    cancelDelivery,
    getHistory,
    rateRider,
  };
}

export default useDelivery;
