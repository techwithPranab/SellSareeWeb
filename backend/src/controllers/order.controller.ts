import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { OrderStatus } from '../constants';
import Order from '../models/Order';
import User from '../models/User';

// ========================= PUBLIC =========================

export const trackOrderGuest = asyncHandler(async (req: Request, res: Response) => {
  const { orderNumber, email } = req.query;

  if (!orderNumber || !email) {
    return ApiResponse.badRequest(res, 'Order number and email are required');
  }

  // Find the user by email first
  const user = await User.findOne({ email: String(email) }).select('_id');
  if (!user) {
    return ApiResponse.notFound(res, 'No order found with these details');
  }

  const order = await Order.findOne({ orderNumber: String(orderNumber), user: user._id })
    .select('orderNumber status trackingInfo createdAt updatedAt shippingAddress items totalAmount paymentInfo');

  if (!order) {
    return ApiResponse.notFound(res, 'No order found with these details');
  }

  ApiResponse.success(res, 'Order found', { order });
});

// ========================= CUSTOMER =========================

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.user!.id, req.body);
  ApiResponse.created(res, 'Order placed successfully', { order });
});

export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, sortBy, sortOrder } = req.query;
  const result = await orderService.getUserOrders(req.user!.id, {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sortBy: (sortBy as string) || 'createdAt',
    sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
  });
  ApiResponse.paginated(res, 'Orders retrieved', result.data, result.meta);
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(req.params.id, req.user!.id);
  ApiResponse.success(res, 'Order retrieved', { order });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const order = await orderService.cancelOrder(req.params.id, req.user!.id, reason || 'Cancelled by customer');
  ApiResponse.success(res, 'Order cancelled successfully', { order });
});

export const requestReturn = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const order = await orderService.requestReturn(req.params.id, req.user!.id, reason);
  ApiResponse.success(res, 'Return request submitted', { order });
});

// ========================= PAYMENT =========================

export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, amount } = req.body;
  const paymentData = await paymentService.initiatePayment(orderId, amount, req.user!.id);
  ApiResponse.success(res, 'Payment initiated', { ...paymentData });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const result = await paymentService.verifyPayment(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    req.user!.id
  );
  ApiResponse.success(res, 'Payment verified successfully', result);
});

export const handleRazorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  await paymentService.handleWebhook(JSON.stringify(req.body), signature);
  res.status(200).json({ received: true });
});

// ========================= ADMIN =========================

export const getAdminOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderByIdForAdmin(req.params.id);
  ApiResponse.success(res, 'Order retrieved', { order });
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, sortBy, sortOrder, status } = req.query;

  const filter = {
    ...(status && { status }),
  };

  const result = await orderService.getAllOrders(filter, {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  ApiResponse.paginated(res, 'All orders retrieved', result.data, result.meta);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, trackingInfo } = req.body;

  if (!Object.values(OrderStatus).includes(status)) {
    return ApiResponse.badRequest(res, 'Invalid order status');
  }

  const order = await orderService.updateOrderStatus(req.params.id, status, trackingInfo);
  ApiResponse.success(res, 'Order status updated', { order });
});

export const getOrderDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await orderService.getDashboardStats();
  ApiResponse.success(res, 'Dashboard stats retrieved', { stats });
});

export const initiateRefund = asyncHandler(async (req: Request, res: Response) => {
  const { amount } = req.body;
  await paymentService.initiateRefund(req.params.id, amount);
  ApiResponse.success(res, 'Refund initiated successfully');
});
