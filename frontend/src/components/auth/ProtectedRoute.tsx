import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types';

const homeForRole = (role: User['user_type']) => `/${role}`;

export default function ProtectedRoute({ roles }: { roles: User['user_type'][] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.user_type)) return <Navigate to={homeForRole(user.user_type)} replace />;
  return <Outlet />;
}
