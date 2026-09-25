import { useCallback, useState } from 'react';
import { useApi } from './useApi';
import { Delivery, DeliveryCreateRequest, FareBreakdown, GeoLocation, PaginatedResponse } from '../types';

export function useDelivery() {
  const { get, post, isLoading, error } = useApi<Delivery>();
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<Delivery[]>([]);

  const calculateFare = useCallback(async (pickup: GeoLocation, dropoff: GeoLocation, weight: number): Promise<FareBreakdown | null> => {
    const response = await post<FareBreakdown>('/deliveries/calculate-fare/', { pickup, dropoff, weight });
    return response.success ? (response.data ?? null) : null;
  }, [post]);

  const createDelivery = useCallback(async (deliveryData: DeliveryCreateRequest): Promise<Delivery | null> => {
    const response = await post<Delivery>('/deliveries/', deliveryData);
    if (response.success && response.data) {
      setActiveDelivery(response.data);
      return response.data;
    }
    return null;
  }, [post]);

  const getDelivery = useCallback(async (id: string): Promise<Delivery | null> => {
    const response = await get<Delivery>(`/deliveries/${id}/`);
    if (response.success && response.data) {
      setActiveDelivery(response.data);
      return response.data;
    }
    return null;
  }, [get]);

  const cancelDelivery = useCallback(async (id: string, reason?: string) => {
    const response = await post(`/deliveries/${id}/cancel/`, { reason: reason ?? '' });
    if (response.success) setActiveDelivery(null);
    return response;
  }, [post]);

  const getHistory = useCallback(async (page = 1, limit = 10) => {
    const response = await get<PaginatedResponse<Delivery>>(`/deliveries/history/?page=${page}&limit=${limit}`);
    if (response.success && response.data) setDeliveryHistory(response.data.results || []);
    return response;
  }, [get]);

  const rateRider = useCallback(async (deliveryId: string, rating: number, review?: string) => (
    post(`/deliveries/${deliveryId}/rate/`, { rating, review: review ?? '' })
  ), [post]);

  return { isLoading, error, activeDelivery, deliveryHistory, calculateFare, createDelivery, getDelivery, cancelDelivery, getHistory, rateRider };
}

export default useDelivery;
