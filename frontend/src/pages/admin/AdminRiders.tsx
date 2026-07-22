import React, { useState, useEffect } from 'react';
import { Search, Phone, Ban, X, Star, MapPin, Package, Award } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { useAdmin } from '../../hooks/useAdmin';
import { useToast } from '../../contexts/ToastContext';
import { Rider } from '../../types';

export const AdminRiders: React.FC = () => {
  const { riders, getRiders, updateRiderStatus, isLoading } = useAdmin();
  const { showSuccess, showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'busy'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  useEffect(() => {
    getRiders();
  }, [getRiders]);

  const filteredRiders = riders.filter((rider) => {
    const matchesSearch = 
      rider.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rider.status === statusFilter;
    const matchesVerification = verificationFilter === 'all' || rider.verification_status === verificationFilter;
    return matchesSearch && matchesStatus && matchesVerification;
  });

  const handleSuspend = async (riderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await updateRiderStatus(riderId, 'suspended');
    if (result.success) {
      showSuccess('Rider suspended');
    } else {
      showError(result.message || 'Failed to suspend rider');
    }
  };

  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`tel:${phone}`, '_self');
  };

  const getCompletionRate = (successful: number, failed: number) => {
    const total = successful + failed;
    return total > 0 ? ((successful / total) * 100).toFixed(1) : '0.0';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-dark-border animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Riders ({filteredRiders.length})
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search riders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'online', 'offline', 'busy'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-wave-500 text-white'
                  : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Filter */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-gray-500 dark:text-gray-400 py-2">Verification:</span>
        {(['all', 'verified', 'pending', 'rejected'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVerificationFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              verificationFilter === v
                ? 'bg-wave-100 dark:bg-wave-900/30 text-wave-600 dark:text-wave-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border'
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Riders Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-border/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Deliveries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Earnings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {filteredRiders.map((rider) => (
                <tr
                  key={rider.id}
                  onClick={() => setSelectedRider(rider)}
                  className="hover:bg-gray-50 dark:hover:bg-dark-border/30 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={rider.avatar} name={rider.full_name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{rider.full_name}</p>
                        <p className="text-sm text-gray-500">{rider.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Badge variant={rider.status === 'online' ? 'success' : rider.status === 'busy' ? 'warning' : 'default'}>
                        {rider.status}
                      </Badge>
                      <Badge variant={rider.verification_status === 'verified' ? 'success' : rider.verification_status === 'pending' ? 'warning' : 'error'}>
                        {rider.verification_status}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium">{rider.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 dark:text-white">{rider.stats.successful_rides}</span>
                    <span className="text-gray-400 text-sm"> / {rider.stats.successful_rides + rider.stats.failed_rides}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">₦{(rider.stats.total_earnings / 1000).toFixed(0)}k</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleCall(rider.phone, e)}
                        className="p-2 rounded-lg hover:bg-wave-50 dark:hover:bg-wave-900/20 text-wave-500 transition-colors"
                        title="Call rider"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleSuspend(rider.id, e)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                        title="Suspend rider"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rider Detail Modal */}
      <Modal
        isOpen={!!selectedRider}
        onClose={() => setSelectedRider(null)}
        title={selectedRider?.full_name}
        size="lg"
      >
        {selectedRider && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar src={selectedRider.avatar} name={selectedRider.full_name} size="xl" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedRider.status === 'online' ? 'success' : 'default'}>
                    {selectedRider.status}
                  </Badge>
                  <Badge variant={selectedRider.verification_status === 'verified' ? 'success' : 'warning'}>
                    {selectedRider.verification_status}
                  </Badge>
                </div>
                <p className="text-gray-500 mt-1">{selectedRider.email} · {selectedRider.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <MapPin className="w-5 h-5 text-wave-500 mb-2" />
                <p className="text-2xl font-bold">{selectedRider.stats.total_kilometers.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Kilometers</p>
              </Card>
              <Card className="p-4">
                <Award className="w-5 h-5 text-green-500 mb-2" />
                <p className="text-2xl font-bold">{getCompletionRate(selectedRider.stats.successful_rides, selectedRider.stats.failed_rides)}%</p>
                <p className="text-sm text-gray-500">Completion Rate</p>
              </Card>
              <Card className="p-4">
                <Package className="w-5 h-5 text-blue-500 mb-2" />
                <p className="text-2xl font-bold">₦{(selectedRider.stats.total_earnings / 1000).toFixed(0)}k</p>
                <p className="text-sm text-gray-500">Total Earnings</p>
              </Card>
              <Card className="p-4">
                <Star className="w-5 h-5 text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">{selectedRider.stats.total_commission_generated.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Commission</p>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => handleCall(selectedRider.phone, {} as any)}>
                <Phone className="w-4 h-4 mr-2" />
                Call Rider
              </Button>
              <Button variant="danger" className="flex-1" onClick={(e) => handleSuspend(selectedRider.id, e as any)}>
                <Ban className="w-4 h-4 mr-2" />
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