import type { Route } from 'next';
import { Product, Order, Review, User, CartSummary, CartItem } from '@/types';
import { SHIPPING, LOYALTY } from '@/constants';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Class Name Utility ────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Cast dynamic paths for Next.js typed routes */
export const asRoute = (href: string): Route => href as Route;

// =============================================
// CURRENCY FORMATTING
// =============================================

export const formatCurrency = (
  amount: number,
  currency = 'INR',
  locale = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString('en-IN')}`;
};

export const formatPaymentMethod = (method: string): string => {
  const labels: Record<string, string> = {
    razorpay: 'Online Payment',
    upi: 'UPI',
    wallet: 'Wallet',
  };
  return labels[method] ?? 'Offline Payment';
};

export const formatDiscount = (originalPrice: number, salePrice: number): number => {
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// =============================================
// DATE FORMATTING
// =============================================

export const formatDate = (date: string | Date, formatStr = 'dd MMM yyyy'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, formatStr);
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'dd MMM yyyy, hh:mm a');
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return 'Unknown';
  return formatDistanceToNow(d, { addSuffix: true });
};

// =============================================
// CART CALCULATIONS
// =============================================

export const calculateCartSummary = (
  items: CartItem[],
  couponDiscount = 0,
  loyaltyPointsToRedeem = 0,
  paymentMethod = 'razorpay'
): CartSummary => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingCharge = subtotal >= SHIPPING.FREE_THRESHOLD ? 0 : SHIPPING.STANDARD_RATE;
  const loyaltyDiscount = loyaltyPointsToRedeem * LOYALTY.RUPEES_PER_POINT;
  const taxAmount = 0;
  const discount = couponDiscount + loyaltyDiscount;
  const total = Math.max(0, subtotal + shippingCharge + taxAmount - discount);
  const loyaltyPointsEarned = Math.floor(total * LOYALTY.POINTS_PER_RUPEE);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    shippingCharge,
    taxAmount,
    discount,
    couponDiscount,
    loyaltyDiscount,
    total,
    itemCount,
    loyaltyPointsEarned,
  };
};

// =============================================
// PRODUCT HELPERS
// =============================================

export const getProductDefaultImage = (product: Product): string => {
  if (!product.images || product.images.length === 0) {
    return '/images/placeholder-saree.jpg';
  }
  const defaultImg = product.images.find((img) => img.isDefault);
  return defaultImg?.url || product.images[0].url;
};

export const getProductEffectivePrice = (product: Product): number => {
  return product.salePrice || product.price;
};

export const isProductInStock = (product: Product): boolean => {
  return product.stock > 0 && product.isActive;
};

export const getStockLabel = (stock: number): string => {
  if (stock === 0) return 'Out of Stock';
  if (stock <= 5) return `Only ${stock} left`;
  return 'In Stock';
};

export const getStockColor = (stock: number): string => {
  if (stock === 0) return 'text-red-500';
  if (stock <= 5) return 'text-orange-500';
  return 'text-green-600';
};

export const getProductBreadcrumb = (product: Product) => {
  const category = typeof product.category === 'object' ? product.category : null;
  return [
    { label: 'Home', href: '/' },
    ...(category ? [{ label: category.name, href: `/products?category=${category._id}` }] : []),
    { label: product.name, href: `/products/${product.slug}` },
  ];
};

// =============================================
// ORDER HELPERS
// =============================================

export const getOrderStatusProgress = (status: string): number => {
  const progressMap: Record<string, number> = {
    pending: 10,
    confirmed: 25,
    processing: 40,
    shipped: 60,
    out_for_delivery: 80,
    delivered: 100,
    cancelled: 0,
    return_requested: 50,
    returned: 100,
    refunded: 100,
  };
  return progressMap[status] || 0;
};

export const getOrderTrackingSteps = (status: string) => {
  return [
    { label: 'Order Placed', completed: true, icon: '📝' },
    { label: 'Confirmed', completed: ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(status), icon: '✅' },
    { label: 'Processing', completed: ['processing', 'shipped', 'out_for_delivery', 'delivered'].includes(status), icon: '⚙️' },
    { label: 'Shipped', completed: ['shipped', 'out_for_delivery', 'delivered'].includes(status), icon: '📦' },
    { label: 'Out for Delivery', completed: ['out_for_delivery', 'delivered'].includes(status), icon: '🚚' },
    { label: 'Delivered', completed: status === 'delivered', icon: '🎉' },
  ];
};

// =============================================
// RATING HELPERS
// =============================================

export const getRatingLabel = (rating: number): string => {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3) return 'Average';
  return 'Poor';
};

export const getRatingColor = (rating: number): string => {
  if (rating >= 4) return '#22c55e';
  if (rating >= 3) return '#f59e0b';
  return '#ef4444';
};

// =============================================
// STRING HELPERS
// =============================================

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const slugToTitle = (slug: string): string => {
  return slug.split('-').map(capitalizeFirst).join(' ');
};

export const generateWhatsAppOrderMessage = (order: Order): string => {
  const items = order.items.map((i) => `• ${i.name} x${i.quantity}`).join('\n');
  return encodeURIComponent(
    `Hi! I need help with my order:\n\nOrder #${order.orderNumber}\n\nItems:\n${items}\n\nTotal: ₹${order.totalAmount.toLocaleString('en-IN')}`
  );
};

// =============================================
// VALIDATION HELPERS
// =============================================

export const isValidEmail = (email: string): boolean => {
  return /^\S+@\S+\.\S+$/.test(email);
};

export const isValidIndianPhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone);
};

export const isValidPincode = (pincode: string): boolean => {
  return /^[1-9][0-9]{5}$/.test(pincode);
};

// =============================================
// SEO HELPERS
// =============================================

export const generateProductSchema = (product: Product) => ({
  '@context': 'https://schema.org/',
  '@type': 'Product',
  name: product.name,
  image: product.images.map((img) => img.url),
  description: product.description,
  sku: product.sku,
  brand: { '@type': 'Brand', name: 'PP’s Aura' },
  offers: {
    '@type': 'Offer',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
    priceCurrency: 'INR',
    price: product.salePrice || product.price,
    availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
  },
  aggregateRating: product.totalReviews > 0 ? {
    '@type': 'AggregateRating',
    ratingValue: product.averageRating,
    reviewCount: product.totalReviews,
  } : undefined,
});
