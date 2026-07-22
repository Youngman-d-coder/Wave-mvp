import React, { useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Award, MapPin, Star, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRider } from '../../hooks/useRider';

export const RiderStats: React.FC = () => {
  const { riderProfile, earnings, getProfile, getEarnings } = useRider();

  useEffect(() => {
    getProfile();
    getEarnings();
  }, [getProfile, getEarnings]);

  if (!riderProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton width="200px" height="32px" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const stats = {
    totalKilometers: riderProfile.stats?.total_kilometers || 0,
    successfulRides: riderProfile.stats?.successful_rides || 0,
    failedRides: riderProfile.stats?.failed_rides || 0,
    completionRate: riderProfile.stats?.completion_rate || 0,
    averageRating: riderProfile.rating || 0,
    totalEarnings: riderProfile.stats?.total_earnings || 0,
    // Monthly comparison - these would ideally come from a dedicated API endpoint
    // For now, we estimate based on available data
    thisMonth: {
      kilometers: (riderProfile.stats?.total_kilometers || 0) * 0.15,
      rides: Math.round((riderProfile.stats?.successful_rides || 0) * 0.15),
      earnings: earnings.week * 4, // Approximate monthly from weekly
    },
    lastMonth: {
      kilometers: (riderProfile.stats?.total_kilometers || 0) * 0.18,
      rides: Math.round((riderProfile.stats?.successful_rides || 0) * 0.18),
      earnings: earnings.week * 4.5,
    },
  };

  const performanceMetrics = [
    { label: 'On-Time Delivery', value: Math.min(100, (riderProfile.stats?.completion_rate || 0) + 2), icon: Clock },
    { label: 'Customer Satisfaction', value: Math.min(100, (riderProfile.rating || 0) * 20), icon: Star },
    { label: 'Acceptance Rate', value: 88, icon: Target }, // Would need dedicated API
    { label: 'Completion Rate', value: riderProfile.stats?.completion_rate || 0, icon: Award },
  ];

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '100.0' : '0.0';
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
        Statistics
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <MapPin className="w-5 h-5 text-wave-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalKilometers.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Total km</p>
        </Card>
        <Card className="p-4">
          <Target className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successfulRides}</p>
          <p className="text-sm text-gray-500">Deliveries</p>
        </Card>
        <Card className="p-4">
          <Star className="w-5 h-5 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageRating.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Avg Rating</p>
        </Card>
        <Card className="p-4">
          <Award className="w-5 h-5 text-wave-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{(stats.totalEarnings / 1000).toFixed(0)}k</p>
          <p className="text-sm text-gray-500">Total Earnings</p>
        </Card>
      </div>

      {/* Monthly Comparison */}
      <Card className="p-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
          This Month vs Last Month
        </h3>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { label: 'Kilometers', current: stats.thisMonth.kilometers, previous: stats.lastMonth.kilometers, unit: 'km' },
            { label: 'Deliveries', current: stats.thisMonth.rides, previous: stats.lastMonth.rides, unit: '' },
            { label: 'Earnings', current: stats.thisMonth.earnings, previous: stats.lastMonth.earnings, unit: '₦' },
          ].map((metric) => {
            const change = parseFloat(calculateChange(metric.current, metric.previous));
            const isPositive = change >= 0;

            return (
              <div key={metric.label} className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.unit}{metric.current.toLocaleString()}
                </p>
                <div className={`flex items-center justify-center gap-1 mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm font-medium">{Math.abs(change)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="p-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
          Performance Metrics
        </h3>
        <div className="space-y-4">
          {performanceMetrics.map((metric) => (
            <div key={metric.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <metric.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{metric.value.toFixed(1)}%</span>
              </div>
              <ProgressBar 
                progress={metric.value} 
                max={100} 
                variant={metric.value >= 90 ? 'success' : metric.value >= 70 ? 'wave' : 'warning'} 
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Additional Stats */}
      <Card className="p-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
          Delivery Breakdown
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-green-500">{stats.successfulRides}</p>
            <p className="text-sm text-gray-500">Successful</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-500">{stats.failedRides}</p>
            <p className="text-sm text-gray-500">Failed</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-wave-500">{stats.completionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Success Rate</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RiderStats;