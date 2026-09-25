import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, Search, Package, WalletCards } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';

export const AdminCustomers: React.FC = () => {
  const { customers, getCustomers, isLoading } = useAdmin();
  const [query, setQuery] = useState('');
  useEffect(() => { void getCustomers(); }, [getCustomers]);
  const filtered = useMemo(() => customers.filter(customer => `${customer.full_name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query.toLowerCase())), [customers, query]);

  return <div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-heading font-bold">Customers ({filtered.length})</h1></div><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search customers..." leftIcon={<Search className="w-5 h-5"/>}/>{isLoading ? <div className="grid gap-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-dark-border animate-pulse"/>)}</div> : filtered.length === 0 ? <Card className="p-8 text-center text-gray-500">No customers found.</Card> : <div className="grid gap-4">{filtered.map(customer => <Card key={customer.id} className="p-5"><div className="flex items-start gap-4"><Avatar src={customer.avatar} name={customer.full_name} size="lg"/><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><h2 className="font-bold text-lg">{customer.full_name}</h2><Badge variant={customer.is_verified ? 'success' : 'warning'}>{customer.is_verified ? 'Verified' : 'Unverified'}</Badge></div><div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-500"><span className="flex items-center gap-2"><Mail className="w-4 h-4"/>{customer.email}</span><span className="flex items-center gap-2"><Phone className="w-4 h-4"/>{customer.phone || 'No phone'}</span><span className="flex items-center gap-2"><Package className="w-4 h-4"/>{customer.total_deliveries ?? 0} deliveries</span><span className="flex items-center gap-2"><WalletCards className="w-4 h-4"/>₦{(customer.total_spent ?? 0).toLocaleString()} delivered value</span></div></div><span className="text-xs text-gray-400">Joined {new Date(customer.created_at).toLocaleDateString()}</span></div></Card>)}</div>}</div>;
};
export default AdminCustomers;
