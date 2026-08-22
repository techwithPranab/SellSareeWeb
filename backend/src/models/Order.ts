import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../interfaces';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../constants';
import { generateOrderNumber } from '../utils/generateToken';

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    color: { type: String },
    sku: { type: String, required: true },
    discount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
  },
  { _id: true }
);

const ShippingInfoSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
  },
  { _id: false }
);

const PaymentInfoSchema = new Schema(
  {
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paidAt: { type: Date },
    failureReason: { type: String },
    manualTransactionId: { type: String, trim: true, maxlength: 150 },
    paymentScreenshot: { type: String },
    paymentScreenshotPublicId: { type: String },
  },
  { _id: false }
);

const TrackingInfoSchema = new Schema(
  {
    courier: { type: String },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    shippedAt: { type: Date },
    expectedDelivery: { type: Date },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: ShippingInfoSchema, required: true },
    paymentInfo: { type: PaymentInfoSchema, required: true },
    trackingInfo: { type: TrackingInfoSchema },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, uppercase: true },
    couponDiscount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    notes: { type: String },
    cancelReason: { type: String },
    returnReason: { type: String },
    returnRequestedAt: { type: Date },
    deliveredAt: { type: Date },
    isReturnable: { type: Boolean, default: true },
    returnWindowDays: { type: Number, default: 7 },
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 },
    loyaltyPointsAwarded: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'paymentInfo.status': 1 });
OrderSchema.index({ 'paymentInfo.status': 1, 'paymentInfo.paidAt': -1 });
OrderSchema.index({ 'paymentInfo.razorpayOrderId': 1 });
OrderSchema.index({ createdAt: -1 });

// Virtual: isReturnWindowOpen
OrderSchema.virtual('isReturnWindowOpen').get(function () {
  if (!this.deliveredAt || !this.isReturnable) return false;
  const windowEnd = new Date(this.deliveredAt.getTime() + this.returnWindowDays * 24 * 60 * 60 * 1000);
  return new Date() <= windowEnd;
});

// Pre-save: Generate order number
OrderSchema.pre('save', function (next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = generateOrderNumber();
  }
  next();
});

const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
