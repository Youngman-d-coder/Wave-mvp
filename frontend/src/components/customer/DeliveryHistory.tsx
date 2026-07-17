import React from 'react';
import { Package, MapPin, Calendar, Repeat, Receipt } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Delivery } from '../../types';

interface DeliveryHistoryProps {
  deliveries: Delivery[];
  onRebook: (delivery: Delivery) => void;
  onViewReceipt: (delivery: Delivery) => void;
}

export const DeliveryHistory: React.FC<DeliveryHistoryProps> = ({
  deliveries,
  onRebook,
  onViewReceipt,
}) => {
  if (deliveries.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-16 h-16 text-gray-300 dark:text-gray-600" />}
        title="No deliveries yet"
        description="Start booking your first delivery to see it here"
        actionLabel="Book a Delivery"
        onAction={() => window.location.href = '/customer'}
      />
    );
  }

  return (
    <div className="space-y-4">
      {deliveries.map((delivery) => (
        <Card key={delivery.id} className="p-4 hover:shadow-md transition-shadow">
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
              {delivery.payment.currency} {delivery.fare.total.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-wave-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 truncate">{delivery.pickup.address}</span>
              </div>
              <div className="w-0.5 h-4 bg-gray-200 dark:bg-dark-border ml-2 my-1" />
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 truncate">{delivery.dropoff.address}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRebook(delivery)}
              leftIcon={<Repeat className="w-4 h-4" />}
            >
              Rebook
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewReceipt(delivery)}
              leftIcon={<Receipt className="w-4 h-4" />}
            >
              Receipt
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DeliveryHistory;
