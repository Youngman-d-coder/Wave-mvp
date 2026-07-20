import React from 'react';
import { Package, MapPin, CheckCircle, XCircle, Navigation } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';

interface DeliveryItem {
  id: string;
  trackingNumber: string;
  pickup: string;
  dropoff: string;
  status: string;
  fare: number;
  distance: string;
  customerName: string;
  customerPhone: string;
  packageType: string;
  createdAt: string;
}

const mockDeliveries: DeliveryItem[] = [
  {
    id: '1',
    trackingNumber: 'WAV-001',
    pickup: '12 Admiralty Way, Lekki',
    dropoff: '45 Allen Avenue, Ikeja',
    status: 'in_transit',
    fare: 2500,
    distance: '12.5 km',
    customerName: 'Alice Johnson',
    customerPhone: '+2348012345678',
    packageType: 'Small Package',
    createdAt: '2026-07-14T10:30:00',
  },
  {
    id: '2',
    trackingNumber: 'WAV-002',
    pickup: '78 Broad Street, Lagos Island',
    dropoff: '23 Opebi Road, Ikeja',
    status: 'delivered',
    fare: 1800,
    distance: '8.2 km',
    customerName: 'Bob Smith',
    customerPhone: '+2348098765432',
    packageType: 'Document',
    createdAt: '2026-07-13T14:15:00',
  },
  {
    id: '3',
    trackingNumber: 'WAV-003',
    pickup: '56 Toyin Street, Ikeja',
    dropoff: '89 Ajah Road, Ajah',
    status: 'cancelled',
    fare: 3200,
    distance: '25.1 km',
    customerName: 'Carol White',
    customerPhone: '+2348056789012',
    packageType: 'Large Package',
    createdAt: '2026-07-12T09:00:00',
  },
];

export const RiderDeliveries: React.FC = () => {
  const activeDeliveries = mockDeliveries.filter(d => 
    ['rider_assigned', 'picked_up', 'in_transit'].includes(d.status)
  );

  const completedDeliveries = mockDeliveries.filter(d => d.status === 'delivered');
  const cancelledDeliveries = mockDeliveries.filter(d => d.status === 'cancelled');

  const DeliveryCard: React.FC<{ delivery: DeliveryItem; showActions?: boolean }> = ({ delivery, showActions = false }) => (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-gray-500">#{delivery.trackingNumber}</span>
            <StatusBadge status={delivery.status as any} />
          </div>
          <p className="text-sm text-gray-500 mt-1">{delivery.packageType} • {delivery.distance}</p>
        </div>
        <span className="font-bold text-wave-500">₦{delivery.fare}</span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-wave-500" />
          <span className="text-gray-700 dark:text-gray-300">{delivery.pickup}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="text-gray-700 dark:text-gray-300">{delivery.dropoff}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{delivery.customerName}</p>
          <p className="text-xs text-gray-500">{delivery.customerPhone}</p>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Navigation className="w-4 h-4" />
            </Button>
            <Button size="sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete
            </Button>
          </div>
        )}
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
          {activeDeliveries.map(d => <DeliveryCard key={d.id} delivery={d} showActions />)}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="No active deliveries"
          description="Accept delivery requests to see them here"
        />
      ),
    },
    {
      id: 'completed',
      label: `Completed (${completedDeliveries.length})`,
      icon: <CheckCircle className="w-4 h-4" />,
      content: completedDeliveries.length > 0 ? (
        <div className="space-y-4">
          {completedDeliveries.map(d => <DeliveryCard key={d.id} delivery={d} />)}
        </div>
      ) : (
        <EmptyState
          icon={<CheckCircle className="w-12 h-12" />}
          title="No completed deliveries"
          description="Complete deliveries to see them here"
        />
      ),
    },
    {
      id: 'cancelled',
      label: `Cancelled (${cancelledDeliveries.length})`,
      icon: <XCircle className="w-4 h-4" />,
      content: cancelledDeliveries.length > 0 ? (
        <div className="space-y-4">
          {cancelledDeliveries.map(d => <DeliveryCard key={d.id} delivery={d} />)}
        </div>
      ) : (
        <EmptyState
          icon={<XCircle className="w-12 h-12" />}
          title="No cancelled deliveries"
          description="Cancelled deliveries will appear here"
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

export default RiderDeliveries;
