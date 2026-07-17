import React from 'react';
import { User, Star, MapPin, Award, Calendar, Phone, Mail, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Rating } from '../../components/ui/Rating';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useAuth } from '../../contexts/AuthContext';

export const RiderProfile: React.FC = () => {
  const { user } = useAuth();

  const riderInfo = {
    level: 'gold',
    levelProgress: 155,
    levelMax: 200,
    totalKilometers: 1250.5,
    successfulRides: 155,
    failedRides: 5,
    rating: 4.8,
    totalReviews: 120,
    dateJoined: '2026-01-15',
    vehicle: { type: 'motorcycle', make: 'Honda', model: 'Ace 110', year: 2024, plate: 'ABC123' },
    verificationStatus: 'verified',
  };

  const levels = ['bronze', 'silver', 'gold', 'platinum', 'elite'];
  const currentLevelIndex = levels.indexOf(riderInfo.level);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
        Profile
      </h1>

      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar src={user?.avatar} name={user?.full_name} size="xl" />
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
              {user?.full_name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <Badge variant="wave" className="capitalize">{riderInfo.level} Rider</Badge>
              {riderInfo.verificationStatus === 'verified' && (
                <Badge variant="success">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Level Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-wave-500" />
            <h3 className="font-heading font-bold text-gray-900 dark:text-white capitalize">
              {riderInfo.level} Rider
            </h3>
          </div>
          <span className="text-sm text-gray-500">
            {riderInfo.levelProgress}/{riderInfo.levelMax} deliveries
          </span>
        </div>
        <ProgressBar progress={riderInfo.levelProgress} max={riderInfo.levelMax} size="lg" variant="wave" />
        <div className="flex justify-between mt-3">
          {levels.map((level, index) => (
            <div key={level} className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mb-1 ${
                index <= currentLevelIndex ? 'bg-wave-500' : 'bg-gray-200 dark:bg-dark-border'
              }`} />
              <span className={`text-xs capitalize ${
                index === currentLevelIndex ? 'text-wave-500 font-medium' : 'text-gray-400'
              }`}>
                {level}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <MapPin className="w-5 h-5 text-wave-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{riderInfo.totalKilometers.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Kilometers</p>
        </Card>
        <Card className="p-4 text-center">
          <Star className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{riderInfo.successfulRides}</p>
          <p className="text-sm text-gray-500">Successful</p>
        </Card>
        <Card className="p-4 text-center">
          <Rating rating={riderInfo.rating} showValue reviewCount={riderInfo.totalReviews} className="justify-center mb-2" />
          <p className="text-sm text-gray-500">Rating</p>
        </Card>
        <Card className="p-4 text-center">
          <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {new Date(riderInfo.dateJoined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
          <p className="text-sm text-gray-500">Joined</p>
        </Card>
      </div>

      {/* Vehicle Info */}
      <Card className="p-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
          Vehicle Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{riderInfo.vehicle.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Make & Model</p>
            <p className="font-medium text-gray-900 dark:text-white">{riderInfo.vehicle.make} {riderInfo.vehicle.model}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Year</p>
            <p className="font-medium text-gray-900 dark:text-white">{riderInfo.vehicle.year}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Plate Number</p>
            <p className="font-medium text-gray-900 dark:text-white font-mono">{riderInfo.vehicle.plate}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RiderProfile;
