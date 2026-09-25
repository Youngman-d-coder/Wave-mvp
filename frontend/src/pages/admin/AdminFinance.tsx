import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../contexts/ToastContext';
import { AdminWithdrawal, Transaction, useAdmin } from '../../hooks/useAdmin';

export const AdminFinance: React.FC = () => {
  const {
    transactions,
    withdrawals,
    getTransactions,
    getWithdrawals,
    dashboardStats,
    getDashboardStats,
    updateWithdrawal,
    isLoading,
  } = useAdmin();
  const { showSuccess, showError } = useToast();
  const [period, setPeriod] = useState('today');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    void getDashboardStats();
    void getTransactions(period);
    void getWithdrawals();
  }, [getDashboardStats, getTransactions, getWithdrawals, period]);

  const handleWithdrawal = async (
    withdrawal: AdminWithdrawal,
    nextStatus: 'processing' | 'completed' | 'rejected',
  ) => {
    if (
      ['completed', 'rejected'].includes(nextStatus) &&
      !window.confirm(`Mark this ₦${Number(withdrawal.amount).toLocaleString()} withdrawal as ${nextStatus}?`)
    ) return;

    setProcessingId(withdrawal.id);
    const response = await updateWithdrawal(withdrawal.id, nextStatus);
    setProcessingId(null);
    if (!response.success) {
      showError(response.message || 'Could not update the withdrawal');
      return;
    }
    showSuccess(`Withdrawal marked ${nextStatus}`);
    await Promise.all([getWithdrawals(), getTransactions(period), getDashboardStats()]);
  };

  const stats = dashboardStats || {
    total_revenue: 0,
    today_revenue: 0,
    total_commission: 0,
    active_riders: 0,
    active_customers: 0,
    live_deliveries: 0,
    total_payouts: 0,
    pending_withdrawals: 0,
  };
  const tabs = [
    { id: 'all', label: 'All', content: <TransactionList transactions={transactions} isLoading={isLoading}/> },
    { id: 'payments', label: 'Payments', content: <TransactionList transactions={transactions.filter(t => t.type === 'payment')} isLoading={isLoading}/> },
    { id: 'earnings', label: 'Rider Earnings', content: <TransactionList transactions={transactions.filter(t => t.type === 'earning')} isLoading={isLoading}/> },
    { id: 'withdrawals', label: 'Withdrawals', content: <TransactionList transactions={transactions.filter(t => t.type === 'withdrawal')} isLoading={isLoading}/> },
  ];

  return <div className="space-y-6">
    <div className="flex items-center justify-between flex-wrap gap-4">
      <h1 className="text-2xl font-heading font-bold">Finance</h1>
      <div className="flex gap-2">
        {[['today','Today'],['week','This Week'],['month','This Month'],['year','This Year']].map(([value,label]) => (
          <button key={value} type="button" onClick={() => setPeriod(value)} className={`px-4 py-2 rounded-xl text-sm font-medium ${period === value ? 'bg-wave-500 text-white' : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400'}`}>{label}</button>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-5"><DollarSign className="w-8 h-8 text-green-500 mb-3"/><p className="text-2xl font-bold">₦{stats.total_revenue.toLocaleString()}</p><p className="text-sm text-gray-500">Delivered Gross Value</p></Card>
      <Card className="p-5"><TrendingUp className="w-8 h-8 text-wave-500 mb-3"/><p className="text-2xl font-bold">₦{stats.total_commission.toLocaleString()}</p><p className="text-sm text-gray-500">Estimated Platform Share</p></Card>
      <Card className="p-5"><ArrowUpRight className="w-8 h-8 text-blue-500 mb-3"/><p className="text-2xl font-bold">₦{(stats.total_payouts || 0).toLocaleString()}</p><p className="text-sm text-gray-500">Completed Withdrawals</p></Card>
      <Card className="p-5"><TrendingDown className="w-8 h-8 text-red-500 mb-3"/><p className="text-2xl font-bold">₦{(stats.pending_withdrawals || 0).toLocaleString()}</p><p className="text-sm text-gray-500">Pending/Processing</p></Card>
    </div>

    <Card className="p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-heading font-bold text-lg">Withdrawal Requests</h3>
          <p className="text-sm text-gray-500">Review rider payout requests. Completing a request finalizes the reserved wallet balance.</p>
        </div>
        <Badge variant="warning">{withdrawals.filter(w => ['pending', 'processing'].includes(w.status)).length} open</Badge>
      </div>
      <WithdrawalList withdrawals={withdrawals} isLoading={isLoading} processingId={processingId} onUpdate={handleWithdrawal}/>
    </Card>

    <Card className="p-6"><h3 className="font-heading font-bold text-lg mb-4">Recorded Transactions</h3><Tabs tabs={tabs} defaultTab="all" variant="underline"/></Card>
  </div>;
};

const WithdrawalList: React.FC<{
  withdrawals: AdminWithdrawal[];
  isLoading: boolean;
  processingId: string | null;
  onUpdate: (withdrawal: AdminWithdrawal, status: 'processing' | 'completed' | 'rejected') => Promise<void>;
}> = ({ withdrawals, isLoading, processingId, onUpdate }) => {
  if (isLoading && !withdrawals.length) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-dark-border animate-pulse rounded-xl"/>)}</div>;
  if (!withdrawals.length) return <div className="text-center py-10 text-gray-500">No withdrawal requests yet</div>;

  return <div className="space-y-3">{withdrawals.map(withdrawal => {
    const busy = processingId === withdrawal.id;
    const open = ['pending', 'processing'].includes(withdrawal.status);
    return <div key={withdrawal.id} className="p-4 rounded-xl border border-gray-100 dark:border-dark-border">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{withdrawal.rider_name}</p>
            <Badge variant={withdrawal.status === 'completed' ? 'success' : withdrawal.status === 'rejected' ? 'error' : 'warning'} size="sm">{withdrawal.status}</Badge>
          </div>
          <p className="text-sm text-gray-500">{withdrawal.rider_email}</p>
          <p className="text-sm mt-1">{withdrawal.bank_name} · {withdrawal.account_number} · {withdrawal.account_name}</p>
          <p className="text-xs text-gray-400 mt-1">Requested {new Date(withdrawal.requested_at).toLocaleString()}</p>
        </div>
        <div className="lg:text-right">
          <p className="text-xl font-bold">₦{Number(withdrawal.amount).toLocaleString()}</p>
          {open && <div className="flex gap-2 mt-2 lg:justify-end flex-wrap">
            {withdrawal.status === 'pending' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => void onUpdate(withdrawal, 'processing')}>Mark processing</Button>}
            <Button size="sm" disabled={busy} onClick={() => void onUpdate(withdrawal, 'completed')}>Complete</Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => void onUpdate(withdrawal, 'rejected')}>Reject</Button>
          </div>}
        </div>
      </div>
    </div>;
  })}</div>;
};

const TransactionList: React.FC<{ transactions: Transaction[]; isLoading: boolean }> = ({ transactions, isLoading }) => {
  if (isLoading) return <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-dark-border animate-pulse rounded-xl"/>)}</div>;
  if (!transactions.length) return <div className="text-center py-12 text-gray-500">No recorded transactions found</div>;
  return <div className="space-y-4">{transactions.map(tx => {
    const incoming = tx.type === 'payment';
    return <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-border last:border-0"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${incoming ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>{incoming ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}</div><div><p className="font-medium">{tx.description || tx.type.replace('_', ' ')}</p><p className="text-sm text-gray-500">{new Date(tx.date).toLocaleString()}</p></div></div><div className="text-right"><p className={`font-bold ${incoming ? 'text-green-500' : 'text-red-500'}`}>{incoming ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}</p><Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'} size="sm">{tx.status}</Badge></div></div>;
  })}</div>;
};
export default AdminFinance;
