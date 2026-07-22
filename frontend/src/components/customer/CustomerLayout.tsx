import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Package, 
  Clock, 
  User, 
  Heart, 
  Bell, 
  Menu, 
  X,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';

const navItems = [
  { path: '/customer', label: 'Book Delivery', icon: MapPin },
  { path: '/customer/deliveries', label: 'My Deliveries', icon: Package },
  { path: '/customer/history', label: 'History', icon: Clock },
  { path: '/customer/favorites', label: 'Favorites', icon: Heart },
  { path: '/customer/profile', label: 'Profile', icon: User },
];

export const CustomerLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess } = useToast();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully');
    navigate('/login');
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setShowNotifications(false);
    // Navigate based on notification type
    if (notification.type === 'delivery' && notification.data?.delivery_id) {
      navigate(`/customer/tracking/${notification.data.delivery_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl border-b border-gray-100 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
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
                  WAVE
                </span>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/customer'}
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
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border text-gray-600 dark:text-gray-400 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-wave-500 rounded-full animate-pulse" />
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border z-50 overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs text-wave-500 hover:text-wave-600 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notification) => (
                            <div 
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 border-b border-gray-50 dark:border-dark-border/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors ${
                                !notification.read ? 'bg-wave-50/50 dark:bg-wave-900/10' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                  !notification.read ? 'bg-wave-500' : 'bg-transparent'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notification.created_at).toLocaleTimeString()}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-border text-gray-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 dark:border-dark-border text-center">
                          <button 
                            onClick={() => { setShowNotifications(false); navigate('/customer/notifications'); }}
                            className="text-sm text-wave-500 hover:text-wave-600 font-medium"
                          >
                            View all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2 ml-2">
                <Avatar 
                  src={user?.avatar} 
                  name={user?.full_name} 
                  size="sm" 
                />
              </div>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/customer'}
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
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  leftIcon={<LogOut className="w-5 h-5" />}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;