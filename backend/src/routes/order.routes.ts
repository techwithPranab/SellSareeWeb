import { Router } from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  requestReturn,
  initiatePayment,
  verifyPayment,
  handleRazorpayWebhook,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  getOrderDashboardStats,
  initiateRefund,
  trackOrderGuest,
} from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

// Webhook (no auth, raw body)
router.post('/webhook/razorpay', handleRazorpayWebhook);

// Public: Guest order tracking
router.get('/track', trackOrderGuest);

// Customer routes (authenticated)
router.use(authenticate);
router.post('/', createOrder);
router.get('/my-orders', getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/return', requestReturn);

// Payment routes
router.post('/payment/initiate', initiatePayment);
router.post('/payment/verify', verifyPayment);

// Admin routes
router.use(requireAdmin);
router.get('/', getAllOrders);
router.get('/admin/stats', getOrderDashboardStats);
router.get('/admin/:id', getAdminOrderById);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/refund', initiateRefund);

export default router;
