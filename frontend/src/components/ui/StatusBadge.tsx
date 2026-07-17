import React from 'react';
import { Badge } from './Badge';
import { DeliveryStatus } from '../../types';

interface StatusBadgeProps {
  status: DeliveryStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const statusConfig: Record<DeliveryStatus, { variant: any; label: string }> = {
    pending: { variant: 'default', label: 'Pending' },
    searching_rider: { variant: 'info', label: 'Finding Rider' },
    rider_assigned: { variant: 'info', label: 'Rider Assigned' },
    rider_arrived: { variant: 'warning', label: 'Rider Arrived' },
    picked_up: { variant: 'wave', label: 'Picked Up' },
    in_transit: { variant: 'wave', label: 'In Transit' },
    near_destination: { variant: 'warning', label: 'Near Destination' },
    delivered: { variant: 'success', label: 'Delivered' },
    cancelled: { variant: 'error', label: 'Cancelled' },
    failed: { variant: 'error', label: 'Failed' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
