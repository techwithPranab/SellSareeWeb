// ================================================
// PP’S AURA — BACKEND CONSTANTS
// ================================================

export const APP_NAME = 'PP’s Aura';
export const APP_VERSION = '1.0.0';
export const API_PREFIX = '/api/v1';

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// User Roles
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  VENDOR = 'vendor',
}

// Order Status
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURN_REQUESTED = 'return_requested',
  RETURNED = 'returned',
  REFUND_INITIATED = 'refund_initiated',
  REFUNDED = 'refunded',
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

// Payment Methods
export enum PaymentMethod {
  RAZORPAY = 'razorpay',
  COD = 'cod',
  UPI = 'upi',
  WALLET = 'wallet',
}

// Product Categories
export enum SareeCategory {
  SILK = 'silk',
  COTTON = 'cotton',
  TANT = 'tant',
  BANARASI = 'banarasi',
  KANJIVARAM = 'kanjivaram',
  BRIDAL = 'bridal',
  DESIGNER = 'designer',
  CHIFFON = 'chiffon',
  GEORGETTE = 'georgette',
  LINEN = 'linen',
  HANDLOOM = 'handloom',
  FESTIVAL = 'festival',
  CASUAL = 'casual',
}

// Product Status
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

// Coupon Types
export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  FREE_SHIPPING = 'free_shipping',
  BUY_X_GET_Y = 'buy_x_get_y',
}

// Notification Types
export enum NotificationType {
  ORDER_PLACED = 'order_placed',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_INITIATED = 'refund_initiated',
  NEW_OFFER = 'new_offer',
  WISHLIST_PRICE_DROP = 'wishlist_price_drop',
  REVIEW_RESPONSE = 'review_response',
  LOYALTY_POINTS_ADDED = 'loyalty_points_added',
  REFERRAL_SUCCESS = 'referral_success',
}

// Return Reasons
export const RETURN_REASONS = [
  'Damaged product',
  'Wrong item delivered',
  'Product not as described',
  'Quality not as expected',
  'Size/fit issue',
  'Color variation',
  'Changed mind',
  'Other',
];

// Shipping
export const SHIPPING = {
  FREE_SHIPPING_THRESHOLD: 999,
  STANDARD_RATE: 99,
  EXPRESS_RATE: 199,
  COD_CHARGES: 49,
  DELIVERY_DAYS_STANDARD: 5,
  DELIVERY_DAYS_EXPRESS: 2,
};

// Loyalty Points
export const LOYALTY = {
  POINTS_PER_RUPEE: 1,
  RUPEES_PER_POINT: 0.1,
  WELCOME_BONUS: 50,
  REVIEW_BONUS: 10,
  REFERRAL_BONUS: 100,
  REFERRAL_FRIEND_BONUS: 50,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
};

// Cache TTL (seconds)
export const CACHE_TTL = {
  PRODUCT_LIST: 300,
  PRODUCT_DETAIL: 600,
  CATEGORY_LIST: 3600,
  BANNER_LIST: 3600,
  USER_PROFILE: 60,
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  MAX_IMAGES_PER_PRODUCT: 8,
};

// Review
export const REVIEW = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MIN_COMMENT_LENGTH: 10,
  MAX_COMMENT_LENGTH: 1000,
};

// OTP
export const OTP = {
  EXPIRES_IN: 10, // minutes
  LENGTH: 6,
};
