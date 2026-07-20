import React, { useState } from 'react';
import { FavoriteRiders } from '../../components/customer/FavoriteRiders';
import { useToast } from '../../contexts/ToastContext';
import { Rider } from '../../types';

// Mock data - replace with API call
const mockRiders: Rider[] = [
  {
    id: '1',
    email: 'rider1@wave.com',
    phone: '+2348012345678',
    full_name: 'John Doe',
    avatar: '',
    user_type: 'rider',
    is_verified: true,
    created_at: '2026-01-15',
    updated_at: '2026-07-14',
    vehicle: { type: 'motorcycle', plate_number: 'ABC123' },
    documents: { id_card: '', driver_license: '', vehicle_registration: '' },
    wallet: { balance: 0, pending_balance: 0, currency: 'NGN' },
    stats: { total_kilometers: 1250, successful_rides: 150, failed_rides: 5, completion_rate: 96.7, average_rating: 4.8, total_earnings: 450000, total_commission_generated: 45000 },
    level: 'gold',
    is_online: true,
    rating: 4.8,
    total_reviews: 120,
    verification_status: 'verified',
  },
  {
    id: '2',
    email: 'rider2@wave.com',
    phone: '+2348098765432',
    full_name: 'Jane Smith',
    avatar: '',
    user_type: 'rider',
    is_verified: true,
    created_at: '2026-02-20',
    updated_at: '2026-07-14',
    vehicle: { type: 'bicycle', plate_number: 'XYZ789' },
    documents: { id_card: '', driver_license: '', vehicle_registration: '' },
    wallet: { balance: 0, pending_balance: 0, currency: 'NGN' },
    stats: { total_kilometers: 800, successful_rides: 95, failed_rides: 2, completion_rate: 97.9, average_rating: 4.9, total_earnings: 280000, total_commission_generated: 28000 },
    level: 'silver',
    is_online: false,
    rating: 4.9,
    total_reviews: 80,
    verification_status: 'verified',
  },
];

export const CustomerFavorites: React.FC = () => {
  const [riders, setRiders] = useState<Rider[]>(mockRiders);
  const { showSuccess } = useToast();

  const handleRemove = (riderId: string) => {
    setRiders(prev => prev.filter(r => r.id !== riderId));
    showSuccess('Removed from favorites');
  };

  const handleBook = (riderId: string) => {
    window.location.href = `/customer?rider=${riderId}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Favorite Riders
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {riders.length} saved
        </span>
      </div>
      <FavoriteRiders
        riders={riders}
        onRemove={handleRemove}
        onBook={handleBook}
      />
    </div>
  );
};

export default CustomerFavorites;
