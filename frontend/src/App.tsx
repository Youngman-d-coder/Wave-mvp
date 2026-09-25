import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OTPVerificationPage from './pages/auth/OTPVerificationPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import CustomerLayout from './components/customer/CustomerLayout';
import CustomerHome from './pages/customer/CustomerHome';
import CustomerDeliveries from './pages/customer/CustomerDeliveries';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerFavorites from './pages/customer/CustomerFavorites';
import CustomerTracking from './pages/customer/CustomerTracking';
import RiderLayout from './components/rider/RiderLayout';
import RiderHome from './pages/rider/RiderHome';
import RiderDeliveries from './pages/rider/RiderDeliveries';
import RiderWallet from './components/rider/RiderWallet';
import RiderStats from './components/rider/RiderStats';
import RiderProfile from './pages/rider/RiderProfile';
import AdminLayout from './components/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminRiders from './pages/admin/AdminRiders';
import AdminFinance from './pages/admin/AdminFinance';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminDeliveries from './pages/admin/AdminDeliveries';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OTPVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route element={<ProtectedRoute roles={['customer']} />}>
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<CustomerHome />} />
          <Route path="deliveries" element={<CustomerDeliveries />} />
          <Route path="history" element={<CustomerDeliveries />} />
          <Route path="favorites" element={<CustomerFavorites />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="tracking/:id" element={<CustomerTracking />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['rider']} />}>
        <Route path="/rider" element={<RiderLayout />}>
          <Route index element={<RiderHome />} />
          <Route path="deliveries" element={<RiderDeliveries />} />
          <Route path="wallet" element={<RiderWallet />} />
          <Route path="stats" element={<RiderStats />} />
          <Route path="profile" element={<RiderProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="riders" element={<AdminRiders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="deliveries" element={<AdminDeliveries />} />
          <Route path="finance" element={<AdminFinance />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
