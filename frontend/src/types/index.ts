// WAVE Platform - TypeScript Type Definitions

// ==================== USER TYPES ====================

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  avatar?: string;
  user_type: 'customer' | 'rider' | 'admin';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer extends User {
  favorite_riders: Rider[];
  total_deliveries: number;
  total_spent: number;
}

export interface Rider extends User {
  vehicle: Vehicle;
  documents: RiderDocuments;
  wallet: Wallet;
  stats: RiderStats;
  level: RiderLevel;
  is_online: boolean;
  current_location?: GeoLocation;
  rating: number;
  total_reviews: number;
  verification_status: VerificationStatus;
}

export interface Admin extends User {
  role: 'super_admin' | 'admin' | 'support';
  permissions: string[];
}

// ==================== AUTH TYPES ====================

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  user_type: 'customer' | 'rider';
}

export interface OTPData {
  phone: string;
  otp: string;
}

// ==================== LOCATION TYPES ====================

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  coordinates: GeoLocation;
  is_default?: boolean;
}

// ==================== DELIVERY TYPES ====================

export type DeliveryStatus = 
  | 'pending'
  | 'searching_rider'
  | 'rider_assigned'
  | 'rider_arrived'
  | 'picked_up'
  | 'in_transit'
  | 'near_destination'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export type PackageType = 
  | 'document'
  | 'small_package'
  | 'medium_package'
  | 'large_package'
  | 'fragile';

export interface Delivery {
  id: string;
  tracking_number: string;
  customer: Customer;
  rider?: Rider;
  pickup: DeliveryLocation;
  dropoff: DeliveryLocation;
  package: PackageDetails;
  status: DeliveryStatus;
  fare: FareBreakdown;
  payment: PaymentInfo;
  timeline: TimelineEvent[];
  notes?: string;
  created_at: string;
  updated_at: string;
  estimated_distance: number;
  estimated_duration: number;
}

export interface DeliveryLocation {
  address: string;
  coordinates: GeoLocation;
  contact_name: string;
  contact_phone: string;
  instructions?: string;
}

export interface PackageDetails {
  type: PackageType;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  description?: string;
  is_fragile: boolean;
}

export interface FareBreakdown {
  base_fare: number;
  distance_charge: number;
  weight_charge: number;
  surge_multiplier: number;
  promo_discount: number;
  total: number;
  currency: string;
}

export interface TimelineEvent {
  status: DeliveryStatus;
  timestamp: string;
  location?: GeoLocation;
  note?: string;
}

// ==================== PAYMENT TYPES ====================

export type PaymentMethod = 'card' | 'bank_transfer' | 'wallet';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface PaymentInfo {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transaction_id?: string;
  paid_at?: string;
}

export interface Wallet {
  balance: number;
  pending_balance: number;
  currency: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  bank_account: BankAccount;
  requested_at: string;
  processed_at?: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
}

// ==================== RIDER TYPES ====================

export interface Vehicle {
  type: 'motorcycle' | 'bicycle' | 'car' | 'van';
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  plate_number: string;
  registration_doc?: string;
}

export interface RiderDocuments {
  id_card: string;
  driver_license: string;
  vehicle_registration: string;
  insurance?: string;
}

export interface RiderStats {
  total_kilometers: number;
  successful_rides: number;
  failed_rides: number;
  completion_rate: number;
  average_rating: number;
  total_earnings: number;
  total_commission_generated: number;
}

export type RiderLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'elite';
export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected';

// ==================== NOTIFICATION TYPES ====================

export type NotificationType = 
  | 'delivery_update'
  | 'payment'
  | 'rider_alert'
  | 'system'
  | 'promo';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

// ==================== ADMIN TYPES ====================

export interface DashboardStats {
  total_revenue: number;
  today_revenue: number;
  total_commission: number;
  active_riders: number;
  active_customers: number;
  live_deliveries: number;
}

export interface FleetAnalytics {
  total_registered_riders: number;
  riders_online: number;
  riders_offline: number;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  total_kilometers: number;
  average_distance: number;
  average_time: number;
}

export interface RiderAnalytics extends RiderStats {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'online' | 'offline' | 'busy';
  verification_status: VerificationStatus;
  commission_generated: number;
}

export interface LeaderboardEntry {
  rank: number;
  rider: Rider;
  value: number;
  metric: string;
}

export interface PricingConfig {
  base_fare: number;
  per_km_rate: number;
  per_kg_rate: number;
  surge_multiplier: number;
  surge_threshold: number;
  minimum_fare: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

// ==================== UI TYPES ====================

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
