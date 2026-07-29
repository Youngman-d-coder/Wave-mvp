import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const OTPVerificationPage: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { verifyOTP, resendOTP } = useAuth();
  const { showSuccess, showError, showToast } = useToast();
  const navigate = useNavigate();

  const phone = localStorage.getItem('wave_verify_phone');
  const debugOtp = localStorage.getItem('wave_debug_otp');

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    if (!phone) {
      showError('No phone number found. Please register again.');
      navigate('/register');
      return;
    }
    setIsLoading(true);
    try {
      await verifyOTP(phone, code);
      localStorage.removeItem('wave_debug_otp');
      showSuccess('Phone verified!');
      navigate('/login');
    } catch {
      showError('Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) {
      showError('No phone number found. Please register again.');
      navigate('/register');
      return;
    }
    setIsResending(true);
    try {
      const result = await resendOTP(phone);
      if (result?.debug_otp) {
        localStorage.setItem('wave_debug_otp', result.debug_otp);
        showToast('info', `New code: ${result.debug_otp}`, 15000);
      } else {
        showSuccess('A new OTP has been sent');
      }
    } catch (err: any) {
      showError(err.message || 'Could not resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-wave-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">W</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
            Verify Phone
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Enter the 6-digit code sent to your phone
          </p>
        </div>

        <Card className="p-8">
          {debugOtp && (
            <div className="mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Testing mode &mdash; SMS isn't wired up yet, so here's your code:
              </p>
              <p className="text-2xl font-bold tracking-widest text-amber-800 dark:text-amber-300">
                {debugOtp}
              </p>
            </div>
          )}

          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:border-wave-500 focus:ring-2 focus:ring-wave-500/20 outline-none transition-all"
              />
            ))}
          </div>

          <Button onClick={handleSubmit} isLoading={isLoading} fullWidth className="py-3">
            Verify
          </Button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Didn't receive code?{' '}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-wave-500 hover:text-wave-600 font-medium disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend'}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
