import React, { useEffect, useState } from 'react';
import { MapPin, Clock, Phone, MessageSquare, Package, CheckCircle, Star } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Rating } from '../../components/ui/Rating';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Map } from './Map';
import { Delivery, DeliveryStatus, GeoLocation } from '../../types';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface LiveTrackingProps {
  delivery: Delivery;
  onRateRider?: (rating: number, review?: string) => void;
}

const statusSteps: { status: DeliveryStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'rider_assigned', label: 'Rider Assigned', icon: <CheckCircle className="w-4 h-4" /> },
  { status: 'rider_arrived', label: 'Rider Arrived', icon: <MapPin className="w-4 h-4" /> },
  { status: 'picked_up', label: 'Picked Up', icon: <Package className="w-4 h-4" /> },
  { status: 'in_transit', label: 'In Transit', icon: <Clock className="w-4 h-4" /> },
  { status: 'delivered', label: 'Delivered', icon: <CheckCircle className="w-4 h-4" /> },
];

export const LiveTracking: React.FC<LiveTrackingProps> = ({ delivery, onRateRider }) => {
  const [riderLocation, setRiderLocation] = useState<GeoLocation | undefined>(delivery.rider?.current_location);
  const [currentStatus, setCurrentStatus] = useState<DeliveryStatus>(delivery.status);
  const [eta, setEta] = useState(delivery.estimated_duration);
  const { subscribe } = useWebSocket();
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribe('delivery_update', (data) => {
      if (data.delivery_id === delivery.id) {
        if (data.rider_location) setRiderLocation(data.rider_location);
        if (data.status) setCurrentStatus(data.status);
        if (data.eta) setEta(data.eta);
      }
    });
    return unsubscribe;
  }, [delivery.id, subscribe]);

  const currentStepIndex = statusSteps.findIndex(s => s.status === currentStatus);
  const isDelivered = currentStatus === 'delivered';

  const handleSubmitRating = () => {
    if (rating === 0) return;
    onRateRider?.(rating, review);
    setShowRating(false);
    setRating(0);
    setReview('');
    setHoverRating(0);
  };

  const handleSkipRating = () => {
    setShowRating(false);
    setRating(0);
    setReview('');
    setHoverRating(0);
  };

  return (
    <div className="space-y-6">
      {/* Map */}
      <div className="h-64 sm:h-80 rounded-2xl overflow-hidden">
        <Map
          pickup={delivery.pickup?.coordinates}
          dropoff={delivery.dropoff?.coordinates}
          riderLocation={riderLocation}
          showRoute={true}
          interactive={false}
        />
      </div>

      {/* Rider Card */}
      {delivery.rider && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Avatar 
              src={delivery.rider.avatar} 
              name={delivery.rider.full_name || 'Rider'} 
              size="lg" 
              status={delivery.rider.is_online ? 'online' : 'offline'} 
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {delivery.rider.full_name || 'Your Rider'}
                </h3>
                {delivery.rider.is_verified && (
                  <span className="text-wave-500">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                )}
              </div>
              <Rating 
                rating={delivery.rider.rating || 0} 
                reviewCount={delivery.rider.total_reviews || 0} 
                size="sm" 
              />
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{(delivery.rider.stats?.total_kilometers || 0).toFixed(1)} km driven</span>
                <span>{delivery.rider.stats?.successful_rides || 0} deliveries</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                onClick={() => delivery.rider?.phone && window.open(`tel:${delivery.rider.phone}`, '_self')}
                disabled={!delivery.rider.phone}
              >
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <MessageSquare className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Status Timeline */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-gray-900 dark:text-white">Delivery Status</h3>
          <StatusBadge status={currentStatus} />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-dark-border" />
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.status} className="relative flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    isCompleted 
                      ? 'bg-wave-500 text-white' 
                      : 'bg-gray-200 dark:bg-dark-border text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-wave-500/20' : ''}`}>
                    {step.icon}
                  </div>
                  <div>
                    <p className={`font-medium ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                      {step.label}
                    </p>
                    {isCurrent && eta && (
                      <p className="text-sm text-wave-500">
                        ETA: {Math.ceil(eta / 60)} mins
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Rating Section */}
      {isDelivered && onRateRider && !showRating && (
        <Card className="p-6 text-center">
          <h3 className="font-heading font-bold text-gray-900 dark:text-white mb-2">
            Delivery Complete! 🎉
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            How was your experience with {delivery.rider?.full_name || 'your rider'}?
          </p>
          <Button onClick={() => setShowRating(true)} variant="primary">
            Rate Rider
          </Button>
        </Card>
      )}

      {showRating && (
        <Card className="p-6">
          <h3 className="font-heading font-bold text-gray-900 dark:text-white mb-4 text-center">
            Rate Your Delivery
          </h3>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className={`text-3xl transition-transform hover:scale-110 ${
                  star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mb-4">
            {rating > 0 ? ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'][rating - 1] : 'Tap a star to rate'}
          </p>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell us about your experience (optional)"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 resize-none mb-4"
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={handleSkipRating}>
              Skip
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={rating === 0}
              className="flex-1"
            >
              Submit Review
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LiveTracking;