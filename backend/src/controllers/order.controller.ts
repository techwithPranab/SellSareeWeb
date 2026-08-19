import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from '../constants';
import Order from '../models/Order';
import User from '../models/User';
import { cloudinary, CLOUDINARY_ROOT_FOLDER } from '../config/cloudinary';

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

  return ApiResponse.success(res, 'Order found', { order });
});

// ========================= CUSTOMER =========================

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  if (![PaymentMethod.RAZORPAY, PaymentMethod.UPI].includes(req.body.paymentMethod)) {
    return ApiResponse.badRequest(res, 'Please select a supported online payment method');
  }
  const order = await orderService.createOrder(req.user!.id, req.body);
  return ApiResponse.created(res, 'Order placed successfully', { order });
});

export const submitManualPaymentProof = asyncHandler(async (req: Request, res: Response) => {
  const transactionId = String(req.body.transactionId || '').trim();
  if (!transactionId || transactionId.length > 150) {
    return ApiResponse.badRequest(res, 'A valid transaction ID or UTR is required');
  }
  if (!req.file) return ApiResponse.badRequest(res, 'Payment screenshot is required');

  const order = await Order.findOne({ _id: req.params.id, user: req.user!.id });
  if (!order) return ApiResponse.notFound(res, 'Order not found');
  if (order.paymentInfo.method !== PaymentMethod.UPI) {
    return ApiResponse.badRequest(res, 'This order does not use QR payment');
  }
  if (order.paymentInfo.status === PaymentStatus.COMPLETED) {
    return ApiResponse.badRequest(res, 'Payment has already been confirmed');
  }

  const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const uploaded = await cloudinary.uploader.upload(dataURI, {
    folder: `${CLOUDINARY_ROOT_FOLDER}/payment-proofs`,
    resource_type: 'image',
    transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
  });

  if (order.paymentInfo.paymentScreenshotPublicId) {
    await cloudinary.uploader.destroy(order.paymentInfo.paymentScreenshotPublicId).catch(() => undefined);
  }

  order.paymentInfo.manualTransactionId = transactionId;
  order.paymentInfo.paymentScreenshot = uploaded.secure_url;
  order.paymentInfo.paymentScreenshotPublicId = uploaded.public_id;
  order.paymentInfo.status = PaymentStatus.PROCESSING;
  await order.save();

  return ApiResponse.success(res, 'Payment proof submitted for verification', { order });
});

export const confirmManualPayment = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) return ApiResponse.notFound(res, 'Order not found');
  if (order.paymentInfo.method !== PaymentMethod.UPI) {
    return ApiResponse.badRequest(res, 'Only manual UPI orders can be marked as paid');
  }
  if (order.paymentInfo.status === PaymentStatus.COMPLETED) {
    return ApiResponse.success(res, 'Payment is already confirmed', { order });
  }

  order.paymentInfo.status = PaymentStatus.COMPLETED;
  order.paymentInfo.paidAt = new Date();
  // Do not move an order backwards if fulfilment has already started.
  if (order.status === OrderStatus.PENDING) order.status = OrderStatus.CONFIRMED;
  await order.save();
  await order.populate('user', 'name email phone');
  return ApiResponse.success(res, 'Manual payment confirmed', { order });
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
  const { orderId } = req.body;
  if (!orderId) return ApiResponse.badRequest(res, 'Order ID is required');
  const paymentData = await paymentService.initiatePayment(orderId, req.user!.id);
  return ApiResponse.success(res, 'Payment initiated', { ...paymentData });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return ApiResponse.badRequest(res, 'Complete Razorpay payment details are required');
  }
  const result = await paymentService.verifyPayment(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    req.user!.id
  );
  return ApiResponse.success(res, 'Payment verified successfully', result);
});

export const handleRazorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  if (!Buffer.isBuffer(req.body)) return ApiResponse.badRequest(res, 'Invalid webhook payload');
  await paymentService.handleWebhook(req.body, signature);
  return res.status(200).json({ received: true });
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
  return ApiResponse.success(res, 'Order status updated', { order });
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

export const createOrderForCustomer = asyncHandler(async (req: Request, res: Response) => {
  const parseJsonField = (value: unknown) => {
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return undefined; }
  };
  const customerId = req.body.customerId;
  const customer = parseJsonField(req.body.customer) as Record<string, unknown> | undefined;
  const items = parseJsonField(req.body.items) as Array<{ productId: string; quantity: number }>;
  const shippingAddress = parseJsonField(req.body.shippingAddress) as Record<string, string>;
  const paymentMethod = req.body.paymentMethod as PaymentMethod;
  const notes = req.body.notes;
  const transactionId = String(req.body.transactionId || '').trim();

  if (!Array.isArray(items) || items.length === 0) {
    return ApiResponse.badRequest(res, 'At least one product is required');
  }

  if (items.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
    return ApiResponse.badRequest(res, 'Each order item must have a product and valid quantity');
  }

  const requiredAddressFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
  if (
    !shippingAddress ||
    requiredAddressFields.some((field) => !String(shippingAddress[field] || '').trim()) ||
    !/^[1-9]\d{5}$/.test(String(shippingAddress.pincode))
  ) {
    return ApiResponse.badRequest(res, 'A complete delivery address with valid pincode is required');
  }

  if (paymentMethod !== PaymentMethod.UPI) {
    return ApiResponse.badRequest(res, 'Admin-created orders must use manually collected UPI payment');
  }
  if (transactionId.length > 150) {
    return ApiResponse.badRequest(res, 'Transaction ID cannot exceed 150 characters');
  }

  let orderCustomer = customerId ? await User.findById(customerId) : null;

  if (!orderCustomer) {
    const name = String(customer?.name || '').trim();
    const email = String(customer?.email || '').trim().toLowerCase();
    const phone = String(customer?.phone || '').replace(/\D/g, '');

    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !/^[6-9]\d{9}$/.test(phone)) {
      return ApiResponse.badRequest(res, 'Valid customer name, email, and Indian phone number are required');
    }

    orderCustomer = await User.findOne({ $or: [{ email }, { phone }] });
    if (!orderCustomer) {
      orderCustomer = await User.create({
        name,
        email,
        phone,
        role: UserRole.CUSTOMER,
        isActive: true,
        addresses: [{ ...shippingAddress, isDefault: true, type: 'home' }],
      });
    }
  }

  if (!orderCustomer.isActive) {
    return ApiResponse.badRequest(res, 'The selected customer account is inactive');
  }

  let uploadedProof: { url: string; publicId: string } | undefined;
  if (req.file) {
    const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `${CLOUDINARY_ROOT_FOLDER}/payment-proofs`,
      resource_type: 'image',
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    });
    uploadedProof = { url: result.secure_url, publicId: result.public_id };
  }

  let order;
  try {
    order = await orderService.createOrder(orderCustomer._id.toString(), {
      items,
      shippingAddress: shippingAddress as unknown as Parameters<typeof orderService.createOrder>[1]['shippingAddress'],
      paymentMethod,
      notes: [notes, `WhatsApp order entered by admin ${req.user!.email}`].filter(Boolean).join(' — '),
    });
  } catch (error) {
    if (uploadedProof) await cloudinary.uploader.destroy(uploadedProof.publicId).catch(() => undefined);
    throw error;
  }

  if (transactionId || uploadedProof) {
    order = await Order.findByIdAndUpdate(order._id, {
      $set: {
        'paymentInfo.status': PaymentStatus.COMPLETED,
        'paymentInfo.paidAt': new Date(),
        ...(transactionId && { 'paymentInfo.manualTransactionId': transactionId }),
        ...(uploadedProof && {
          'paymentInfo.paymentScreenshot': uploadedProof.url,
          'paymentInfo.paymentScreenshotPublicId': uploadedProof.publicId,
        }),
      },
    }, { new: true }) || order;
  }

  return ApiResponse.created(res, 'Customer order created successfully', { order });
});
