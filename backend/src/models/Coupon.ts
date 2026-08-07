import mongoose, { Schema } from 'mongoose';
import { ICoupon } from '../interfaces';
import { CouponType } from '../constants';

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [4, 'Coupon code must be at least 4 characters'],
      maxlength: [20, 'Coupon code cannot exceed 20 characters'],
      match: [/^[A-Z0-9_-]+$/, 'Coupon code can only contain letters, numbers, underscores and hyphens'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    type: {
      type: String,
      enum: Object.values(CouponType),
      required: [true, 'Coupon type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    userUsageLimit: {
      type: Number,
      default: 1,
    },
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes
CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, endDate: 1 });

// Virtual: isExpired
CouponSchema.virtual('isExpired').get(function () {
  return new Date() > this.endDate;
});

// Virtual: isValid
CouponSchema.virtual('isValid').get(function () {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
});

const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
export default Coupon;
