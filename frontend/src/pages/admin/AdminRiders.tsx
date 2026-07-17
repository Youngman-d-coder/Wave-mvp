import React, { useState } from 'react';
import { Phone, Ban } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Rating } from '../../components/ui/Rating';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';

interface RiderData {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  totalKilometers: number;
  successfulRides: number;
  failedRides: number;
  earnings: number;
  commission: number;
  status: 'online' | 'offline' | 'busy';
  verificationStatus: 'verified' | 'pending' | 'rejected';
  level: string;
  dateJoined: string;
}

const mockRiders: RiderData[] = [
  { id: '1', name: 'John Doe', email: 'john@wave.com', phone: '+2348012345678', avatar: '', rating: 4.8, totalKilometers: 1250, successfulRides: 155, failedRides: 5, earnings: 450000, commission: 45000, status: 'online', verificationStatus: 'verified', level: 'gold', dateJoined: '2026-01-15' },
  { id: '2', name: 'Jane Smith', email: 'jane@wave.com', phone: '+2348098765432', avatar: '', rating: 4.9, totalKilometers: 980, successfulRides: 120, failedRides: 2, earnings: 380000, commission: 38000, status: 'online', verificationStatus: 'verified', level: 'silver', dateJoined: '2026-02-20' },
  { id: '3', name: 'Mike Johnson', email: 'mike@wave.com', phone: '+2348056789012', avatar: '', rating: 4.5, totalKilometers: 750, successfulRides: 85, failedRides: 8, earnings: 220000, commission: 22000, status: 'busy', verificationStatus: 'pending', level: 'bronze', dateJoined: '2026-03-10' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@wave.com', phone: '+2348034567890', avatar: '', rating: 4.7, totalKilometers: 1100, successfulRides: 140, failedRides: 3, earnings: 410000, commission: 41000, status: 'offline', verificationStatus: 'verified', level: 'platinum', dateJoined: '2025-12-01' },
  { id: '5', name: 'David Brown', email: 'david@wave.com', phone: '+2348078901234', avatar: '', rating: 4.2, totalKilometers: 500, successfulRides: 60, failedRides: 12, earnings: 150000, commission: 15000, status: 'online', verificationStatus: 'rejected', level: 'bronze', dateJoined: '2026-04-05' },
];

export const AdminRiders: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRider, setSelectedRider] = useState<RiderData | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredRiders = mockRiders.filter(rider => {
    const matchesSearch = rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rider.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || rider.status === filterStatus || rider.verificationStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Riders Management
        </h1>
        <div className="flex gap-2">
          <Badge variant="success">{mockRiders.filter(r => r.status === 'online').length} Online</Badge>
          <Badge>{mockRiders.filter(r => r.status === 'offline').length} Offline</Badge>
          <Badge variant="warning">{mockRiders.filter(r => r.status === 'busy').length} Busy</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search riders..."
          className="flex-1"
        />
        <div className="flex gap-2">
          {['all', 'online', 'offline', 'verified', 'pending'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === status
                  ? 'bg-wave-500 text-white'
                  : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Riders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Rider</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Rating</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Deliveries</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Earnings</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Commission</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiders.map((rider) => (
                <tr 
                  key={rider.id} 
                  className="border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRider(rider)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={rider.avatar} name={rider.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{rider.name}</p>
                        <p className="text-xs text-gray-500">{rider.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <Badge variant={rider.status === 'online' ? 'success' : rider.status === 'busy' ? 'warning' : 'default'} size="sm">
                        {rider.status}
                      </Badge>
                      <Badge variant={rider.verificationStatus === 'verified' ? 'success' : rider.verificationStatus === 'pending' ? 'warning' : 'error'} size="sm">
                        {rider.verificationStatus}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Rating rating={rider.rating} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 dark:text-white">{rider.successfulRides}</p>
                    <p className="text-xs text-gray-500">{rider.failedRides} failed</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">₦{rider.earnings.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-wave-500">₦{rider.commission.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Rider Detail Modal */}
      <Modal
        isOpen={!!selectedRider}
        onClose={() => setSelectedRider(null)}
        title={selectedRider?.name}
      >
        {selectedRider && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={selectedRider.avatar} name={selectedRider.name} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="wave" className="capitalize">{selectedRider.level}</Badge>
                  <Badge variant={selectedRider.verificationStatus === 'verified' ? 'success' : 'warning'}>
                    {selectedRider.verificationStatus}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{selectedRider.email}</p>
                <p className="text-sm text-gray-500">{selectedRider.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-dark-border/50 rounded-xl">
                <p className="text-sm text-gray-500">Total Kilometers</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedRider.totalKilometers}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-border/50 rounded-xl">
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {((selectedRider.successfulRides / (selectedRider.successfulRides + selectedRider.failedRides)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-border/50 rounded-xl">
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-xl font-bold text-green-500">₦{selectedRider.earnings.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-border/50 rounded-xl">
                <p className="text-sm text-gray-500">Commission Generated</p>
                <p className="text-xl font-bold text-wave-500">₦{selectedRider.commission.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" leftIcon={<Phone className="w-4 h-4" />}>
                Call
              </Button>
              <Button variant="danger" className="flex-1" leftIcon={<Ban className="w-4 h-4" />}>
                Suspend
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminRiders;
