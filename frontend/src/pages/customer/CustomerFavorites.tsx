import React from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';

export const CustomerFavorites: React.FC = () => {
  const navigate = useNavigate();
  return <div className="max-w-4xl mx-auto"><h1 className="text-2xl font-heading font-bold mb-6">Favorite Riders</h1><EmptyState icon={<Heart className="w-12 h-12"/>} title="No saved riders yet" description="Saved-rider persistence is not available in this MVP yet. The previous sample riders were demo data and have been removed." actionLabel="Book a Delivery" onAction={() => navigate('/customer')}/></div>;
};
export default CustomerFavorites;
