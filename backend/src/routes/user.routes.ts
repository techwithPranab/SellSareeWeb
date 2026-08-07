import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getLoyaltyPoints,
  createReview,
  getProductReviews,
  getMyReviews,
  getAllUsers,
  getUserById,
  toggleUserStatus,
  getAllReviews,
  approveReview,
  rejectReview,
  replyToReview,
} from '../controllers/user.controller';
import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from '../controllers/coupon.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

// ========================= CUSTOMER =========================
router.use(authenticate);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Addresses
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);
router.put('/addresses/:addressId/default', setDefaultAddress);

// Wishlist
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

// Loyalty
router.get('/loyalty-points', getLoyaltyPoints);

// Reviews
router.post('/reviews', createReview);
router.get('/reviews/my', getMyReviews);
router.get('/reviews/product/:productId', getProductReviews);

// Coupon validation
router.post('/coupons/validate', validateCoupon);

// ========================= ADMIN =========================
router.use(requireAdmin);

// User management
router.get('/admin/users', getAllUsers);
router.get('/admin/users/:id', getUserById);
router.put('/admin/users/:id/toggle-status', toggleUserStatus);

// Review moderation
router.get('/admin/reviews', getAllReviews);
router.put('/admin/reviews/:id/approve', approveReview);
router.delete('/admin/reviews/:id', rejectReview);
router.put('/admin/reviews/:id/reply', replyToReview);

// Coupon management
router.get('/admin/coupons', getAllCoupons);
router.get('/admin/coupons/:id', getCouponById);
router.post('/admin/coupons', createCoupon);
router.put('/admin/coupons/:id', updateCoupon);
router.delete('/admin/coupons/:id', deleteCoupon);

export default router;
