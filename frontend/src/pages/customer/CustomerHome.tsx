import React, { useCallback, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Map } from '../../components/customer/Map';
import { BookingForm, BookingData } from '../../components/customer/BookingForm';
import { Card } from '../../components/ui/Card';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useDelivery } from '../../hooks/useDelivery';
import { useToast } from '../../contexts/ToastContext';
import { GeoLocation } from '../../types';

export const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { location } = useGeolocation();
  const { calculateFare, createDelivery } = useDelivery();
  const { showSuccess, showError } = useToast();
  const [pickup, setPickup] = useState<GeoLocation | null>(null);
  const [dropoff, setDropoff] = useState<GeoLocation | null>(null);
  const [packageWeight, setPackageWeight] = useState(1);
  const [fare, setFare] = useState<{ total: number; currency: string } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff'>('pickup');

  useEffect(() => {
    if (location && !pickup) setPickup(location);
  }, [location, pickup]);

  useEffect(() => {
    let cancelled = false;
    const calcFare = async () => {
      if (!pickup || !dropoff || packageWeight <= 0) {
        setFare(null);
        return;
      }
      setIsCalculating(true);
      const result = await calculateFare(pickup, dropoff, packageWeight);
      if (!cancelled) {
        setFare(result ? { total: result.total, currency: result.currency } : null);
        setIsCalculating(false);
      }
    };
    void calcFare();
    return () => { cancelled = true; };
  }, [pickup, dropoff, packageWeight, calculateFare]);

  const handleMapClick = useCallback((loc: GeoLocation) => {
    if (mapMode === 'pickup') {
      setPickup(loc);
      setMapMode('dropoff');
    } else setDropoff(loc);
  }, [mapMode]);

  const handleBookingSubmit = useCallback(async (bookingData: BookingData) => {
    if (!pickup || !dropoff) {
      showError('Set both pickup and drop-off locations first.');
      return;
    }

    const delivery = await createDelivery({
      pickup: { coordinates: pickup },
      dropoff: { coordinates: dropoff },
      ...bookingData,
    });

    if (!delivery) {
      showError('The delivery could not be created. Check the details and try again.');
      return;
    }
    showSuccess('Delivery booked successfully.');
    navigate(`/customer/tracking/${delivery.id}`);
  }, [createDelivery, dropoff, navigate, pickup, showError, showSuccess]);

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-6rem)]">
      <div className="lg:col-span-2 relative">
        <Map center={pickup || location || undefined} pickup={pickup || undefined} dropoff={dropoff || undefined} onMapClick={handleMapClick} showRoute={!!pickup && !!dropoff} className="h-full min-h-[400px]" />
        <div className="absolute top-4 left-4 z-10">
          <Card className="p-3 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${mapMode === 'pickup' ? 'bg-wave-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mapMode === 'pickup' ? 'Tap to set pickup' : 'Tap to set drop-off'}</span>
          </Card>
        </div>
      </div>

      <div className="lg:col-span-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setMapMode('pickup')} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${mapMode === 'pickup' ? 'border-wave-500 bg-wave-50 dark:bg-wave-900/20' : 'border-gray-200 dark:border-dark-border'}`}>
              <MapPin className="w-4 h-4 text-wave-500" /><span className="text-sm font-medium">Pickup</span>
            </button>
            <button type="button" onClick={() => setMapMode('dropoff')} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${mapMode === 'dropoff' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-dark-border'}`}>
              <MapPin className="w-4 h-4 text-red-500" /><span className="text-sm font-medium">Drop-off</span>
            </button>
          </div>
          <BookingForm pickup={pickup} dropoff={dropoff} onSubmit={handleBookingSubmit} onDetailsChange={data => setPackageWeight(data.weight)} fare={fare} isCalculating={isCalculating} />
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
