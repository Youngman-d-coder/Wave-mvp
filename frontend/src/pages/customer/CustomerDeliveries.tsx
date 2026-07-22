import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tabs } from '../../components/ui/Tabs';
import { useDelivery } from '../../hooks/useDelivery';
import { useToast } from '../../contexts/ToastContext';
import { Delivery } from '../../types';

export const CustomerDeliveries: React.FC = () => {
  const { deliveryHistory, getHistory } = useDelivery();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    const result = await getHistory();
    if (!result.success) {
      showError(result.message || 'Failed to load delivery history');
    }
    setIsLoading(false);
  };

  const activeStatuses = ['pending', 'searching_rider', 'rider_assigned', 'rider_arrived', 'picked_up', 'in_transit', 'near_destination'];
  const completedStatuses = ['delivered'];
  const cancelledStatuses = ['cancelled', 'failed'];

  const filteredDeliveries = deliveryHistory.filter((d: Delivery) => {
    if (activeTab === 'active') return activeStatuses.includes(d.status);
    if (activeTab === 'completed') return completedStatuses.includes(d.status);
    if (activeTab === 'cancelled') return cancelledStatuses.includes(d.status);
    return true;
  });

  const handleDeliveryClick = (id: string) => {
    navigate(`/customer/tracking/${id}`);
  };

  const tabs = [
    {
      id: 'active',
      label: 'Active',
      content: (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-dark-border animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <EmptyState
              icon={<Package className="w-16 h-16 text-gray-300 dark:text-gray-600" />}
              title="No active deliveries"
              description="You don't have any active deliveries right now"
              actionLabel="Book a Delivery"
              onAction={() => navigate('/customer')}
            />
          ) : (
            filteredDeliveries.map((delivery) => (
              <DeliveryCard 
                key={delivery.id} 
                delivery={delivery} 
                onClick={() => handleDeliveryClick(delivery.id)} 
              />
            ))
          )}
        </div>
      ),
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-dark-border animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <EmptyState
              icon={<Package className="w-16 h-16 text-gray-300 dark:text-gray-600" />}
              title="No delivery history"
              description="Your completed deliveries will appear here"
            />
          ) : (
            filteredDeliveries.map((delivery) => (
              <DeliveryCard 
                key={delivery.id} 
                delivery={delivery} 
                onClick={() => handleDeliveryClick(delivery.id)} 
              />
            ))
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">
        My Deliveries
      </h1>
      <Tabs 
        tabs={tabs} 
        defaultTab="active"
        variant="underline"
      />
    </div>
  );
};

const DeliveryCard: React.FC<{ delivery: Delivery; onClick: () => void }> = ({ delivery, onClick }) => {
  return (
    <Card 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
              #{delivery.tracking_number}
            </span>
            <StatusBadge status={delivery.status} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 inline mr-1" />
            {new Date(delivery.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className="font-bold text-wave-500">
          {delivery.payment?.currency || '₦'} {delivery.fare?.total?.toFixed(2) || '0.00'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-wave-500 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 truncate">{delivery.pickup?.address || 'Pickup location'}</span>
          </div>
          <div className="w-0.5 h-4 bg-gray-200 dark:bg-dark-border ml-2 my-1" />
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 truncate">{delivery.dropoff?.address || 'Drop-off location'}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CustomerDeliveries;