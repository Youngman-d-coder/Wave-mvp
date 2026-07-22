import React, { useState, useEffect } from 'react';
import { Camera, Lock, Shield, Package, Heart, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useDelivery } from '../../hooks/useDelivery';

export const CustomerProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const { deliveryHistory, getHistory } = useDelivery();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    getHistory();
  }, [getHistory]);

  // Sync form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Calculate real stats from delivery history
  const totalDeliveries = deliveryHistory.length;
  const totalSpent = deliveryHistory.reduce((sum, d) => sum + (d.fare?.total || 0), 0);
  const favoriteCount = user?.favorite_riders?.length || 0;
  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(formData);
      showSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      showError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="text-center">
        <div className="relative inline-block">
          <Avatar src={user.avatar} name={user.full_name} size="xl" />
          <button 
            className="absolute bottom-0 right-0 w-8 h-8 bg-wave-500 rounded-full flex items-center justify-center text-white hover:bg-wave-600 transition-colors shadow-lg"
            title="Change avatar"
            onClick={() => showError('Avatar upload coming soon')}
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mt-4">
          {user.full_name}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge variant="wave">Customer</Badge>
          {user.is_verified && (
            <Badge variant="success" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Verified
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Package className="w-5 h-5 text-wave-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDeliveries}</p>
          <p className="text-xs text-gray-500">Deliveries</p>
        </Card>
        <Card className="p-4 text-center">
          <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{totalSpent.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Spent</p>
        </Card>
        <Card className="p-4 text-center">
          <Heart className="w-5 h-5 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{favoriteCount}</p>
          <p className="text-xs text-gray-500">Favorites</p>
        </Card>
        <Card className="p-4 text-center">
          <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{memberSince}</p>
          <p className="text-xs text-gray-500">Member Since</p>
        </Card>
      </div>

      {/* Edit Form */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-heading font-bold text-gray-900 dark:text-white">
            Personal Information
          </h2>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={isLoading}>
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            disabled={!isEditing}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            disabled={!isEditing}
          />
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            disabled={!isEditing}
          />
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <h2 className="text-lg font-heading font-bold text-gray-900 dark:text-white mb-4">
          Security
        </h2>
        <div className="space-y-3">
          <Button 
            variant="secondary" 
            className="w-full justify-start" 
            leftIcon={<Lock className="w-5 h-5" />}
            onClick={() => showError('Password change coming soon')}
          >
            Change Password
          </Button>
          <Button 
            variant="secondary" 
            className="w-full justify-start" 
            leftIcon={<Shield className="w-5 h-5" />}
            onClick={() => showError('2FA coming soon')}
          >
            Enable Two-Factor Authentication
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CustomerProfile;