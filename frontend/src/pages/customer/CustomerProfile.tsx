import React, { useState } from 'react';
import { User, Mail, Phone, Camera, Lock, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const CustomerProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      showSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch {
      showError('Failed to update profile');
    }
  };

  const stats = [
    { label: 'Total Deliveries', value: '24' },
    { label: 'Total Spent', value: '₦45,200' },
    { label: 'Favorite Riders', value: '5' },
    { label: 'Member Since', value: 'Jan 2026' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">
        Profile
      </h1>

      {/* Profile Header */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <Avatar src={user?.avatar} name={user?.full_name} size="xl" />
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-wave-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-wave-600 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
              {user?.full_name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className="badge-wave">Verified</span>
              <span className="badge-success">Active</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <p className="text-2xl font-bold text-wave-500">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Edit Form */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">
            Personal Information
          </h3>
          <Button
            variant={isEditing ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        <div className="space-y-4">
          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            disabled={!isEditing}
            leftIcon={<User className="w-5 h-5" />}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            disabled={!isEditing}
            leftIcon={<Mail className="w-5 h-5" />}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            disabled={!isEditing}
            leftIcon={<Phone className="w-5 h-5" />}
          />
        </div>

        {isEditing && (
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        )}
      </Card>

      {/* Security */}
      <Card className="p-6 mt-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
          Security
        </h3>
        <div className="space-y-3">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left">
            <Lock className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
              <p className="text-sm text-gray-500">Update your password regularly</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left">
            <Shield className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default CustomerProfile;
