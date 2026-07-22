import React, { useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Users, Package, DollarSign, Bike } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAdmin } from '../../hooks/useAdmin';

export const AdminOverview: React.FC = () => {
  const { dashboardStats, getDashboardStats, isLoading } = useAdmin();

  useEffect(() => {
    getDashboardStats();
  }, [getDashboardStats]);

  if (isLoading || !dashboardStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Total Revenue', 
      value: `₦${(dashboardStats.total_revenue / 1000000).toFixed(1)}M`, 
      trend: dashboardStats.revenue_trend || 0,
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-100 dark:bg-green-900/30'
    },
    { 
      label: "Today's Revenue", 
      value: `₦${(dashboardStats.today_revenue / 1000).toFixed(0)}K`, 
      trend: dashboardStats.today_trend || 0,
      icon: TrendingUp,
      color: 'text-wave-500',
      bg: 'bg-wave-100 dark:bg-wave-900/30'
    },
    { 
      label: 'Active Riders', 
      value: dashboardStats.active_riders?.toString() || '0', 
      trend: dashboardStats.riders_trend || 0,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    { 
      label: 'Live Deliveries', 
      value: dashboardStats.live_deliveries?.toString() || '0', 
      trend: dashboardStats.deliveries_trend || 0,
      icon: Package,
      color: 'text-purple-500',
      bg: 'bg-purple-100 dark:bg-purple-900/30'
    },
  ];

  const recentActivity = dashboardStats.recent_activity || [];
  const topRiders = dashboardStats.top_riders || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <Badge variant="success" className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Live
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stat.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(stat.trend)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No recent activity</p>
            ) : (
              recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'delivery' ? 'bg-wave-100 dark:bg-wave-900/30 text-wave-500' :
                    activity.type === 'payment' ? 'bg-green-100 dark:bg-green-900/30 text-green-500' :
                    activity.type === 'rider' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' :
                    'bg-gray-100 dark:bg-dark-border text-gray-500'
                  }`}>
                    {activity.type === 'delivery' ? <Package className="w-4 h-4" /> :
                     activity.type === 'payment' ? <DollarSign className="w-4 h-4" /> :
                     activity.type === 'rider' ? <Users className="w-4 h-4" /> :
                     <Activity className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Top Riders */}
        <Card className="p-6">
          <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
            Top Riders
          </h3>
          <div className="space-y-4">
            {topRiders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No riders yet</p>
            ) : (
              topRiders.map((rider: any, index: number) => (
                <div key={rider.id || index} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-600' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {index + 1}
                  </span>
                  <Avatar src={rider.avatar} name={rider.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{rider.name}</p>
                    <p className="text-xs text-gray-500">{rider.deliveries} deliveries</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">₦{(rider.earnings / 1000).toFixed(0)}k</p>
                    <div className="flex items-center gap-1">
                      <Bike className="w-3 h-3 text-wave-500" />
                      <span className="text-xs text-gray-500">{rider.rating}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;