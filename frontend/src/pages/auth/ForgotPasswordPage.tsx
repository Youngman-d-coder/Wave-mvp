import React from 'react';
import { Link } from 'react-router-dom';
import { MailWarning } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const ForgotPasswordPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4"><div className="w-full max-w-md"><div className="text-center mb-8"><div className="w-16 h-16 bg-wave-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-white font-bold text-3xl">W</span></div><h1 className="text-3xl font-heading font-bold">Reset Password</h1></div><Card className="p-8 text-center"><MailWarning className="w-14 h-14 text-amber-500 mx-auto mb-4"/><h2 className="text-xl font-heading font-bold mb-2">Password recovery is not configured yet</h2><p className="text-gray-500 dark:text-gray-400 mb-6">No reset email will be sent from this MVP until a verified email provider and secure reset-token flow are connected. Contact the WAVE administrator for account recovery.</p><Link to="/login"><Button fullWidth>Back to Login</Button></Link></Card></div></div>
);
export default ForgotPasswordPage;
