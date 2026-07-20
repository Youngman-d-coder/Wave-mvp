import React, { useState, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { Map } from '../../components/customer/Map';
import { BookingForm } from '../../components/customer/BookingForm';
import { Card } from '../../components/ui/Card';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useDelivery } from '../../hooks/useDelivery';
import { useToast } from '../../contexts/ToastContext';
import { GeoLocation } from '../../types';

export const CustomerHome: React.FC = () => {
  const { location } = useGeolocation();
  const { calculateFare, createDelivery, error } = useDelivery();
  const { showSuccess, showError } = useToast();

  const [pickup, setPickup] = useState<GeoLocation | null>(null);
  const [dropoff, setDropoff] = useState<GeoLocation | null>(null);
  const [fare, setFare] = useState<{ total: number; currency: string } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff'>('pickup');

  // Set initial pickup to current location
  useEffect(() => {
    if (location && !pickup) {
      setPickup(location);
    }
  }, [location, pickup]);

  // Calculate fare when locations change
  useEffect(() => {
    const calcFare = async () => {
      if (pickup && dropoff) {
        setIsCalculating(true);
        const result = await calculateFare(pickup, dropoff, 1);
        if (result) {
          setFare({ total: result.total, currency: result.currency });
        }
        setIsCalculating(false);
      }
    };
    calcFare();
  }, [pickup, dropoff, calculateFare]);

  const handleMapClick = useCallback((loc: GeoLocation) => {
    if (mapMode === 'pickup') {
      setPickup(loc);
      setMapMode('dropoff');
    } else {
      setDropoff(loc);
    }
  }, [mapMode]);

  const handleBookingSubmit = useCallback(async (bookingData: any) => {
    if (!pickup || !dropoff) return;

    const delivery = await createDelivery({
      pickup: { coordinates: pickup },
      dropoff: { coordinates: dropoff },
      ...bookingData,
    });

    if (delivery) {
      showSuccess('Delivery booked successfully! Redirecting to tracking...');
      // Navigate to tracking
      window.location.href = `/customer/tracking/${delivery.id}`;
    } else if (error) {
      showError(error);
    }
  }, [pickup, dropoff, createDelivery, error, showSuccess, showError]);

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-6rem)]">
      {/* Map Section */}
      <div className="lg:col-span-2 relative">
        <Map
          center={pickup || location || undefined}
          pickup={pickup || undefined}
          dropoff={dropoff || undefined}
          onMapClick={handleMapClick}
          showRoute={!!pickup && !!dropoff}
          className="h-full min-h-[400px]"
        />

        {/* Map Mode Indicator */}
        <div className="absolute top-4 left-4 z-10">
          <Card className="p-3 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${mapMode === 'pickup' ? 'bg-wave-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {mapMode === 'pickup' ? 'Tap to set pickup' : 'Tap to set drop-off'}
            </span>
          </Card>
        </div>
      </div>

      {/* Booking Form Section */}
      <div className="lg:col-span-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          {/* Quick Location Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setMapMode('pickup')}
              className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                mapMode === 'pickup' 
                  ? 'border-wave-500 bg-wave-50 dark:bg-wave-900/20' 
                  : 'border-gray-200 dark:border-dark-border'
              }`}
            >
              <MapPin className="w-4 h-4 text-wave-500" />
              <span className="text-sm font-medium">Pickup</span>
            </button>
            <button
              onClick={() => setMapMode('dropoff')}
              className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                mapMode === 'dropoff' 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-200 dark:border-dark-border'
              }`}
            >
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Drop-off</span>
            </button>
          </div>

          {/* Booking Form */}
          <BookingForm
            pickup={pickup}
            dropoff={dropoff}
            onSubmit={handleBookingSubmit}
            fare={fare}
            isCalculating={isCalculating}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
