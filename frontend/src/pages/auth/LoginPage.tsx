import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login({ email, password });
      showSuccess('Welcome back!');

      switch (user.user_type) {
        case 'rider':
          navigate('/rider');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/customer');
          break;
      }
    } catch (err) {
      const errorData = err && typeof err === 'object' && 'data' in err
        ? (err as { data?: Record<string, unknown> }).data
        : undefined;
      const phone = typeof errorData?.phone === 'string' ? errorData.phone : null;
      if (phone) {
        localStorage.setItem('wave_verify_phone', phone);
        const debugOtp = typeof errorData?.debug_otp === 'string' ? errorData.debug_otp : null;
        if (debugOtp) localStorage.setItem('wave_debug_otp', debugOtp);
        else localStorage.removeItem('wave_debug_otp');
        showError('Please verify your phone number to continue.');
        navigate('/verify-otp');
      } else {
        showError(err instanceof Error ? err.message : 'Login failed');
      }
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
            Welcome Back
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Sign in to your WAVE account
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />
            </div>

            <div className="flex items-center justify-end text-sm">
              <Link to="/forgot-password" className="text-wave-500 hover:text-wave-600 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" isLoading={isLoading} fullWidth className="py-3">
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-wave-500 hover:text-wave-600 font-medium">
                Create one
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
