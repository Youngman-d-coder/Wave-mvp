import React, { useEffect, useState } from 'react';
import { Package, Clock, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tabs } from '../../components/ui/Tabs';
import { useDelivery } from '../../hooks/useDelivery';
import { Delivery } from '../../types';

export const CustomerDeliveries: React.FC = () => {
  const { getHistory } = useDelivery();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const response = await getHistory();
    if (response.success && response.data) {
      setDeliveries(response.data.results || []);
    }
  };

  const activeDeliveries = deliveries.filter(d => 
    !['delivered', 'cancelled', 'failed'].includes(d.status)
  );

  const pastDeliveries = deliveries.filter(d => 
    ['delivered', 'cancelled', 'failed'].includes(d.status)
  );

  const DeliveryCard: React.FC<{ delivery: Delivery }> = ({ delivery }) => (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
      window.location.href = `/customer/tracking/${delivery.id}`;
    }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm text-gray-500">#{delivery.tracking_number}</span>
            <StatusBadge status={delivery.status} />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              From: {delivery.pickup.address}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              To: {delivery.dropoff.address}
            </p>
          </div>
          {delivery.rider && (
            <div className="flex items-center gap-2 mt-3">
              <Avatar src={delivery.rider.avatar} name={delivery.rider.full_name} size="xs" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{delivery.rider.full_name}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="font-bold text-wave-500">
            {delivery.payment.currency} {delivery.fare.total.toFixed(2)}
          </p>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-auto mt-2" />
        </div>
      </div>
    </Card>
  );

  const tabs = [
    {
      id: 'active',
      label: `Active (${activeDeliveries.length})`,
      icon: <Package className="w-4 h-4" />,
      content: activeDeliveries.length > 0 ? (
        <div className="space-y-4">
          {activeDeliveries.map(d => <DeliveryCard key={d.id} delivery={d} />)}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="No active deliveries"
          description="Your active deliveries will appear here"
          actionLabel="Book a Delivery"
          onAction={() => window.location.href = '/customer'}
        />
      ),
    },
    {
      id: 'history',
      label: 'History',
      icon: <Clock className="w-4 h-4" />,
      content: pastDeliveries.length > 0 ? (
        <div className="space-y-4">
          {pastDeliveries.map(d => <DeliveryCard key={d.id} delivery={d} />)}
        </div>
      ) : (
        <EmptyState
          icon={<Clock className="w-12 h-12" />}
          title="No delivery history"
          description="Completed deliveries will appear here"
        />
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">
        My Deliveries
      </h1>
      <Tabs tabs={tabs} variant="underline" />
    </div>
  );
};

export default CustomerDeliveries;
