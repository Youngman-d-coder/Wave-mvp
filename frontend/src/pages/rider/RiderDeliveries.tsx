import React, { useCallback, useEffect } from 'react';
import { Package, MapPin, CheckCircle, XCircle, Navigation } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDelivery } from '../../hooks/useDelivery';
import { useRider } from '../../hooks/useRider';
import { useToast } from '../../contexts/ToastContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import type { Delivery, DeliveryStatus } from '../../types';

const ACTIVE = new Set<DeliveryStatus>(['rider_assigned', 'rider_arrived', 'picked_up', 'in_transit', 'near_destination']);
const NEXT_STATUS: Partial<Record<DeliveryStatus, { status: DeliveryStatus; label: string }>> = {
  rider_assigned: { status: 'rider_arrived', label: 'Mark Arrived' },
  rider_arrived: { status: 'picked_up', label: 'Confirm Pickup' },
  picked_up: { status: 'in_transit', label: 'Start Delivery' },
  in_transit: { status: 'near_destination', label: 'Near Destination' },
  near_destination: { status: 'delivered', label: 'Complete Delivery' },
};

export const RiderDeliveries: React.FC = () => {
  const { deliveryHistory, getHistory, isLoading } = useDelivery();
  const { updateDeliveryStatus } = useRider();
  const { location } = useGeolocation();
  const { showSuccess, showError } = useToast();

  const reload = useCallback(() => { void getHistory(1, 100); }, [getHistory]);
  useEffect(reload, [reload]);

  const changeStatus = async (delivery: Delivery) => {
    const next = NEXT_STATUS[delivery.status];
    if (!next) return;
    const result = await updateDeliveryStatus(delivery.id, next.status, location ?? undefined);
    if (result.success) { showSuccess(`Status updated to ${next.label.toLowerCase()}.`); reload(); }
    else showError(result.message || 'Could not update delivery status.');
  };

  const openNavigation = (delivery: Delivery) => {
    const target = delivery.status === 'rider_assigned' ? delivery.pickup.coordinates : delivery.dropoff.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`, '_blank', 'noopener,noreferrer');
  };

  const active = deliveryHistory.filter(d => ACTIVE.has(d.status));
  const completed = deliveryHistory.filter(d => d.status === 'delivered');
  const cancelled = deliveryHistory.filter(d => ['cancelled', 'failed'].includes(d.status));

  const DeliveryCard = ({ delivery, actions = false }: { delivery: Delivery; actions?: boolean }) => (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3"><div><div className="flex items-center gap-2"><span className="font-mono text-sm text-gray-500">#{delivery.tracking_number}</span><StatusBadge status={delivery.status} /></div><p className="text-sm text-gray-500 mt-1">{delivery.package.type.replace(/_/g, ' ')} · {delivery.estimated_distance.toFixed(1)} km</p></div><span className="font-bold text-wave-500">₦{(delivery.fare.total * 0.9).toLocaleString()}</span></div>
      <div className="space-y-2 mb-4"><div className="flex gap-2 text-sm"><MapPin className="w-4 h-4 text-wave-500 shrink-0"/><span>{delivery.pickup.address}</span></div><div className="flex gap-2 text-sm"><MapPin className="w-4 h-4 text-red-500 shrink-0"/><span>{delivery.dropoff.address}</span></div></div>
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-dark-border"><div><p className="text-sm font-medium">{delivery.dropoff.contact_name}</p><p className="text-xs text-gray-500">{delivery.dropoff.contact_phone}</p></div>{actions && NEXT_STATUS[delivery.status] && <div className="flex gap-2"><Button variant="ghost" size="sm" className="p-2" onClick={() => openNavigation(delivery)} aria-label="Open navigation"><Navigation className="w-4 h-4"/></Button><Button size="sm" onClick={() => void changeStatus(delivery)}>{NEXT_STATUS[delivery.status]!.label}</Button></div>}</div>
    </Card>
  );

  const pane = (items: Delivery[], icon: React.ReactNode, title: string, description: string, actions = false) => items.length ? <div className="space-y-4">{items.map(d => <DeliveryCard key={d.id} delivery={d} actions={actions}/>)}</div> : <EmptyState icon={icon} title={title} description={description}/>;
  const tabs = [
    { id: 'active', label: `Active (${active.length})`, icon: <Package className="w-4 h-4"/>, content: pane(active, <Package className="w-12 h-12"/>, 'No active deliveries', 'Accepted deliveries will appear here.', true) },
    { id: 'completed', label: `Completed (${completed.length})`, icon: <CheckCircle className="w-4 h-4"/>, content: pane(completed, <CheckCircle className="w-12 h-12"/>, 'No completed deliveries', 'Completed deliveries will appear here.') },
    { id: 'cancelled', label: `Cancelled (${cancelled.length})`, icon: <XCircle className="w-4 h-4"/>, content: pane(cancelled, <XCircle className="w-12 h-12"/>, 'No cancelled deliveries', 'Cancelled or failed deliveries will appear here.') },
  ];

  return <div className="max-w-2xl mx-auto"><div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-heading font-bold">My Deliveries</h1>{isLoading && <span className="text-sm text-gray-500">Refreshing…</span>}</div><Tabs tabs={tabs} variant="underline" /></div>;
};

export default RiderDeliveries;
