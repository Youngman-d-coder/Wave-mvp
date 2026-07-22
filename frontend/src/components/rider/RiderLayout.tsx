import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Wallet, 
  BarChart3, 
  User, 
  Menu, 
  X,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  Power
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useRider } from '../../hooks/useRider';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const navItems = [
  { path: '/rider', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/rider/deliveries', label: 'Deliveries', icon: Package },
  { path: '/rider/wallet', label: 'Wallet', icon: Wallet },
  { path: '/rider/stats', label: 'Statistics', icon: BarChart3 },
  { path: '/rider/profile', label: 'Profile', icon: User },
];

export const RiderLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();
  const { riderProfile, toggleOnline, getProfile } = useRider();
  const [isToggling, setIsToggling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  const isOnline = riderProfile?.is_online || false;

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully');
    navigate('/login');
  };

  const toggleOnlineStatus = async () => {
    setIsToggling(true);
    const result = await toggleOnline(!isOnline);
    setIsToggling(false);
    if (result.success) {
      showSuccess(isOnline ? 'You are now offline' : 'You are now online and ready for deliveries');
    } else {
      showError(result.message || 'Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl border-b border-gray-100 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-wave-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <span className="font-heading font-bold text-xl text-gray-900 dark:text-white">
                  WAVE Rider
                </span>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/rider'}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-wave-50 dark:bg-wave-900/20 text-wave-600 dark:text-wave-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-border'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Online Toggle */}
              <button
                onClick={toggleOnlineStatus}
                disabled={isToggling}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all disabled:opacity-50 ${
                  isOnline 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400'
                }`}
              >
                <Power className={`w-4 h-4 ${isOnline ? 'text-green-500' : 'text-gray-400'}`} />
                {isToggling ? '...' : isOnline ? 'Online' : 'Offline'}
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border text-gray-600 dark:text-gray-400 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Avatar src={user?.avatar} name={user?.full_name} size="sm" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute left-0 top-16 w-72 h-[calc(100vh-4rem)] bg-white dark:bg-dark-card border-r border-gray-100 dark:border-dark-border overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-3 p-4 bg-wave-50 dark:bg-wave-900/20 rounded-xl mb-4">
                <Avatar src={user?.avatar} name={user?.full_name} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{user?.full_name}</p>
                  <Badge variant={isOnline ? 'success' : 'default'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/rider'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${isActive 
                        ? 'bg-wave-50 dark:bg-wave-900/20 text-wave-600 dark:text-wave-400' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </NavLink>
                ))}
              </nav>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-500 hover:text-red-600"
                  leftIcon={<LogOut className="w-5 h-5" />}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default RiderLayout;