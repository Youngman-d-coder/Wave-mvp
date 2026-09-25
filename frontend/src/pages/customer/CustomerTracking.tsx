import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LiveTracking } from '../../components/customer/LiveTracking';
import { useDelivery } from '../../hooks/useDelivery';
import { useToast } from '../../contexts/ToastContext';
import { Delivery } from '../../types';

export const CustomerTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getDelivery, rateRider } = useDelivery();
  const { showSuccess, showError } = useToast();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) { setIsLoading(false); return; }
      setIsLoading(true);
      const result = await getDelivery(id);
      if (!cancelled) { setDelivery(result); setIsLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [getDelivery, id]);

  const handleRateRider = async (rating: number, review?: string) => {
    if (!delivery) return false;
    const result = await rateRider(delivery.id, rating, review);
    if (result.success) { showSuccess('Thank you for your feedback!'); return true; }
    showError(result.message || 'Could not submit your rating.');
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wave-500" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Delivery not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">
        Track Delivery
      </h1>
      <LiveTracking delivery={delivery} onRateRider={handleRateRider} />
    </div>
  );
};

export default CustomerTracking;
