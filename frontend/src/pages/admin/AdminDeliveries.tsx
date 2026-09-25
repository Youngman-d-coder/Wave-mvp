import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { DeliveryStatus } from '../../types';

export const AdminDeliveries: React.FC = () => {
  const { deliveries, getDeliveries, isLoading } = useAdmin();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DeliveryStatus>('all');
  useEffect(() => { void getDeliveries(statusFilter === 'all' ? undefined : { status: statusFilter }); }, [getDeliveries, statusFilter]);
  const filtered = useMemo(() => deliveries.filter(delivery => `${delivery.tracking_number} ${delivery.customer.full_name} ${delivery.pickup.address} ${delivery.dropoff.address}`.toLowerCase().includes(query.toLowerCase())), [deliveries, query]);
  const statuses: Array<'all' | DeliveryStatus> = ['all','searching_rider','rider_assigned','picked_up','in_transit','near_destination','delivered','cancelled','failed'];

  return <div className="space-y-6"><h1 className="text-2xl font-heading font-bold">Deliveries</h1><div className="flex flex-col lg:flex-row gap-3"><div className="flex-1"><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tracking number, customer or address..." leftIcon={<Search className="w-5 h-5"/>}/></div><select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | DeliveryStatus)} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card"><option value="all">All statuses</option>{statuses.slice(1).map(status => <option key={status} value={status}>{status.replace(/_/g,' ')}</option>)}</select></div>{isLoading ? <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-dark-border animate-pulse"/>)}</div> : filtered.length === 0 ? <Card className="p-8 text-center text-gray-500">No deliveries match this view.</Card> : <div className="space-y-4">{filtered.map(delivery => <Card key={delivery.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="font-mono text-sm">#{delivery.tracking_number}</span><StatusBadge status={delivery.status}/></div><p className="text-sm text-gray-500 mt-1">{delivery.customer.full_name} · {delivery.rider?.full_name ?? 'No rider assigned'}</p></div><div className="text-right"><p className="font-bold text-wave-500">₦{delivery.fare.total.toLocaleString()}</p><p className="text-xs text-gray-500">{delivery.estimated_distance.toFixed(1)} km</p></div></div><div className="grid md:grid-cols-2 gap-3 mt-4 text-sm"><div className="flex gap-2"><MapPin className="w-4 h-4 text-wave-500 shrink-0 mt-0.5"/><span>{delivery.pickup.address}</span></div><div className="flex gap-2"><MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5"/><span>{delivery.dropoff.address}</span></div></div><p className="text-xs text-gray-400 mt-4">Created {new Date(delivery.created_at).toLocaleString()} · Payment: {delivery.payment.status}</p></Card>)}</div>}</div>;
};
export default AdminDeliveries;
