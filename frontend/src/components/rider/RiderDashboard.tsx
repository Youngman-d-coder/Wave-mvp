import React from 'react';
import { Package, MapPin, DollarSign, TrendingUp, Star } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useRider } from '../../hooks/useRider';

export const RiderDashboard: React.FC = () => {
  const { riderProfile, earnings } = useRider();

  const stats = [
    { label: "Today's Earnings", value: `₦${earnings.today.toLocaleString()}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'This Week', value: `₦${earnings.week.toLocaleString()}`, icon: TrendingUp, color: 'text-wave-500', bg: 'bg-wave-100 dark:bg-wave-900/30' },
    { label: 'Rating', value: '4.8', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'Deliveries', value: '12', icon: Package, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  ];

  // Mock active delivery request
  const hasDeliveryRequest = true;
  const deliveryRequest = {
    id: 'DEL-001',
    pickup: '123 Main St, Lagos',
    dropoff: '456 Oak Ave, Lagos',
    distance: '3.2 km',
    estimatedFare: 2500,
    packageType: 'Small Package',
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Good afternoon, {riderProfile?.full_name || 'Rider'}
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
      {hasDeliveryRequest && (
        <Card className="p-6 border-2 border-wave-500 animate-bounce-in">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge variant="wave">New Request</Badge>
              <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white mt-2">
                Delivery Request #{deliveryRequest.id}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-wave-500">₦{deliveryRequest.estimatedFare}</p>
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
            <Button variant="secondary" className="flex-1">
              Decline
            </Button>
            <Button className="flex-1">
              Accept Delivery
            </Button>
          </div>
        </Card>
      )}

      {/* Level Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-bold text-gray-900 dark:text-white">
              Gold Rider
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              45 more deliveries to reach Platinum
            </p>
          </div>
          <Badge variant="wave">Level 3/5</Badge>
        </div>
        <ProgressBar progress={155} max={200} size="lg" variant="wave" showLabel />
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Bronze</span>
          <span>Silver</span>
          <span className="text-wave-500 font-medium">Gold</span>
          <span>Platinum</span>
          <span>Elite</span>
        </div>
      </Card>
    </div>
  );
};

export default RiderDashboard;
