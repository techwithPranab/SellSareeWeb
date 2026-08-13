import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { userRepository } from '../repositories/user.repository';
import { CustomError } from '../middlewares/error.middleware';
import { HTTP_STATUS, LOYALTY, OrderStatus, REVIEW, UserRole } from '../constants';
import Review from '../models/Review';
import Product from '../models/Product';
import Order from '../models/Order';
import { containsBlockedReviewContent } from '../utils/contentModeration';
import mongoose from 'mongoose';

// ========================= CUSTOMER =========================

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.user!.id);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  ApiResponse.success(res, 'Profile retrieved', { user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, preferredLanguage, preferredCurrency } = req.body;
  const user = await userRepository.updateById(req.user!.id, {
    name, phone, preferredLanguage, preferredCurrency,
  });
  if (!user) return ApiResponse.notFound(res, 'User not found');
  ApiResponse.success(res, 'Profile updated', { user });
});

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.user!.id);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  ApiResponse.success(res, 'Addresses retrieved', { addresses: user.addresses });
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.addAddress(req.user!.id, req.body);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  ApiResponse.created(res, 'Address added', { addresses: user.addresses });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.updateAddress(req.user!.id, req.params.addressId, req.body);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  ApiResponse.success(res, 'Address updated', { addresses: user.addresses });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.deleteAddress(req.user!.id, req.params.addressId);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  ApiResponse.success(res, 'Address deleted', { addresses: user.addresses });
});

export const setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.setDefaultAddress(req.user!.id, req.params.addressId);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  ApiResponse.success(res, 'Default address set', { addresses: user.addresses });
});

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.user!.id);
  if (!user) return ApiResponse.notFound(res, 'User not found');

  const populatedUser = await user.populate('wishlist', 'name slug price discountedPrice salePrice isSale images averageRating');
  ApiResponse.success(res, 'Wishlist retrieved', { wishlist: populatedUser.wishlist });
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.addToWishlist(req.user!.id, req.params.productId);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  ApiResponse.success(res, 'Added to wishlist');
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.removeFromWishlist(req.user!.id, req.params.productId);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  ApiResponse.success(res, 'Removed from wishlist');
});

export const getLoyaltyPoints = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.user!.id);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  ApiResponse.success(res, 'Loyalty points retrieved', {
    points: user.loyaltyPoints,
    worth: user.loyaltyPoints * LOYALTY.RUPEES_PER_POINT,
  });
});

// ========================= REVIEWS =========================

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { productId, rating, title, comment, orderId } = req.body;
  const normalizedTitle = String(title || '').trim();
  const normalizedComment = String(comment || '').trim();
  const normalizedRating = Number(rating);

  if (!productId || !mongoose.isValidObjectId(productId) || !(await Product.exists({ _id: productId, isActive: true }))) {
    return ApiResponse.badRequest(res, 'Product is not available for review');
  }
  if (!Number.isInteger(normalizedRating) || normalizedRating < REVIEW.MIN_RATING || normalizedRating > REVIEW.MAX_RATING) {
    return ApiResponse.badRequest(res, 'Rating must be a whole number between 1 and 5');
  }
  if (!normalizedTitle || normalizedTitle.length > 100) {
    return ApiResponse.badRequest(res, 'Review title is required and cannot exceed 100 characters');
  }
  if (normalizedComment.length < REVIEW.MIN_COMMENT_LENGTH || normalizedComment.length > REVIEW.MAX_COMMENT_LENGTH) {
    return ApiResponse.badRequest(res, `Review must be between ${REVIEW.MIN_COMMENT_LENGTH} and ${REVIEW.MAX_COMMENT_LENGTH} characters`);
  }
  if (containsBlockedReviewContent(normalizedTitle, normalizedComment)) {
    return ApiResponse.badRequest(res, 'Please remove sexual, abusive, or offensive language from your review');
  }

  const existingReview = await Review.findOne({
    product: productId,
    user: req.user!.id,
  });

  if (existingReview) {
    throw new CustomError('You have already reviewed this product', HTTP_STATUS.CONFLICT);
  }

  const purchaseFilter: Record<string, unknown> = {
    user: req.user!.id,
    status: OrderStatus.DELIVERED,
    'items.product': productId,
  };
  if (orderId && mongoose.isValidObjectId(orderId)) purchaseFilter._id = orderId;
  const verifiedOrder = await Order.findOne(purchaseFilter).select('_id');

  const review = await Review.create({
    product: productId,
    user: req.user!.id,
    order: verifiedOrder?._id,
    rating: normalizedRating,
    title: normalizedTitle,
    comment: normalizedComment,
    isVerifiedPurchase: Boolean(verifiedOrder),
  });

  return ApiResponse.created(res, 'Review submitted for approval', { review });
});

export const getMyReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ user: req.user!.id })
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments({ user: req.user!.id }),
  ]);

  ApiResponse.paginated(res, 'Your reviews retrieved', reviews, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    hasNextPage: skip + Number(limit) < total,
    hasPrevPage: Number(page) > 1,
  });
});

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ product: req.params.productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments({ product: req.params.productId, isApproved: true }),
  ]);

  ApiResponse.paginated(res, 'Reviews retrieved', reviews, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    hasNextPage: skip + Number(limit) < total,
    hasPrevPage: Number(page) > 1,
  });
});

// ========================= ADMIN =========================

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, role, search } = req.query;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: new RegExp(search as string, 'i') },
      { email: new RegExp(search as string, 'i') },
    ];
  }

  const result = await userRepository.findAll(filter as Parameters<typeof userRepository.findAll>[0], {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });

  ApiResponse.paginated(res, 'Users retrieved', result.data, result.meta);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.params.id);
  if (!user) return ApiResponse.notFound(res, 'User not found');
  ApiResponse.success(res, 'User retrieved', { user });
});

export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.params.id);
  if (!user) return ApiResponse.notFound(res, 'User not found');

  const updated = await userRepository.updateById(req.params.id, { isActive: !user.isActive });
  ApiResponse.success(
    res,
    `User ${updated?.isActive ? 'activated' : 'deactivated'} successfully`,
    { user: updated }
  );
});

export const updateCustomerByAdmin = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.params.id);
  if (!user) return ApiResponse.notFound(res, 'User not found');

  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = req.body.phone ? String(req.body.phone).replace(/\D/g, '') : undefined;
  const importantDates = Array.isArray(req.body.importantDates) ? req.body.importantDates : [];

  if (name.length < 2 || name.length > 50 || !/^\S+@\S+\.\S+$/.test(email)) {
    return ApiResponse.badRequest(res, 'Valid customer name and email are required');
  }
  if (phone && !/^[6-9]\d{9}$/.test(phone)) {
    return ApiResponse.badRequest(res, 'Please enter a valid Indian phone number');
  }
  if (importantDates.length > 20) {
    return ApiResponse.badRequest(res, 'A maximum of 20 important dates is allowed');
  }

  const normalizedDates: Array<{ label: string; date: Date; notes: string }> = importantDates.map((entry: { label?: unknown; date?: unknown; notes?: unknown }) => ({
    label: String(entry.label || '').trim(),
    date: new Date(String(entry.date || '')),
    notes: String(entry.notes || '').trim(),
  }));

  if (normalizedDates.some((entry) => !entry.label || Number.isNaN(entry.date.getTime()))) {
    return ApiResponse.badRequest(res, 'Every important date needs a valid label and date');
  }

  const updated = await userRepository.updateById(req.params.id, {
    name,
    email,
    phone,
    importantDates: normalizedDates,
  });

  return ApiResponse.success(res, 'Customer details updated', { user: updated });
});

export const getAllReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, isApproved } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter: Record<string, unknown> = {};
  if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, 'Reviews retrieved', reviews, {
    total, page: Number(page), limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    hasNextPage: skip + Number(limit) < total,
    hasPrevPage: Number(page) > 1,
  });
});

export const approveReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) return ApiResponse.notFound(res, 'Review not found');
  review.isApproved = true;
  await review.save();
  ApiResponse.success(res, 'Review approved', { review });
});

export const rejectReview = asyncHandler(async (req: Request, res: Response) => {
  await Review.findByIdAndDelete(req.params.id);
  ApiResponse.success(res, 'Review rejected and removed');
});

export const replyToReview = asyncHandler(async (req: Request, res: Response) => {
  const { reply } = req.body;
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { adminReply: reply, adminReplyAt: new Date() },
    { new: true }
  );
  if (!review) return ApiResponse.notFound(res, 'Review not found');
  ApiResponse.success(res, 'Reply added', { review });
});
