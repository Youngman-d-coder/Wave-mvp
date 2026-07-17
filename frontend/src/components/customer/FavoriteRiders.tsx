import React from 'react';
import { Heart, Star, MapPin, Calendar, Phone, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Rating } from '../../components/ui/Rating';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Rider } from '../../types';

interface FavoriteRidersProps {
  riders: Rider[];
  onRemove: (riderId: string) => void;
  onBook: (riderId: string) => void;
}

export const FavoriteRiders: React.FC<FavoriteRidersProps> = ({
  riders,
  onRemove,
  onBook,
}) => {
  if (riders.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="w-16 h-16 text-gray-300 dark:text-gray-600" />}
        title="No favorite riders yet"
        description="Save your favorite riders after a delivery to quickly rebook them"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {riders.map((rider) => (
        <Card key={rider.id} className="p-5 relative group">
          <button
            onClick={() => onRemove(rider.id)}
            className="absolute top-3 right-3 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Heart className="w-5 h-5 fill-current" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <Avatar src={rider.avatar} name={rider.full_name} size="lg" status={rider.is_online ? 'online' : 'offline'} />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{rider.full_name}</h3>
              <Rating rating={rider.rating} reviewCount={rider.total_reviews} size="sm" />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{rider.stats.total_kilometers.toFixed(1)} km total</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Star className="w-4 h-4" />
              <span>{rider.stats.successful_rides} successful rides</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(rider.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Badge variant={rider.is_online ? 'success' : 'default'}>
              {rider.is_online ? 'Online' : 'Offline'}
            </Badge>
            <Badge variant="wave">{rider.level}</Badge>
            {rider.is_verified && <Badge variant="info">Verified</Badge>}
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onBook(rider.id)}
              disabled={!rider.is_online}
              className="flex-1"
            >
              Book Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FavoriteRiders;
