import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet, CreditCard } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';

interface Transaction {
  id: string;
  type: 'payment' | 'payout' | 'withdrawal' | 'commission';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  party: string;
}

const mockTransactions: Transaction[] = [
  { id: '1', type: 'payment', amount: 2500, description: 'Delivery #WAV-1042', date: '2026-07-14 14:30', status: 'completed', party: 'Customer: Alice' },
  { id: '2', type: 'commission', amount: 250, description: 'Commission from #WAV-1042', date: '2026-07-14 14:30', status: 'completed', party: 'Wave' },
  { id: '3', type: 'payout', amount: 2250, description: 'Rider payout #WAV-1042', date: '2026-07-14 14:30', status: 'completed', party: 'Rider: John Doe' },
  { id: '4', type: 'withdrawal', amount: 50000, description: 'Rider withdrawal request', date: '2026-07-13 18:00', status: 'pending', party: 'Rider: Jane Smith' },
  { id: '5', type: 'payment', amount: 3200, description: 'Delivery #WAV-1043', date: '2026-07-13 12:15', status: 'completed', party: 'Customer: Bob' },
];

export const AdminFinance: React.FC = () => {
  const [period, setPeriod] = useState('today');

  const stats = {
    totalRevenue: 2450000,
    totalCommission: 245000,
    totalPayouts: 1980000,
    pendingWithdrawals: 125000,
  };

  const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-dark-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          tx.type === 'payment' ? 'bg-green-100 dark:bg-green-900/30 text-green-500' :
          tx.type === 'payout' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' :
          tx.type === 'commission' ? 'bg-wave-100 dark:bg-wave-900/30 text-wave-500' :
          'bg-red-100 dark:bg-red-900/30 text-red-500'
        }`}>
          {tx.type === 'payment' ? <ArrowDownLeft className="w-5 h-5" /> :
           tx.type === 'payout' || tx.type === 'withdrawal' ? <ArrowUpRight className="w-5 h-5" /> :
           <DollarSign className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
          <p className="text-sm text-gray-500">{tx.party} • {tx.date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${
          tx.type === 'payment' || tx.type === 'commission' ? 'text-green-500' : 'text-red-500'
        }`}>
          {tx.type === 'payment' || tx.type === 'commission' ? '+' : '-'}₦{tx.amount.toLocaleString()}
        </p>
        <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'} size="sm">
          {tx.status}
        </Badge>
      </div>
    </div>
  );

  const tabs = [
    {
      id: 'all',
      label: 'All Transactions',
      content: (
        <div className="space-y-2">
          {mockTransactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
        </div>
      ),
    },
    {
      id: 'payments',
      label: 'Payments',
      content: (
        <div className="space-y-2">
          {mockTransactions.filter(t => t.type === 'payment').map(tx => <TransactionRow key={tx.id} tx={tx} />)}
        </div>
      ),
    },
    {
      id: 'payouts',
      label: 'Payouts',
      content: (
        <div className="space-y-2">
          {mockTransactions.filter(t => t.type === 'payout' || t.type === 'withdrawal').map(tx => <TransactionRow key={tx.id} tx={tx} />)}
        </div>
      ),
    },
    {
      id: 'commissions',
      label: 'Commissions',
      content: (
        <div className="space-y-2">
          {mockTransactions.filter(t => t.type === 'commission').map(tx => <TransactionRow key={tx.id} tx={tx} />)}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Finance
        </h1>
        <div className="flex gap-2">
          {['today', 'week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p
                  ? 'bg-wave-500 text-white'
                  : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">₦{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-wave-100 dark:bg-wave-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-wave-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Commission</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">₦{stats.totalCommission.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rider Payouts</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">₦{stats.totalPayouts.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Withdrawals</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">₦{stats.pendingWithdrawals.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="p-6">
        <Tabs tabs={tabs} variant="underline" />
      </Card>
    </div>
  );
};

export default AdminFinance;
