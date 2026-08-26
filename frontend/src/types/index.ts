// =============================================
// PP’S AURA — FRONTEND TYPES
// =============================================

export type UserRole = 'customer' | 'admin' | 'super_admin' | 'vendor';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refund_initiated'
  | 'refunded';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';

export type PaymentMethod = 'razorpay' | 'upi' | 'wallet';

// =============================================
// USER
// =============================================

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
}

export interface ImportantDate {
  _id?: string;
  label: string;
  date: string;
  notes?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  addresses: Address[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  googleId?: string;
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: string;
  wishlist: string[];
  preferredLanguage: string;
  preferredCurrency: string;
  lastLogin?: string;
  importantDates: ImportantDate[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// =============================================
// PRODUCT
// =============================================

export interface ProductImage {
  url: string;
  publicId: string;
  alt?: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  color: string;
  colorCode: string;
  stock: number;
  sku: string;
  price?: number;
  images: ProductImage[];
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | Category;
  level: number;
  sortOrder: number;
  isActive: boolean;
  showInHeader?: boolean;
  productCount: number;
  children?: Category[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  category: Category | string;
  subCategory?: string;
  tags: string[];
  fabric: string;
  occasion: string[];
  style: string;
  color: string;
  colorCode: string;
  pattern: string;
  blouseLength: string;
  sareeLength: string;
  careInstructions: string[];
  price: number;
  discountedPrice?: number;
  salePrice?: number;
  isSale: boolean;
  discountPercent: number;
  stock: number;
  soldCount: number;
  images: ProductImage[];
  video?: string;
  variants: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isBridal: boolean;
  launchDate?: string | null;
  averageRating: number;
  totalReviews: number;
  relatedProducts: Product[] | string[];
  metaTitle?: string;
  metaDescription?: string;
  isOnSale: boolean;
  effectivePrice: number;
  status: 'active' | 'coming_soon' | 'inactive' | 'out_of_stock' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  fabric?: string;
  occasion?: string;
  color?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isBridal?: boolean;
  search?: string;
  tags?: string[];
}

export interface ProductsState {
  items: Product[];
  featuredProducts: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  currentProduct: Product | null;
  relatedProducts: Product[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta | null;
  filters: ProductFilter;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  recentlyViewed: Product[];
}

// =============================================
// CART
// =============================================

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  color?: string;
  price: number;
  subtotal: number;
}

export interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  loyaltyPointsToRedeem: number;
  isLoading: boolean;
  error: string | null;
}

export interface CartSummary {
  subtotal: number;
  shippingCharge: number;
  taxAmount: number;
  discount: number;
  couponDiscount: number;
  loyaltyDiscount: number;
  total: number;
  itemCount: number;
  loyaltyPointsEarned: number;
}

// =============================================
// ORDER
// =============================================

export interface OrderItem {
  _id: string;
  product: Product | string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
  sku: string;
  discount: number;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: PaymentStatus;
  paidAt?: string;
  failureReason?: string;
  manualTransactionId?: string;
  paymentScreenshot?: string;
}

export interface TrackingInfo {
  courier: string;
  trackingNumber: string;
  trackingUrl?: string;
  shippedAt?: string;
  expectedDelivery?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: User | string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentInfo: PaymentInfo;
  trackingInfo?: TrackingInfo;
  status: OrderStatus;
  subtotal: number;
  shippingCharge: number;
  taxAmount: number;
  discount: number;
  couponCode?: string;
  couponDiscount: number;
  totalAmount: number;
  notes?: string;
  cancelReason?: string;
  returnReason?: string;
  returnRequestedAt?: string;
  deliveredAt?: string;
  isReturnable: boolean;
  returnWindowDays: number;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  loyaltyPointsAwarded: boolean;
  inventoryReservationExpiresAt?: string;
  inventoryRestored: boolean;
  isReturnWindowOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta | null;
}

// =============================================
// REVIEW
// =============================================

export interface Review {
  _id: string;
  product: string | Pick<Product, '_id' | 'name' | 'slug'>;
  user: Pick<User, '_id' | 'name' | 'avatar'>;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  isFeaturedOnHomepage: boolean;
  helpfulCount: number;
  adminReply?: string;
  adminReplyAt?: string;
  createdAt: string;
}

// =============================================
// BANNER
// =============================================

export interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  imagePublicId?: string;
  mobileImage?: string;
  link?: string;
  position: 'hero' | 'middle' | 'bottom' | 'popup' | 'sidebar';
  sortOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

// =============================================
// COUPON
// =============================================

export interface Coupon {
  code: string;
  type: string;
  discountValue: number;
  discountAmount: number;
  description: string;
}

export interface WishlistState {
  productIds: string[];
}

// =============================================
// API RESPONSE
// =============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number | null;
  prevPage?: number | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    pagination: PaginationMeta;
  };
}

// =============================================
// FORMS
// =============================================

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  referralCode?: string;
  acceptTerms: boolean;
}

export interface CheckoutFormData {
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  paymentMethod: PaymentMethod;
  couponCode?: string;
  loyaltyPointsToRedeem?: number;
  notes?: string;
}

// =============================================
// DASHBOARD STATS
// =============================================

export interface DashboardStats {
  totalOrders: number;
  monthlyRevenue: number;
  monthlyOrders: number;
  todayRevenue: number;
  todayOrders: number;
  averageOrderValue: number;
  totalProducts: number;
  activeProducts: number;
  totalCustomers: number;
  statusDistribution: Array<{ _id: OrderStatus; count: number }>;
  dailyRevenue: Array<{ _id: string; revenue: number; orders: number }>;
  topProducts: Array<{ _id: string; name: string; quantity: number; revenue: number }>;
  paymentDistribution: Array<{ _id: PaymentMethod; count: number; amount: number }>;
  lastUpdated: string;
}

// =============================================
// NOTIFICATION
// =============================================

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}
