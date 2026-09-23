import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from '../constants';
import Order from '../models/Order';
import User from '../models/User';
import { cloudinary, getCloudinaryPaymentFolder } from '../config/cloudinary';
import { generateOrderNumber } from '../utils/generateToken';
import GiftItem from '../models/GiftItem';
import { Types } from 'mongoose';

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
  if (req.body.paymentMethod !== PaymentMethod.UPI) {
    return ApiResponse.badRequest(res, 'Only QR code payment is currently available');
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
    folder: getCloudinaryPaymentFolder(order.orderNumber),
    resource_type: 'image',
    transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    context: { orderNumber: order.orderNumber, transactionReference: transactionId },
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

  const now = new Date();
  const payments = order.paymentInfo.manualPayments || [];
  const paid = payments.filter((payment) => !payment.voidedAt).reduce((sum, payment) => sum + payment.amount, 0);
  if (paid < order.totalAmount) payments.push({ amount: order.totalAmount - paid, paidAt: now, reference: order.paymentInfo.manualTransactionId, note: 'Marked fully paid by admin', createdBy: new Types.ObjectId(req.user!.id) });
  order.paymentInfo.manualPayments = payments;
  order.paymentInfo.status = PaymentStatus.COMPLETED;
  order.paymentInfo.paidAt = now;
  // Do not move an order backwards if fulfilment has already started.
  if (order.status === OrderStatus.PENDING) order.status = OrderStatus.CONFIRMED;
  await order.save();
  await order.populate('user', 'name email phone');
  return ApiResponse.success(res, 'Manual payment confirmed', { order });
});

export const recordManualPayment = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) return ApiResponse.notFound(res, 'Order not found');
  if (order.paymentInfo.method !== PaymentMethod.UPI) return ApiResponse.badRequest(res, 'Manual payment logs are only available for UPI orders');
  const amount = Number(req.body.amount);
  const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();
  if (!Number.isFinite(amount) || amount <= 0) return ApiResponse.badRequest(res, 'Payment amount must be greater than zero');
  if (Number.isNaN(paidAt.getTime())) return ApiResponse.badRequest(res, 'Payment date is invalid');
  const payments = order.paymentInfo.manualPayments || [];
  const alreadyPaid = payments.filter((payment) => !payment.voidedAt).reduce((sum, payment) => sum + payment.amount, 0);
  if (alreadyPaid + amount > order.totalAmount) return ApiResponse.badRequest(res, `Payment exceeds the remaining balance of ₹${Math.max(0, order.totalAmount - alreadyPaid)}`);
  payments.push({ amount, paidAt, reference: String(req.body.reference || '').trim(), note: String(req.body.note || '').trim(), createdBy: new Types.ObjectId(req.user!.id) });
  order.paymentInfo.manualPayments = payments;
  const totalPaid = alreadyPaid + amount;
  order.paymentInfo.status = totalPaid >= order.totalAmount ? PaymentStatus.COMPLETED : PaymentStatus.PARTIALLY_PAID;
  order.paymentInfo.paidAt = totalPaid >= order.totalAmount ? paidAt : undefined;
  if (totalPaid >= order.totalAmount && order.status === OrderStatus.PENDING) order.status = OrderStatus.CONFIRMED;
  await order.save();
  await order.populate('user', 'name email phone');
  return ApiResponse.success(res, 'Manual payment recorded', { order });
});

export const markOrderUnpaid = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) return ApiResponse.notFound(res, 'Order not found');
  if (order.paymentInfo.method !== PaymentMethod.UPI) return ApiResponse.badRequest(res, 'Razorpay payments cannot be manually marked unpaid');
  const now = new Date();
  (order.paymentInfo.manualPayments || []).forEach((payment) => { if (!payment.voidedAt) { payment.voidedAt = now; payment.voidedBy = new Types.ObjectId(req.user!.id); } });
  order.paymentInfo.status = PaymentStatus.PENDING;
  order.paymentInfo.paidAt = undefined;
  await order.save();
  await order.populate('user', 'name email phone');
  return ApiResponse.success(res, 'Order marked as unpaid; payment history retained', { order });
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
  const { page, limit, sortBy, sortOrder, status, search, customerId, paymentStatus, paymentMethod, from, to } = req.query;

  const fromDate = from ? new Date(`${String(from)}T00:00:00+05:30`) : undefined;
  const toDate = to ? new Date(`${String(to)}T23:59:59.999+05:30`) : undefined;
  if ((fromDate && Number.isNaN(fromDate.getTime())) || (toDate && Number.isNaN(toDate.getTime()))) {
    return ApiResponse.badRequest(res, 'Invalid order date range');
  }

  let searchFilter: Record<string, unknown> = {};
  if (search && String(search).trim()) {
    const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    searchFilter = { orderNumber: pattern };
  }

  const filter = {
    ...(status && { status }),
    ...(customerId && Types.ObjectId.isValid(String(customerId)) && { user: new Types.ObjectId(String(customerId)) }),
    ...(paymentStatus && { 'paymentInfo.status': paymentStatus }),
    ...(paymentMethod && { 'paymentInfo.method': paymentMethod }),
    ...((fromDate || toDate) && { createdAt: { ...(fromDate && { $gte: fromDate }), ...(toDate && { $lte: toDate }) } }),
    ...searchFilter,
  };

  const result = await orderService.getAllOrders(filter, {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  return ApiResponse.paginated(res, 'All orders retrieved', result.data, result.meta);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, trackingInfo } = req.body;

  if (!Object.values(OrderStatus).includes(status)) {
    return ApiResponse.badRequest(res, 'Invalid order status');
  }

  const order = await orderService.updateOrderStatus(req.params.id, status, trackingInfo);
  return ApiResponse.success(res, 'Order status updated', { order });
});

export const updateOrderGiftItems = asyncHandler(async (req: Request, res: Response) => {
  const requested = req.body.giftItems;
  if (!Array.isArray(requested)) return ApiResponse.badRequest(res, 'Gift items must be an array');
  if (requested.some((item) => !Types.ObjectId.isValid(String(item.giftItemId)) || !Number.isSafeInteger(item.quantity) || item.quantity < 1)) {
    return ApiResponse.badRequest(res, 'Each gift item must have a valid ID and positive whole-number quantity');
  }
  const ids = requested.map((item) => String(item.giftItemId));
  if (new Set(ids).size !== ids.length) return ApiResponse.badRequest(res, 'Each gift item can only appear once');

  const order = await Order.findById(req.params.id).select('+giftItems.unitCost');
  if (!order) return ApiResponse.notFound(res, 'Order not found');
  if (![OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING].includes(order.status)) {
    return ApiResponse.badRequest(res, 'Gifts can only be changed before an order is shipped');
  }

  const gifts = await GiftItem.find({ _id: { $in: ids }, isActive: true });
  if (gifts.length !== ids.length) return ApiResponse.badRequest(res, 'One or more gift items are unavailable');
  const giftMap = new Map(gifts.map((gift) => [gift._id.toString(), gift]));
  const oldQuantities = new Map((order.giftItems || []).map((item) => [item.giftItem.toString(), item.quantity]));
  const newQuantities = new Map(requested.map((item) => [String(item.giftItemId), item.quantity as number]));
  const allIds = new Set([...oldQuantities.keys(), ...newQuantities.keys()]);
  const applied: Array<{ id: string; delta: number }> = [];

  try {
    for (const id of allIds) {
      const delta = (newQuantities.get(id) || 0) - (oldQuantities.get(id) || 0);
      if (delta > 0) {
        const reserved = await GiftItem.findOneAndUpdate({ _id: id, stock: { $gte: delta }, isActive: true }, { $inc: { stock: -delta } });
        if (!reserved) throw new Error(`Insufficient stock for ${giftMap.get(id)?.name || 'gift item'}`);
      } else if (delta < 0) {
        await GiftItem.findByIdAndUpdate(id, { $inc: { stock: -delta } });
      }
      if (delta) applied.push({ id, delta });
    }

    order.giftItems = requested.map((item) => {
      const gift = giftMap.get(String(item.giftItemId))!;
      return { giftItem: gift._id, name: gift.name, sku: gift.sku, quantity: item.quantity, unitCost: gift.unitCost };
    }) as typeof order.giftItems;
    await order.save();
  } catch (error) {
    await Promise.all(applied.map(({ id, delta }) => GiftItem.findByIdAndUpdate(id, { $inc: { stock: delta } })));
    return ApiResponse.badRequest(res, error instanceof Error ? error.message : 'Could not update gift items');
  }

  return ApiResponse.success(res, 'Order gift items updated', { order });
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
  const couponCodes = req.body.couponCodes === undefined ? [] : parseJsonField(req.body.couponCodes);
  if (!Array.isArray(couponCodes) || couponCodes.some((code) => typeof code !== 'string' || !code.trim())) {
    return ApiResponse.badRequest(res, 'Coupon codes must be a list of non-empty strings');
  }
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

  const orderNumber = generateOrderNumber();
  let uploadedProof: { url: string; publicId: string } | undefined;
  if (req.file) {
    const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: getCloudinaryPaymentFolder(orderNumber),
      resource_type: 'image',
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
      context: { orderNumber, ...(transactionId && { transactionReference: transactionId }) },
    });
    uploadedProof = { url: result.secure_url, publicId: result.public_id };
  }

  let order;
  try {
    order = await orderService.createOrder(orderCustomer._id.toString(), {
      orderNumber,
      items,
      shippingAddress: shippingAddress as unknown as Parameters<typeof orderService.createOrder>[1]['shippingAddress'],
      paymentMethod,
      couponCodes,
      bypassCouponUserUsageLimit: true,
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
