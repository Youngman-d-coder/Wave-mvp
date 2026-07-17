import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  DollarSign, 
  Activity,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminOverview: React.FC = () => {
  const stats = [
    { 
      label: 'Total Revenue', 
      value: '₦2.4M', 
      change: '+12.5%', 
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-100 dark:bg-green-900/30'
    },
    { 
      label: "Today's Revenue", 
      value: '₦125K', 
      change: '+8.2%', 
      trend: 'up',
      icon: TrendingUp,
      color: 'text-wave-500',
      bg: 'bg-wave-100 dark:bg-wave-900/30'
    },
    { 
      label: 'Active Riders', 
      value: '48', 
      change: '+3', 
      trend: 'up',
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    { 
      label: 'Live Deliveries', 
      value: '23', 
      change: '-2', 
      trend: 'down',
      icon: Package,
      color: 'text-purple-500',
      bg: 'bg-purple-100 dark:bg-purple-900/30'
    },
  ];

  const recentActivity = [
    { id: 1, type: 'delivery', message: 'New delivery #WAV-1042 booked', time: '2 min ago', icon: Package },
    { id: 2, type: 'rider', message: 'Rider John Doe went online', time: '5 min ago', icon: Users },
    { id: 3, type: 'payment', message: 'Payment received ₦2,500', time: '8 min ago', icon: DollarSign },
    { id: 4, type: 'delivery', message: 'Delivery #WAV-1041 completed', time: '12 min ago', icon: Package },
    { id: 5, type: 'rider', message: 'New rider registration: Jane Smith', time: '15 min ago', icon: Users },
  ];

  const topRiders = [
    { name: 'John Doe', deliveries: 45, rating: 4.9, earnings: '₦125K', status: 'online' },
    { name: 'Jane Smith', deliveries: 38, rating: 4.8, earnings: '₦98K', status: 'online' },
    { name: 'Mike Johnson', deliveries: 32, rating: 4.7, earnings: '₦87K', status: 'busy' },
    { name: 'Sarah Williams', deliveries: 28, rating: 4.9, earnings: '₦76K', status: 'offline' },
    { name: 'David Brown', deliveries: 25, rating: 4.6, earnings: '₦65K', status: 'online' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <Badge variant="success">
          <Activity className="w-3 h-3 mr-1" />
          Live
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-dark-border last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-border flex items-center justify-center flex-shrink-0">
                  <activity.icon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Riders */}
        <Card className="p-6">
          <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
            Top Riders
          </h3>
          <div className="space-y-3">
            {topRiders.map((rider, index) => (
              <div key={rider.name} className="flex items-center gap-3">
                <span className="w-6 text-sm font-bold text-gray-400">#{index + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rider.name}</p>
                  <p className="text-xs text-gray-500">{rider.deliveries} deliveries</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-wave-500">{rider.earnings}</p>
                  <Badge 
                    variant={rider.status === 'online' ? 'success' : rider.status === 'busy' ? 'warning' : 'default'}
                    size="sm"
                  >
                    {rider.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
