import React, { useEffect } from 'react';
import { Activity, Bike, Package, Users } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { Card } from '../../components/ui/Card';

export const AdminAnalytics: React.FC = () => {
  const { dashboardStats, getDashboardStats, isLoading } = useAdmin();
  useEffect(() => { void getDashboardStats(); }, [getDashboardStats]);
  if (isLoading && !dashboardStats) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-dark-border animate-pulse rounded-xl"/>)}</div>;
  const stats = dashboardStats;
  if (!stats) return <Card className="p-8 text-center text-gray-500">Analytics could not be loaded.</Card>;
  const cards = [
    { label: 'Active Riders', value: stats.active_riders, icon: Bike },
    { label: 'Verified Customers', value: stats.active_customers, icon: Users },
    { label: 'Live Deliveries', value: stats.live_deliveries, icon: Package },
    { label: 'Today Delivered Value', value: `₦${stats.today_revenue.toLocaleString()}`, icon: Activity },
  ];
  return <div className="space-y-6"><div><h1 className="text-2xl font-heading font-bold">Analytics</h1><p className="text-sm text-gray-500 mt-1">Current operational metrics backed by recorded WAVE data.</p></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(card => <Card key={card.label} className="p-5"><card.icon className="w-6 h-6 text-wave-500 mb-3"/><p className="text-2xl font-bold">{card.value}</p><p className="text-sm text-gray-500">{card.label}</p></Card>)}</div><Card className="p-6"><h2 className="font-bold text-lg mb-4">Top Riders</h2>{stats.top_riders?.length ? <div className="space-y-3">{stats.top_riders.map((rider,index) => <div key={rider.id} className="flex justify-between border-b border-gray-100 dark:border-dark-border pb-3 last:border-0"><div><span className="text-sm text-gray-400 mr-3">#{index+1}</span><span className="font-medium">{rider.name}</span></div><div className="text-right"><p className="font-medium">{rider.deliveries} deliveries</p><p className="text-xs text-gray-500">₦{rider.earnings.toLocaleString()} earnings · {rider.rating.toFixed(1)}★</p></div></div>)}</div> : <p className="text-gray-500">No rider earnings recorded yet.</p>}</Card><p className="text-xs text-gray-500">Historical online-rider trend is intentionally omitted because the current data model stores only present online state, not daily snapshots.</p></div>;
};
export default AdminAnalytics;
