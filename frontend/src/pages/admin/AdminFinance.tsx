import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAdmin } from '../../hooks/useAdmin';

export const AdminFinance: React.FC = () => {
  const { transactions, getTransactions, dashboardStats, getDashboardStats, isLoading } = useAdmin();
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    getDashboardStats();
    getTransactions(period);
  }, [getDashboardStats, getTransactions, period]);

  const stats = dashboardStats || {
    total_revenue: 0,
    total_commission: 0,
    total_payouts: 0,
    pending_withdrawals: 0,
  };

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  const filteredTransactions = transactions.filter((tx: any) => {
    if (activeTab === 'payments') return tx.type === 'payment';
    if (activeTab === 'payouts') return tx.type === 'payout';
    if (activeTab === 'commissions') return tx.type === 'commission';
    return true;
  });

  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    {
      id: 'all',
      label: 'All',
      content: <TransactionList transactions={filteredTransactions} isLoading={isLoading} />,
    },
    {
      id: 'payments',
      label: 'Payments',
      content: <TransactionList transactions={filteredTransactions.filter((t: any) => t.type === 'payment')} isLoading={isLoading} />,
    },
    {
      id: 'payouts',
      label: 'Payouts',
      content: <TransactionList transactions={filteredTransactions.filter((t: any) => t.type === 'payout')} isLoading={isLoading} />,
    },
    {
      id: 'commissions',
      label: 'Commissions',
      content: <TransactionList transactions={filteredTransactions.filter((t: any) => t.type === 'commission')} isLoading={isLoading} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Finance
        </h1>
        <div className="flex gap-2">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === opt.value
                  ? 'bg-wave-500 text-white'
                  : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            <Badge variant="success">Revenue</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₦{(stats.total_revenue / 1000000).toFixed(1)}M
          </p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-wave-500" />
            <Badge variant="wave">Commission</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₦{(stats.total_commission / 1000).toFixed(0)}K
          </p>
          <p className="text-sm text-gray-500">Total Commission</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <ArrowUpRight className="w-8 h-8 text-blue-500" />
            <Badge variant="info">Payouts</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₦{(stats.total_payouts / 1000000).toFixed(1)}M
          </p>
          <p className="text-sm text-gray-500">Rider Payouts</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingDown className="w-8 h-8 text-red-500" />
            <Badge variant="warning">Pending</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₦{(stats.pending_withdrawals / 1000).toFixed(0)}K
          </p>
          <p className="text-sm text-gray-500">Pending Withdrawals</p>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="p-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
          Transactions
        </h3>
        <Tabs tabs={tabs} defaultTab="all" variant="underline" />
      </Card>
    </div>
  );
};

const TransactionList: React.FC<{ transactions: any[]; isLoading: boolean }> = ({ transactions, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-dark-border animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-border last:border-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              tx.type === 'payment' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-500'
                : tx.type === 'commission'
                ? 'bg-wave-100 dark:bg-wave-900/30 text-wave-500'
                : tx.type === 'payout'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
                : 'bg-red-100 dark:bg-red-900/30 text-red-500'
            }`}>
              {tx.type === 'payment' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
              <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleString()}</p>
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
      ))}
    </div>
  );
};

export default AdminFinance;