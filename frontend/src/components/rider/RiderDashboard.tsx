import React, { useEffect, useState } from 'react';
import { Package, MapPin, DollarSign, TrendingUp, Star, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useRider } from '../../hooks/useRider';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useToast } from '../../contexts/ToastContext';

interface DeliveryRequest {
  id: string;
  pickup: string;
  dropoff: string;
  distance: string;
  estimated_fare: number;
  package_type: string;
}

export const RiderDashboard: React.FC = () => {
  const { riderProfile, earnings, getProfile, getEarnings, acceptDelivery, rejectDelivery } = useRider();
  const { subscribe } = useWebSocket();
  const { showSuccess, showError } = useToast();
  const [deliveryRequest, setDeliveryRequest] = useState<DeliveryRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    getProfile();
    getEarnings();
  }, [getProfile, getEarnings]);

  useEffect(() => {
    const unsub = subscribe('delivery_request', (data) => {
      setDeliveryRequest(data);
    });
    return unsub;
  }, [subscribe]);

  const handleAccept = async () => {
    if (!deliveryRequest) return;
    setIsProcessing(true);
    const result = await acceptDelivery(deliveryRequest.id);
    setIsProcessing(false);
    if (result.success) {
      showSuccess('Delivery accepted!');
      setDeliveryRequest(null);
    } else {
      showError(result.message || 'Failed to accept delivery');
    }
  };

  const handleDecline = async () => {
    if (!deliveryRequest) return;
    setIsProcessing(true);
    const result = await rejectDelivery(deliveryRequest.id, 'Rider declined');
    setIsProcessing(false);
    if (result.success) {
      showSuccess('Delivery declined');
      setDeliveryRequest(null);
    } else {
      showError(result.message || 'Failed to decline delivery');
    }
  };

  if (!riderProfile) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Today's Earnings", value: `₦${earnings.today.toLocaleString()}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'This Week', value: `₦${earnings.week.toLocaleString()}`, icon: TrendingUp, color: 'text-wave-500', bg: 'bg-wave-100 dark:bg-wave-900/30' },
    { label: 'Rating', value: riderProfile.rating?.toFixed(1) || '0.0', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'Deliveries', value: riderProfile.stats?.successful_rides?.toString() || '0', icon: Package, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  ];

  const levelProgress = riderProfile.level === 'bronze' ? { current: 0, next: 50, label: 'Bronze', nextLabel: 'Silver' }
    : riderProfile.level === 'silver' ? { current: 50, next: 100, label: 'Silver', nextLabel: 'Gold' }
    : riderProfile.level === 'gold' ? { current: 100, next: 200, label: 'Gold', nextLabel: 'Platinum' }
    : riderProfile.level === 'platinum' ? { current: 200, next: 350, label: 'Platinum', nextLabel: 'Elite' }
    : { current: 350, next: 350, label: 'Elite', nextLabel: 'Max' };

  const deliveriesToNext = Math.max(0, levelProgress.next - (riderProfile.stats?.successful_rides || 0));
  const progressPercent = Math.min(100, ((riderProfile.stats?.successful_rides || 0) - levelProgress.current) / (levelProgress.next - levelProgress.current) * 100);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Good afternoon, {riderProfile.full_name}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Ready to make some deliveries today?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Delivery Request */}
      {deliveryRequest && (
        <Card className="p-6 border-2 border-wave-500 animate-bounce-in">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge variant="wave">New Request</Badge>
              <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white mt-2">
                Delivery Request #{deliveryRequest.id}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-wave-500">₦{deliveryRequest.estimated_fare.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{deliveryRequest.distance}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-wave-100 dark:bg-wave-900/30 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-wave-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pickup</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{deliveryRequest.pickup}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Drop-off</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{deliveryRequest.dropoff}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={handleDecline}
              isLoading={isProcessing}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Decline
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleAccept}
              isLoading={isProcessing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Delivery
            </Button>
          </div>
        </Card>
      )}

      {/* Level Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-bold text-gray-900 dark:text-white capitalize">
              {levelProgress.label} Rider
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {deliveriesToNext > 0 
                ? `${deliveriesToNext} more deliveries to reach ${levelProgress.nextLabel}`
                : 'You have reached the maximum level!'
              }
            </p>
          </div>
          <Badge variant="wave">{riderProfile.level}</Badge>
        </div>
        <ProgressBar progress={progressPercent} max={100} size="lg" variant="wave" showLabel />
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span className={riderProfile.level === 'bronze' ? 'text-wave-500 font-medium' : ''}>Bronze</span>
          <span className={riderProfile.level === 'silver' ? 'text-wave-500 font-medium' : ''}>Silver</span>
          <span className={riderProfile.level === 'gold' ? 'text-wave-500 font-medium' : ''}>Gold</span>
          <span className={riderProfile.level === 'platinum' ? 'text-wave-500 font-medium' : ''}>Platinum</span>
          <span className={riderProfile.level === 'elite' ? 'text-wave-500 font-medium' : ''}>Elite</span>
        </div>
      </Card>
    </div>
  );
};

export default RiderDashboard;