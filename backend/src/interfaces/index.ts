import { Document, Types } from 'mongoose';
import { UserRole, OrderStatus, PaymentStatus, PaymentMethod } from '../constants';

// =============================================
// USER INTERFACES
// =============================================

export interface IAddress {
  _id?: Types.ObjectId;
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

export interface IImportantDate {
  _id?: Types.ObjectId;
  label: string;
  date: Date;
  notes?: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  avatar?: string;
  role: UserRole;
  addresses: IAddress[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  googleId?: string;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: Types.ObjectId;
  wishlist: Types.ObjectId[];
  preferredLanguage: string;
  preferredCurrency: string;
  lastLogin?: Date;
  importantDates: IImportantDate[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generatePasswordResetToken(): string;
}

// =============================================
// PRODUCT INTERFACES
// =============================================

export interface IProductImage {
  url: string;
  publicId: string;
  alt?: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface IProductVariant {
  color: string;
  colorCode: string;
  stock: number;
  sku: string;
  price?: number;
  images: IProductImage[];
}

export interface IDimensions {
  length: number;
  width: number;
  weight: number;
  unit: string;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  category: Types.ObjectId;
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
  salePrice?: number;
  discountPercent: number;
  stock: number;
  soldCount: number;
  images: IProductImage[];
  video?: string;
  variants: IProductVariant[];
  dimensions: IDimensions;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isBridal: boolean;
  averageRating: number;
  totalReviews: number;
  metaTitle?: string;
  metaDescription?: string;
  schemaMarkup?: string;
  relatedProducts: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// ORDER INTERFACES
// =============================================

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
  sku: string;
  discount: number;
  subtotal: number;
}

export interface IShippingInfo {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IPaymentInfo {
  method: PaymentMethod;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  paidAt?: Date;
  failureReason?: string;
}

export interface ITrackingInfo {
  courier: string;
  trackingNumber: string;
  trackingUrl?: string;
  shippedAt?: Date;
  expectedDelivery?: Date;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingInfo;
  paymentInfo: IPaymentInfo;
  trackingInfo?: ITrackingInfo;
  status: OrderStatus;
  subtotal: number;
  shippingCharge: number;
  taxAmount: number;
  discount: number;
  couponCode?: string;
  couponDiscount: number;
  totalAmount: number;
  codCharges: number;
  notes?: string;
  cancelReason?: string;
  returnReason?: string;
  returnRequestedAt?: Date;
  deliveredAt?: Date;
  isReturnable: boolean;
  returnWindowDays: number;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// REVIEW INTERFACES
// =============================================

export interface IReview extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  user: Types.ObjectId;
  order?: Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  helpfulUsers: Types.ObjectId[];
  adminReply?: string;
  adminReplyAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// CATEGORY INTERFACES
// =============================================

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  parent?: Types.ObjectId;
  level: number;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// COUPON INTERFACES
// =============================================

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  description: string;
  type: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  userUsageLimit: number;
  usedBy: Types.ObjectId[];
  categories?: Types.ObjectId[];
  products?: Types.ObjectId[];
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// BANNER INTERFACES
// =============================================

export interface IBanner extends Document {
  _id: Types.ObjectId;
  title: string;
  subtitle?: string;
  image: string;
  imagePublicId: string;
  mobileImage?: string;
  link?: string;
  position: 'hero' | 'middle' | 'bottom' | 'popup' | 'sidebar';
  sortOrder: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// REQUEST INTERFACES
// =============================================

export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductFilterQuery extends PaginationQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  fabric?: string;
  occasion?: string;
  color?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  search?: string;
  tags?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// =============================================
// JWT PAYLOAD
// =============================================

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
