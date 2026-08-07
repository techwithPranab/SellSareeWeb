import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import Coupon from '../models/Coupon';

export const getAllCoupons = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, isActive } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const filter: Record<string, unknown> = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Coupon.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, 'Coupons retrieved', coupons, {
    total, page: Number(page), limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    hasNextPage: skip + Number(limit) < total,
    hasPrevPage: Number(page) > 1,
  });
});

export const getCouponById = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return ApiResponse.notFound(res, 'Coupon not found');
  ApiResponse.success(res, 'Coupon retrieved', { coupon });
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.create(req.body);
  ApiResponse.created(res, 'Coupon created', { coupon });
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) return ApiResponse.notFound(res, 'Coupon not found');
  ApiResponse.success(res, 'Coupon updated', { coupon });
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return ApiResponse.notFound(res, 'Coupon not found');
  ApiResponse.success(res, 'Coupon deleted');
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, orderAmount } = req.body;
  const userId = req.user!.id;

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });

  if (!coupon) {
    return ApiResponse.badRequest(res, 'Invalid or expired coupon code');
  }

  if (orderAmount < coupon.minOrderAmount) {
    return ApiResponse.badRequest(
      res,
      `Minimum order amount of ₹${coupon.minOrderAmount} required`
    );
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return ApiResponse.badRequest(res, 'Coupon usage limit reached');
  }

  const userUsed = coupon.usedBy.filter((id) => id.toString() === userId).length;
  if (userUsed >= coupon.userUsageLimit) {
    return ApiResponse.badRequest(res, 'You have already used this coupon');
  }

  // Calculate discount
  const { CouponType } = await import('../constants');
  let discountAmount = 0;

  if (coupon.type === CouponType.PERCENTAGE) {
    discountAmount = (orderAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  } else if (coupon.type === CouponType.FIXED) {
    discountAmount = Math.min(coupon.discountValue, orderAmount);
  } else if (coupon.type === CouponType.FREE_SHIPPING) {
    discountAmount = 0; // handled separately
  }

  ApiResponse.success(res, 'Coupon is valid', {
    coupon: {
      code: coupon.code,
      type: coupon.type,
      discountValue: coupon.discountValue,
      discountAmount,
      description: coupon.description,
    },
  });
});
