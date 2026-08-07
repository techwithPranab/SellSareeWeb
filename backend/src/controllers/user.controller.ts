import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { userRepository } from '../repositories/user.repository';
import { CustomError } from '../middlewares/error.middleware';
import { HTTP_STATUS, UserRole } from '../constants';
import Review from '../models/Review';

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

  const populatedUser = await user.populate('wishlist', 'name slug price salePrice images averageRating');
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
    worth: user.loyaltyPoints * 0.1,
  });
});

// ========================= REVIEWS =========================

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { productId, rating, title, comment, orderId } = req.body;

  const existingReview = await Review.findOne({
    product: productId,
    user: req.user!.id,
  });

  if (existingReview) {
    throw new CustomError('You have already reviewed this product', HTTP_STATUS.CONFLICT);
  }

  const review = await Review.create({
    product: productId,
    user: req.user!.id,
    order: orderId,
    rating,
    title,
    comment,
    isVerifiedPurchase: !!orderId,
  });

  ApiResponse.created(res, 'Review submitted for approval', { review });
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
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: true },
    { new: true }
  );
  if (!review) return ApiResponse.notFound(res, 'Review not found');
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
