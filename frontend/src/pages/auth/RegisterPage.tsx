import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    user_type: 'customer' as 'customer' | 'rider',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { showError, showSuccess } = useToast();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      showError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await register(formData);
      localStorage.setItem('wave_verify_phone', formData.phone);
      showSuccess('Account created! Please verify your phone.');
      setStep(2);
    } catch (err: any) {
      showError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-wave-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-wave">
            <span className="text-white font-bold text-3xl">W</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
            Create Account
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Join WAVE delivery platform
          </p>
        </div>

        <Card className="p-8">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full Name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="John Doe"
                leftIcon={<User className="w-5 h-5" />}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="you@example.com"
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+234..."
                leftIcon={<Phone className="w-5 h-5" />}
                required
              />
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Min 8 characters"
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirm_password}
                onChange={(e) => handleChange('confirm_password', e.target.value)}
                placeholder="Repeat password"
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  I want to
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange('user_type', 'customer')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.user_type === 'customer'
                        ? 'border-wave-500 bg-wave-50 dark:bg-wave-900/20 text-wave-600'
                        : 'border-gray-200 dark:border-dark-border text-gray-600'
                    }`}
                  >
                    <span className="text-2xl block mb-1">📦</span>
                    <span className="text-sm font-medium">Send Packages</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('user_type', 'rider')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.user_type === 'rider'
                        ? 'border-wave-500 bg-wave-50 dark:bg-wave-900/20 text-wave-600'
                        : 'border-gray-200 dark:border-dark-border text-gray-600'
                    }`}
                  >
                    <span className="text-2xl block mb-1">🏍️</span>
                    <span className="text-sm font-medium">Be a Rider</span>
                  </button>
                </div>
              </div>

              <Button type="submit" isLoading={isLoading} fullWidth className="py-3">
                Create Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                Account Created!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                We've sent an OTP to {formData.phone}. Please verify to continue.
              </p>
              <Link to="/verify-otp">
                <Button fullWidth>Verify Phone</Button>
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-wave-500 hover:text-wave-600 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
