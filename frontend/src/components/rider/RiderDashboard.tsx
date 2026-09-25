import React, { useEffect, useMemo, useState } from 'react';
import { Package, MapPin, DollarSign, TrendingUp, Star, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useRider } from '../../hooks/useRider';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useToast } from '../../contexts/ToastContext';
import type { DeliveryRequest, RiderLevel } from '../../types';

const LEVELS: Record<RiderLevel, { start: number; next: number | null; nextLabel: string }> = {
  bronze: { start: 0, next: 15, nextLabel: 'Silver' },
  silver: { start: 15, next: 50, nextLabel: 'Gold' },
  gold: { start: 50, next: 100, nextLabel: 'Platinum' },
  platinum: { start: 100, next: 200, nextLabel: 'Elite' },
  elite: { start: 200, next: null, nextLabel: 'Max' },
};

function isDeliveryRequest(value: unknown): value is DeliveryRequest {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<DeliveryRequest>;
  return typeof item.id === 'string' && typeof item.pickup === 'string' && typeof item.dropoff === 'string' && typeof item.estimated_fare === 'number';
}

export const RiderDashboard: React.FC = () => {
  const { riderProfile, earnings, getProfile, getEarnings, getAvailableDeliveries, acceptDelivery, rejectDelivery } = useRider();
  const { subscribe } = useWebSocket();
  const { showSuccess, showError } = useToast();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { void getProfile(); void getEarnings(); }, [getProfile, getEarnings]);

  useEffect(() => {
    if (!riderProfile?.is_online || riderProfile.verification_status !== 'verified') {
      setRequests([]);
      return;
    }
    void getAvailableDeliveries().then(setRequests);
  }, [getAvailableDeliveries, riderProfile?.is_online, riderProfile?.verification_status]);

  useEffect(() => {
    const unsubRequest = subscribe('delivery_request', data => {
      if (!isDeliveryRequest(data)) return;
      setRequests(prev => prev.some(item => item.id === data.id) ? prev : [...prev, data]);
    });
    const unsubClosed = subscribe('delivery_request_closed', data => {
      if (!data || typeof data !== 'object') return;
      const id = (data as { delivery_id?: unknown }).delivery_id;
      if (typeof id === 'string') setRequests(prev => prev.filter(item => item.id !== id));
    });
    return () => { unsubRequest(); unsubClosed(); };
  }, [subscribe]);

  const deliveryRequest = requests[0] ?? null;

  const handleAccept = async () => {
    if (!deliveryRequest) return;
    setIsProcessing(true);
    const result = await acceptDelivery(deliveryRequest.id);
    setIsProcessing(false);
    if (result.success) {
      showSuccess('Delivery accepted.');
      setRequests(prev => prev.filter(item => item.id !== deliveryRequest.id));
    } else showError(result.message || 'Failed to accept delivery');
  };

  const handleDecline = async () => {
    if (!deliveryRequest) return;
    setIsProcessing(true);
    const result = await rejectDelivery(deliveryRequest.id, 'Rider declined');
    setIsProcessing(false);
    if (result.success) setRequests(prev => prev.filter(item => item.id !== deliveryRequest.id));
    else showError(result.message || 'Failed to decline delivery');
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  if (!riderProfile) return <div className="space-y-6"><SkeletonCard /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div></div>;

  const successful = riderProfile.stats?.successful_rides || 0;
  const level = LEVELS[riderProfile.level];
  const progressPercent = level.next === null ? 100 : Math.max(0, Math.min(100, ((successful - level.start) / (level.next - level.start)) * 100));
  const deliveriesToNext = level.next === null ? 0 : Math.max(0, level.next - successful);
  const stats = [
    { label: "Today's Earnings", value: `₦${earnings.today.toLocaleString()}`, icon: DollarSign },
    { label: 'This Week', value: `₦${earnings.week.toLocaleString()}`, icon: TrendingUp },
    { label: 'Rating', value: riderProfile.rating.toFixed(1), icon: Star },
    { label: 'Deliveries', value: successful.toString(), icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{greeting}, {riderProfile.full_name}</h1><p className="text-gray-500 dark:text-gray-400 mt-1">{riderProfile.verification_status === 'verified' ? 'Your live delivery workspace is ready.' : `Verification status: ${riderProfile.verification_status.replace('_', ' ')}`}</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{stats.map(stat => <Card key={stat.label} className="p-4"><stat.icon className="w-5 h-5 text-wave-500 mb-3"/><p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p><p className="text-sm text-gray-500">{stat.label}</p></Card>)}</div>

      {deliveryRequest && (
        <Card className="p-6 border-2 border-wave-500">
          <div className="flex items-start justify-between mb-4"><div><Badge variant="wave">New Request</Badge><h3 className="text-lg font-heading font-bold mt-2">Delivery Request</h3><p className="text-sm text-gray-500">{deliveryRequest.package_type}</p></div><div className="text-right"><p className="text-2xl font-bold text-wave-500">₦{(deliveryRequest.estimated_fare * 0.9).toLocaleString()}</p><p className="text-xs text-gray-500">Estimated rider payout · {deliveryRequest.distance}</p></div></div>
          <div className="space-y-3 mb-6"><div className="flex gap-3"><MapPin className="w-4 h-4 text-wave-500 mt-1"/><div><p className="text-xs text-gray-500">Pickup</p><p className="text-sm font-medium">{deliveryRequest.pickup}</p></div></div><div className="flex gap-3"><MapPin className="w-4 h-4 text-red-500 mt-1"/><div><p className="text-xs text-gray-500">Drop-off</p><p className="text-sm font-medium">{deliveryRequest.dropoff}</p></div></div></div>
          <div className="flex gap-3"><Button variant="secondary" className="flex-1" onClick={handleDecline} isLoading={isProcessing}><XCircle className="w-4 h-4 mr-2"/>Decline</Button><Button className="flex-1" onClick={handleAccept} isLoading={isProcessing}><CheckCircle className="w-4 h-4 mr-2"/>Accept</Button></div>
          {requests.length > 1 && <p className="text-xs text-gray-500 text-center mt-3">{requests.length - 1} more request{requests.length === 2 ? '' : 's'} waiting</p>}
        </Card>
      )}

      <Card className="p-6"><div className="flex items-center justify-between mb-4"><div><h3 className="font-heading font-bold capitalize">{riderProfile.level} Rider</h3><p className="text-sm text-gray-500">{level.next === null ? 'Maximum rider level reached.' : `${deliveriesToNext} more completed deliveries to reach ${level.nextLabel}.`}</p></div><Badge variant="wave">{riderProfile.level}</Badge></div><ProgressBar progress={progressPercent} max={100} size="lg" variant="wave" showLabel /></Card>
    </div>
  );
};

export default RiderDashboard;
