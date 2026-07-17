import { Routes, Route } from 'react-router-dom'

// Auth pages (to be created)
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OTPVerificationPage from './pages/auth/OTPVerificationPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Customer
import CustomerLayout from './components/customer/CustomerLayout'
import CustomerHome from './pages/customer/CustomerHome'
import CustomerDeliveries from './pages/customer/CustomerDeliveries'
import CustomerProfile from './pages/customer/CustomerProfile'
import CustomerFavorites from './pages/customer/CustomerFavorites'
import CustomerTracking from './pages/customer/CustomerTracking'

// Rider
import RiderLayout from './components/rider/RiderLayout'
import RiderHome from './pages/rider/RiderHome'
import RiderDeliveries from './pages/rider/RiderDeliveries'
import RiderWallet from './components/rider/RiderWallet'
import RiderStats from './components/rider/RiderStats'
import RiderProfile from './pages/rider/RiderProfile'

// Admin
import AdminLayout from './components/admin/AdminLayout'
import AdminOverview from './pages/admin/AdminOverview'
import AdminRiders from './pages/admin/AdminRiders'
import AdminFinance from './pages/admin/AdminFinance'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OTPVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Customer Routes */}
      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<CustomerHome />} />
        <Route path="deliveries" element={<CustomerDeliveries />} />
        <Route path="history" element={<CustomerDeliveries />} />
        <Route path="favorites" element={<CustomerFavorites />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="tracking/:id" element={<CustomerTracking />} />
      </Route>

      {/* Rider Routes */}
      <Route path="/rider" element={<RiderLayout />}>
        <Route index element={<RiderHome />} />
        <Route path="deliveries" element={<RiderDeliveries />} />
        <Route path="wallet" element={<RiderWallet />} />
        <Route path="stats" element={<RiderStats />} />
        <Route path="profile" element={<RiderProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="riders" element={<AdminRiders />} />
        <Route path="customers" element={<div>Customers Management</div>} />
        <Route path="deliveries" element={<div>Deliveries Management</div>} />
        <Route path="finance" element={<AdminFinance />} />
        <Route path="analytics" element={<div>Analytics Dashboard</div>} />
        <Route path="settings" element={<div>Settings</div>} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<LoginPage />} />
    </Routes>
  )
}

export default App
