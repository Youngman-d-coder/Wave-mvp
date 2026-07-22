import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Banknote, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useRider } from '../../hooks/useRider';
import { useToast } from '../../contexts/ToastContext';

export const RiderWallet: React.FC = () => {
  const { 
    riderProfile, 
    withdrawals, 
    getProfile, 
    getWithdrawals, 
    requestWithdrawal,
    addBankAccount 
  } = useRider();
  const { showSuccess, showError } = useToast();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
  });

  useEffect(() => {
    getProfile();
    getWithdrawals();
  }, [getProfile, getWithdrawals]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      showError('Please enter a valid amount');
      return;
    }
    const balance = riderProfile?.wallet?.balance || 0;
    if (amount > balance) {
      showError(`Insufficient balance. Available: ₦${balance.toLocaleString()}`);
      return;
    }

    // Check if rider has bank accounts
    const bankAccounts = riderProfile?.bank_accounts || [];
    if (bankAccounts.length === 0) {
      showError('Please add a bank account first');
      setShowWithdrawModal(false);
      setShowBankModal(true);
      return;
    }

    setIsProcessing(true);
    const result = await requestWithdrawal(amount, bankAccounts[0].id);
    setIsProcessing(false);

    if (result.success) {
      showSuccess('Withdrawal request submitted successfully');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      getProfile(); // Refresh balance
      getWithdrawals(); // Refresh history
    } else {
      showError(result.message || 'Withdrawal failed');
    }
  };

  const handleAddBank = async () => {
    if (!bankForm.bank_name || !bankForm.account_number || !bankForm.account_name) {
      showError('Please fill in all fields');
      return;
    }

    setIsProcessing(true);
    const result = await addBankAccount({
      bank_name: bankForm.bank_name,
      account_number: bankForm.account_number,
      account_name: bankForm.account_name,
    });
    setIsProcessing(false);

    if (result.success) {
      showSuccess('Bank account added successfully');
      setShowBankModal(false);
      setBankForm({ bank_name: '', account_number: '', account_name: '' });
      getProfile();
    } else {
      showError(result.message || 'Failed to add bank account');
    }
  };

  if (!riderProfile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const wallet = riderProfile.wallet || { balance: 0, pending_balance: 0, currency: 'NGN' };
  const bankAccounts = riderProfile.bank_accounts || [];

  // Combine earnings and withdrawals for transaction history
  // In a real app, this would come from a dedicated transactions endpoint
  const transactions = withdrawals.map((w: any) => ({
    id: w.id,
    type: 'withdrawal' as const,
    amount: w.amount,
    description: `Withdrawal to ${w.bank_account?.bank_name || 'Bank'}`,
    date: w.created_at,
    status: w.status,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
        Wallet
      </h1>

      {/* Balance Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-wave-500 to-wave-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-8 h-8 text-white/80" />
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
              Available
            </span>
          </div>
          <p className="text-3xl font-bold">₦{wallet.balance.toLocaleString()}</p>
          <p className="text-white/80 text-sm mt-1">Available for withdrawal</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-wave-500" />
            <Badge variant="warning">Pending</Badge>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">₦{wallet.pending_balance.toLocaleString()}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Clearing in 24h</p>
        </Card>
      </div>

      {/* Bank Account Info */}
      {bankAccounts.length > 0 ? (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Default Bank Account</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {bankAccounts[0].bank_name} · ****{bankAccounts[0].account_number.slice(-4)}
              </p>
              <p className="text-sm text-gray-500">{bankAccounts[0].account_name}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowBankModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add New
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-4 text-center">
          <p className="text-gray-500 mb-3">No bank account linked</p>
          <Button variant="outline" size="sm" onClick={() => setShowBankModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Bank Account
          </Button>
        </Card>
      )}

      {/* Withdraw Button */}
      <Button 
        fullWidth 
        className="py-4 text-lg" 
        onClick={() => setShowWithdrawModal(true)}
        disabled={wallet.balance <= 0}
      >
        <Banknote className="w-5 h-5 mr-2" />
        Withdraw to Bank Account
      </Button>

      {/* Transaction History */}
      <Card className="p-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h3>
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No transactions yet</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'earning' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-500' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-500'
                  }`}>
                    {tx.type === 'earning' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
                    <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()} · {new Date(tx.date).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'earning' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'earning' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </p>
                  <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'} size="sm">
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => { setShowWithdrawModal(false); setWithdrawAmount(''); }}
        title="Withdraw Funds"
        description={`Available balance: ₦${wallet.balance.toLocaleString()}`}
      >
        <div className="space-y-4">
          <Input
            label="Amount"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Enter amount"
            leftIcon={<Banknote className="w-5 h-5" />}
          />
          <div className="flex gap-2">
            {[1000, 5000, 10000, 50000].map((amount) => (
              <button
                key={amount}
                onClick={() => setWithdrawAmount(amount.toString())}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-border text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-wave-100 dark:hover:bg-wave-900/20 hover:text-wave-600 transition-colors"
              >
                ₦{amount.toLocaleString()}
              </button>
            ))}
          </div>
          <Button 
            fullWidth 
            onClick={handleWithdraw} 
            isLoading={isProcessing}
            disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
          >
            Confirm Withdrawal
          </Button>
        </div>
      </Modal>

      {/* Add Bank Account Modal */}
      <Modal
        isOpen={showBankModal}
        onClose={() => { setShowBankModal(false); setBankForm({ bank_name: '', account_number: '', account_name: '' }); }}
        title="Add Bank Account"
      >
        <div className="space-y-4">
          <Input
            label="Bank Name"
            value={bankForm.bank_name}
            onChange={(e) => setBankForm(prev => ({ ...prev, bank_name: e.target.value }))}
            placeholder="e.g. GTBank"
          />
          <Input
            label="Account Number"
            value={bankForm.account_number}
            onChange={(e) => setBankForm(prev => ({ ...prev, account_number: e.target.value }))}
            placeholder="10-digit account number"
            type="text"
            maxLength={10}
          />
          <Input
            label="Account Name"
            value={bankForm.account_name}
            onChange={(e) => setBankForm(prev => ({ ...prev, account_name: e.target.value }))}
            placeholder="Name on account"
          />
          <Button 
            fullWidth 
            onClick={handleAddBank} 
            isLoading={isProcessing}
            disabled={!bankForm.bank_name || !bankForm.account_number || !bankForm.account_name}
          >
            Add Bank Account
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default RiderWallet;