import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../contexts/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // API call would go here
    setTimeout(() => {
      setIsSent(true);
      showSuccess('Reset link sent to your email');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-wave-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">W</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
            Reset Password
          </h1>
        </div>

        <Card className="p-8">
          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-gray-500 dark:text-gray-400">
                Enter your email and we'll send you a reset link.
              </p>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />
              <Button type="submit" isLoading={isLoading} fullWidth className="py-3">
                Send Reset Link
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                We've sent a password reset link to {email}
              </p>
              <Link to="/login">
                <Button variant="outline" fullWidth>Back to Login</Button>
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Remember your password?{' '}
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

export default ForgotPasswordPage;
