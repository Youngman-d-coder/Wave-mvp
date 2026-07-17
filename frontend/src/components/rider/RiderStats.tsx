import React from 'react';
import { TrendingUp, TrendingDown, Target, Award, MapPin, Star, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';

export const RiderStats: React.FC = () => {
  const stats = {
    totalKilometers: 1250.5,
    successfulRides: 155,
    failedRides: 5,
    completionRate: 96.7,
    averageRating: 4.8,
    totalEarnings: 450000,
    thisMonth: {
      kilometers: 180.3,
      rides: 22,
      earnings: 65000,
    },
    lastMonth: {
      kilometers: 210.5,
      rides: 28,
      earnings: 82000,
    },
  };

  const performanceMetrics = [
    { label: 'On-Time Delivery', value: 94, icon: Clock },
    { label: 'Customer Satisfaction', value: 96, icon: Star },
    { label: 'Acceptance Rate', value: 88, icon: Target },
    { label: 'Completion Rate', value: stats.completionRate, icon: Award },
  ];

  const calculateChange = (current: number, previous: number) => {
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
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageRating}</p>
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
                <span className="text-sm font-bold text-gray-900 dark:text-white">{metric.value}%</span>
              </div>
              <ProgressBar progress={metric.value} max={100} variant={metric.value >= 90 ? 'success' : metric.value >= 70 ? 'wave' : 'warning'} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default RiderStats;
