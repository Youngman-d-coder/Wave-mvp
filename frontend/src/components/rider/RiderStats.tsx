import React, { useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Award, MapPin, Star } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRider } from '../../hooks/useRider';

export const RiderStats: React.FC = () => {
  const { riderProfile, earnings, getProfile, getEarnings } = useRider();
  useEffect(() => { void getProfile(); void getEarnings(); }, [getProfile, getEarnings]);

  if (!riderProfile) return <div className="max-w-4xl mx-auto space-y-6"><Skeleton className="h-10"/><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32"/>)}</div></div>;

  const stats = riderProfile.stats;
  const earningsChange = earnings.last_month === 0 ? (earnings.month > 0 ? 100 : 0) : ((earnings.month - earnings.last_month) / earnings.last_month) * 100;
  const performanceMetrics = [
    { label: 'Customer Satisfaction', value: Math.max(0, Math.min(100, riderProfile.rating * 20)), icon: Star },
    { label: 'Completion Rate', value: Math.max(0, Math.min(100, stats.completion_rate)), icon: Award },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-heading font-bold">Statistics</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Card className="p-4"><MapPin className="w-5 h-5 text-wave-500 mb-2"/><p className="text-2xl font-bold">{stats.total_kilometers.toFixed(1)}</p><p className="text-sm text-gray-500">Total km</p></Card><Card className="p-4"><Target className="w-5 h-5 text-green-500 mb-2"/><p className="text-2xl font-bold">{stats.successful_rides}</p><p className="text-sm text-gray-500">Completed</p></Card><Card className="p-4"><Star className="w-5 h-5 text-yellow-500 mb-2"/><p className="text-2xl font-bold">{riderProfile.rating.toFixed(1)}</p><p className="text-sm text-gray-500">Avg Rating</p></Card><Card className="p-4"><Award className="w-5 h-5 text-wave-500 mb-2"/><p className="text-2xl font-bold">₦{stats.total_earnings.toLocaleString()}</p><p className="text-sm text-gray-500">Total Earnings</p></Card></div>
      <Card className="p-6"><h3 className="font-heading font-bold text-lg mb-4">Earnings</h3><div className="grid sm:grid-cols-4 gap-5 text-center"><div><p className="text-sm text-gray-500">Today</p><p className="text-xl font-bold">₦{earnings.today.toLocaleString()}</p></div><div><p className="text-sm text-gray-500">This week</p><p className="text-xl font-bold">₦{earnings.week.toLocaleString()}</p></div><div><p className="text-sm text-gray-500">This month</p><p className="text-xl font-bold">₦{earnings.month.toLocaleString()}</p></div><div><p className="text-sm text-gray-500">vs last month</p><div className={`flex justify-center items-center gap-1 font-bold ${earningsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>{earningsChange >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}{Math.abs(earningsChange).toFixed(1)}%</div></div></div></Card>
      <Card className="p-6"><h3 className="font-heading font-bold text-lg mb-4">Measured Performance</h3><div className="space-y-4">{performanceMetrics.map(metric => <div key={metric.label}><div className="flex justify-between mb-2"><div className="flex items-center gap-2"><metric.icon className="w-4 h-4 text-gray-400"/><span className="text-sm font-medium">{metric.label}</span></div><span className="text-sm font-bold">{metric.value.toFixed(1)}%</span></div><ProgressBar progress={metric.value} max={100} variant={metric.value >= 90 ? 'success' : metric.value >= 70 ? 'wave' : 'warning'}/></div>)}</div><p className="text-xs text-gray-500 mt-5">Acceptance rate and on-time rate are not shown because the backend does not yet record enough event data to calculate them honestly.</p></Card>
      <Card className="p-6"><h3 className="font-heading font-bold text-lg mb-4">Delivery Breakdown</h3><div className="grid grid-cols-3 gap-4 text-center"><div><p className="text-3xl font-bold text-green-500">{stats.successful_rides}</p><p className="text-sm text-gray-500">Successful</p></div><div><p className="text-3xl font-bold text-red-500">{stats.failed_rides}</p><p className="text-sm text-gray-500">Failed/Cancelled</p></div><div><p className="text-3xl font-bold text-wave-500">{stats.completion_rate.toFixed(1)}%</p><p className="text-sm text-gray-500">Completion</p></div></div></Card>
    </div>
  );
};
export default RiderStats;
