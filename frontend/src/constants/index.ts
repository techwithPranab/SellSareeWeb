// =============================================
// PP’S AURA — FRONTEND CONSTANTS
// =============================================

export const APP_NAME = 'PP’s Aura';
export const APP_TAGLINE = 'Where Every Thread Tells a Story';
export const APP_DESCRIPTION =
  'Shop sarees online at PP’s Aura. Discover Bengali Jamdani, handloom, silk, cotton, Tant and Tasar sarees for weddings, festivals, work and everyday Indian apparel.';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ppaura.in';

// Razorpay
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

// Shipping
export const SHIPPING = {
  FREE_THRESHOLD: 999,
  STANDARD_RATE: 99,
  EXPRESS_RATE: 199,
  STANDARD_DAYS: 5,
  EXPRESS_DAYS: 2,
};

// Loyalty
export const LOYALTY = {
  POINTS_PER_RUPEE: 1,
  RUPEES_PER_POINT: 0.01,
  WELCOME_BONUS: 50,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  PRODUCTS_PER_PAGE: 12,
};

// NAV Links
export const NAV_LINKS: Array<{
  label: string;
  href: string;
  children?: Array<{ label: string; href: string }>;
}> = [
  { label: 'New Arrivals', href: '/products?isNewArrival=true' },
  { label: 'Silk Sarees', href: '/products?fabric=silk' },
  { label: 'Cotton Sarees', href: '/products?fabric=cotton' },
  { label: 'Tant Sarees', href: '/products?fabric=tant' },
];

// Categories
export const SAREE_CATEGORIES = [
  { name: 'Jamdani Sarees', slug: 'jamdani', icon: '✨', color: '#d4a853' },
  { name: 'Handloom Sarees', slug: 'handloom', icon: '🎨', color: '#8b4513' },
  { name: 'Bangladeshi Jamdani', slug: 'bangladeshi-jamdani', icon: '🧵', color: '#3d6b4f' },
  { name: 'Kardana Jamdani', slug: 'kardana-jamdani', icon: '💫', color: '#6b2fa0' },
  { name: 'Silk Sarees', slug: 'silk', icon: '✨', color: '#d4a853' },
  { name: 'Tasar Sarees', slug: 'tasar', icon: '🌿', color: '#8b7355' },
];

// Occasions
export const OCCASIONS = [
  'Wedding', 'Festival', 'Party', 'Casual', 'Office',
  'Puja', 'Reception', 'Sangeet', 'Traditional', 'Daily Wear',
];

// Fabrics
export const FABRICS = [
  'Silk', 'Cotton', 'Tant', 'Banarasi', 'Kanjivaram',
  'Chiffon', 'Georgette', 'Linen', 'Crepe', 'Organza', 'Tussar',
];

// Sort Options
export const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt_desc' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Popular', value: 'soldCount_desc' },
  { label: 'Highest Rated', value: 'averageRating_desc' },
  { label: 'Discount', value: 'discountPercent_desc' },
];

// Price Ranges
export const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 - ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
  { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { label: 'Above ₹10,000', min: 10000, max: 999999 },
];

// Order Status Colors
export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  pending: { label: 'Pending', color: '#f59e0b', bgColor: '#fef3c7', icon: '⏳' },
  confirmed: { label: 'Confirmed', color: '#3b82f6', bgColor: '#dbeafe', icon: '✅' },
  processing: { label: 'Processing', color: '#8b5cf6', bgColor: '#ede9fe', icon: '⚙️' },
  shipped: { label: 'Shipped', color: '#6366f1', bgColor: '#e0e7ff', icon: '📦' },
  out_for_delivery: { label: 'Out for Delivery', color: '#06b6d4', bgColor: '#cffafe', icon: '🚚' },
  delivered: { label: 'Delivered', color: '#10b981', bgColor: '#d1fae5', icon: '✅' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bgColor: '#fee2e2', icon: '❌' },
  return_requested: { label: 'Return Requested', color: '#f97316', bgColor: '#ffedd5', icon: '↩️' },
  returned: { label: 'Returned', color: '#6b7280', bgColor: '#f3f4f6', icon: '🔄' },
  refund_initiated: { label: 'Refund Initiated', color: '#ec4899', bgColor: '#fce7f3', icon: '💳' },
  refunded: { label: 'Refunded', color: '#64748b', bgColor: '#f8fafc', icon: '💰' },
};

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

// Payment Methods
export const PAYMENT_METHODS = [
  {
    id: 'upi',
    label: 'Scan QR Code',
    description: 'Scan and pay securely using any UPI app',
    icon: '📱',
  },
];

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
];

// Colors
export const SAREE_COLORS = [
  { name: 'Red', code: '#ef4444' },
  { name: 'Blue', code: '#3b82f6' },
  { name: 'Green', code: '#22c55e' },
  { name: 'Yellow', code: '#eab308' },
  { name: 'Purple', code: '#a855f7' },
  { name: 'Pink', code: '#ec4899' },
  { name: 'Orange', code: '#f97316' },
  { name: 'Gold', code: '#d4a853' },
  { name: 'Black', code: '#000000' },
  { name: 'White', code: '#ffffff' },
  { name: 'Beige', code: '#f5f0e8' },
  { name: 'Maroon', code: '#7f1d1d' },
  { name: 'Teal', code: '#0d9488' },
  { name: 'Navy', code: '#1e3a5f' },
];


// Social Links
export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/ppsaura',
  facebook: 'https://facebook.com/ppsaura',
  twitter: 'https://twitter.com/ppsaura',
  youtube: 'https://youtube.com/@ppsaura',
  pinterest: 'https://pinterest.com/ppsaura',
  whatsapp: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`,
};

// WhatsApp
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+91XXXXXXXXXX';

// Local Storage Keys
export const STORAGE_KEYS = {
  CART: 'pps_aura_cart',
  WISHLIST: 'pps_aura_wishlist',
  RECENTLY_VIEWED: 'pps_aura_recently_viewed',
  COMPARE_LIST: 'pps_aura_compare',
  AUTH_TOKEN: 'pps_aura_access_token',
  REFRESH_TOKEN: 'pps_aura_refresh_token',
  PREFERRED_LANGUAGE: 'pps_aura_lang',
  PREFERRED_CURRENCY: 'pps_aura_currency',
};

// Currencies
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
];

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
];

// SEO
export const SEO_CONFIG = {
  titleTemplate: `%s | ${APP_NAME}`,
  defaultTitle: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_URL,
    siteName: APP_NAME,
    images: [{ url: `${APP_URL}/images/product-coming-soon.svg`, width: 900, height: 1200 }],
  },
  twitter: {
    cardType: 'summary_large_image',
  },
};
