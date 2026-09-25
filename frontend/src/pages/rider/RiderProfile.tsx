import React, { useEffect } from 'react';
import { Star, MapPin, Award, Calendar, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Rating } from '../../components/ui/Rating';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRider } from '../../hooks/useRider';
import type { RiderLevel } from '../../types';

const LEVEL_BOUNDS: Record<RiderLevel, { start: number; next: number | null }> = {
  bronze: { start: 0, next: 15 }, silver: { start: 15, next: 50 }, gold: { start: 50, next: 100 }, platinum: { start: 100, next: 200 }, elite: { start: 200, next: null },
};
const LEVELS: RiderLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'elite'];

export const RiderProfile: React.FC = () => {
  const { riderProfile, getProfile } = useRider();
  useEffect(() => { void getProfile(); }, [getProfile]);

  if (!riderProfile) return <div className="max-w-2xl mx-auto space-y-6"><Skeleton className="h-10"/><Skeleton className="h-44"/><Skeleton className="h-40"/></div>;

  const successful = riderProfile.stats.successful_rides;
  const bounds = LEVEL_BOUNDS[riderProfile.level];
  const progress = bounds.next === null ? 100 : Math.max(0, Math.min(100, ((successful - bounds.start) / (bounds.next - bounds.start)) * 100));
  const currentLevelIndex = LEVELS.indexOf(riderProfile.level);
  const vehicleName = [riderProfile.vehicle.make, riderProfile.vehicle.model].filter(Boolean).join(' ') || 'Not provided';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-heading font-bold">Profile</h1>
      <Card className="p-6"><div className="flex flex-col sm:flex-row items-center gap-6"><Avatar src={riderProfile.avatar} name={riderProfile.full_name} size="xl"/><div className="text-center sm:text-left"><h2 className="text-xl font-heading font-bold">{riderProfile.full_name}</h2><p className="text-gray-500">{riderProfile.email}</p><div className="flex items-center gap-2 mt-2 justify-center sm:justify-start"><Badge variant="wave" className="capitalize">{riderProfile.level} Rider</Badge><Badge variant={riderProfile.verification_status === 'verified' ? 'success' : riderProfile.verification_status === 'rejected' ? 'error' : 'warning'}><Shield className="w-3 h-3 mr-1"/>{riderProfile.verification_status.replace('_', ' ')}</Badge></div></div></div></Card>
      <Card className="p-6"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Award className="w-5 h-5 text-wave-500"/><h3 className="font-heading font-bold capitalize">{riderProfile.level} Rider</h3></div><span className="text-sm text-gray-500">{successful} completed</span></div><ProgressBar progress={progress} max={100} size="lg" variant="wave"/><div className="flex justify-between mt-3">{LEVELS.map((level, index) => <div key={level} className="flex flex-col items-center"><div className={`w-3 h-3 rounded-full mb-1 ${index <= currentLevelIndex ? 'bg-wave-500' : 'bg-gray-200 dark:bg-dark-border'}`}/><span className={`text-xs capitalize ${index === currentLevelIndex ? 'text-wave-500 font-medium' : 'text-gray-400'}`}>{level}</span></div>)}</div></Card>
      <div className="grid grid-cols-2 gap-4"><Card className="p-4 text-center"><MapPin className="w-5 h-5 text-wave-500 mx-auto mb-2"/><p className="text-2xl font-bold">{riderProfile.stats.total_kilometers.toFixed(1)}</p><p className="text-sm text-gray-500">Kilometers</p></Card><Card className="p-4 text-center"><Star className="w-5 h-5 text-yellow-500 mx-auto mb-2"/><p className="text-2xl font-bold">{successful}</p><p className="text-sm text-gray-500">Completed</p></Card><Card className="p-4 text-center"><Rating rating={riderProfile.rating} showValue reviewCount={riderProfile.total_reviews} className="justify-center mb-2"/><p className="text-sm text-gray-500">Rating</p></Card><Card className="p-4 text-center"><Calendar className="w-5 h-5 text-gray-400 mx-auto mb-2"/><p className="text-lg font-bold">{new Date(riderProfile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p><p className="text-sm text-gray-500">Joined</p></Card></div>
      <Card className="p-6"><h3 className="font-heading font-bold text-lg mb-4">Vehicle Information</h3><div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-gray-500">Type</p><p className="font-medium capitalize">{riderProfile.vehicle.type}</p></div><div><p className="text-sm text-gray-500">Make & Model</p><p className="font-medium">{vehicleName}</p></div><div><p className="text-sm text-gray-500">Year</p><p className="font-medium">{riderProfile.vehicle.year ?? 'Not provided'}</p></div><div><p className="text-sm text-gray-500">Plate Number</p><p className="font-medium font-mono">{riderProfile.vehicle.plate_number || 'Not provided'}</p></div></div></Card>
    </div>
  );
};
export default RiderProfile;
