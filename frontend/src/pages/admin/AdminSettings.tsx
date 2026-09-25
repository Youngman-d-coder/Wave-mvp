import React from 'react';
import { ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const AdminSettings: React.FC = () => <div className="space-y-6"><h1 className="text-2xl font-heading font-bold">Settings</h1><Card className="p-6"><div className="flex gap-3"><ShieldCheck className="w-6 h-6 text-green-500"/><div><h2 className="font-bold">Security-sensitive configuration</h2><p className="text-sm text-gray-500 mt-1">Secrets, allowed hosts, CORS, OTP provider and production security settings are configured through backend environment variables rather than editable browser controls.</p></div></div></Card><Card className="p-6"><div className="flex gap-3"><SlidersHorizontal className="w-6 h-6 text-wave-500"/><div><h2 className="font-bold">Pricing</h2><p className="text-sm text-gray-500 mt-1">Pricing persistence is not implemented in this MVP. The backend now rejects pricing-update requests instead of falsely reporting that unsaved changes succeeded.</p></div></div></Card></div>;
export default AdminSettings;
