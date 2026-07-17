import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Moon,
  Sun,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';

const navItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/riders', label: 'Riders', icon: Users },
  { path: '/admin/customers', label: 'Customers', icon: Users },
  { path: '/admin/deliveries', label: 'Deliveries', icon: Package },
  { path: '/admin/finance', label: 'Finance', icon: DollarSign },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export const AdminLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-wave-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-gray-900 dark:text-white hidden sm:block">
                WAVE Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border text-gray-600 dark:text-gray-400"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Avatar src={user?.avatar} name={user?.full_name} size="sm" />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
                <Badge variant="wave" size="sm">Admin</Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] bg-white dark:bg-dark-card border-r border-gray-100 dark:border-dark-border
          transition-all duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:w-64
          w-64
        `}>
          <div className="p-4 h-full flex flex-col">
            <nav className="space-y-1 flex-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-wave-50 dark:bg-wave-900/20 text-wave-600 dark:text-wave-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="pt-4 border-t border-gray-100 dark:border-dark-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
