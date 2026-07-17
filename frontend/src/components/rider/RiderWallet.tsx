import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Banknote } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const RiderWallet: React.FC = () => {
  const wallet = {
    balance: 125000,
    pendingBalance: 35000,
    currency: 'NGN',
  };

  const transactions = [
    { id: '1', type: 'earning', amount: 2500, description: 'Delivery #DEL-001', date: '2026-07-14 14:30', status: 'completed' },
    { id: '2', type: 'earning', amount: 3200, description: 'Delivery #DEL-002', date: '2026-07-14 12:15', status: 'completed' },
    { id: '3', type: 'withdrawal', amount: 50000, description: 'Withdrawal to Bank', date: '2026-07-13 18:00', status: 'completed' },
    { id: '4', type: 'earning', amount: 1800, description: 'Delivery #DEL-003', date: '2026-07-13 10:45', status: 'pending' },
  ];

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
            <Badge className="bg-white/20 text-white">Available</Badge>
          </div>
          <p className="text-3xl font-bold">₦{wallet.balance.toLocaleString()}</p>
          <p className="text-white/80 text-sm mt-1">Available for withdrawal</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-wave-500" />
            <Badge variant="warning">Pending</Badge>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">₦{wallet.pendingBalance.toLocaleString()}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Clearing in 24h</p>
        </Card>
      </div>

      {/* Withdraw Button */}
      <Button fullWidth className="py-4 text-lg">
        <Banknote className="w-5 h-5 mr-2" />
        Withdraw to Bank Account
      </Button>

      {/* Transaction History */}
      <Card className="p-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h3>
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
                  <p className="text-sm text-gray-500">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.type === 'earning' ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.type === 'earning' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                </p>
                <Badge variant={tx.status === 'completed' ? 'success' : 'warning'} size="sm">
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default RiderWallet;
