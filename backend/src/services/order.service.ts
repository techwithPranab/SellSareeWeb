import { orderRepository } from '../repositories/order.repository';
import { productRepository } from '../repositories/product.repository';
import { userRepository } from '../repositories/user.repository';
import { emailService } from './email.service';
import { CustomError } from '../middlewares/error.middleware';
import { HTTP_STATUS, OrderStatus, PaymentMethod, PaymentStatus, SHIPPING, LOYALTY } from '../constants';
import { IOrder, IOrderItem } from '../interfaces';
import { PaginationOptions } from '../utils/pagination';
import Coupon from '../models/Coupon';
import { getReferenceId } from '../utils/getReferenceId';
import { logger } from '../middlewares/logger.middleware';
import StoreSetting from '../models/StoreSetting';
import Order from '../models/Order';
import User from '../models/User';

export interface CreateOrderData {
  orderNumber?: string;
  items: Array<{
    productId: string;
    quantity: number;
    color?: string;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  paymentMethod: PaymentMethod;
  couponCode?: string;
  loyaltyPointsToRedeem?: number;
  notes?: string;
}

export class OrderService {
  async createOrder(userId: string, data: CreateOrderData): Promise<IOrder> {
    const { orderNumber, items, shippingAddress, paymentMethod, couponCode, loyaltyPointsToRedeem, notes } = data;

    // Validate and fetch all products
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await productRepository.findById(item.productId);
      if (!product) {
        throw new CustomError(`Product ${item.productId} not found`, HTTP_STATUS.NOT_FOUND);
      }
      if (!product.isActive) {
        throw new CustomError(`Product "${product.name}" is no longer available`, HTTP_STATUS.BAD_REQUEST);
      }
      if (product.launchDate && new Date(product.launchDate).getTime() > Date.now()) {
        throw new CustomError(`Product "${product.name}" is coming soon and cannot be ordered yet`, HTTP_STATUS.BAD_REQUEST);
      }
      if (product.stock < item.quantity) {
        throw new CustomError(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const price = product.isSale && product.salePrice !== undefined
        ? product.salePrice
        : product.discountedPrice ?? product.price;
      const subtotalItem = price * item.quantity;
      subtotal += subtotalItem;

      const defaultImage = product.images.find((img) => img.isDefault) || product.images[0];

      orderItems.push({
        product: product._id,
        name: product.name,
        image: defaultImage?.url || '',
        price,
        quantity: item.quantity,
        color: item.color,
        sku: product.sku,
        discount: product.price - price,
        subtotal: subtotalItem,
      } as IOrderItem);
    }

    // Settings are database-backed so admin changes apply to newly created orders.
    const storeSettings = await StoreSetting.findOne({ key: 'store' }).lean();
    const freeShippingThreshold = storeSettings?.freeShippingThreshold ?? SHIPPING.FREE_SHIPPING_THRESHOLD;
    const standardShippingRate = storeSettings?.standardShippingRate ?? SHIPPING.STANDARD_RATE;
    const loyaltyPointsRate = storeSettings?.loyaltyPointsRate ?? LOYALTY.POINTS_PER_RUPEE;

    // Calculate shipping
    const shippingCharge = subtotal >= freeShippingThreshold ? 0 : standardShippingRate;

    // Apply coupon
    let couponDiscount = 0;
    let couponCodeUsed: string | undefined;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });

      if (!coupon) {
        throw new CustomError('Invalid or expired coupon code', HTTP_STATUS.BAD_REQUEST);
      }

      if (subtotal < coupon.minOrderAmount) {
        throw new CustomError(
          `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        throw new CustomError('Coupon usage limit has been reached', HTTP_STATUS.BAD_REQUEST);
      }

      const userUsageCount = coupon.usedBy.filter((id) => id.toString() === userId).length;
      if (userUsageCount >= coupon.userUsageLimit) {
        throw new CustomError('You have already used this coupon', HTTP_STATUS.BAD_REQUEST);
      }

      // Calculate discount
      const { CouponType } = await import('../constants');
      if (coupon.type === CouponType.PERCENTAGE) {
        couponDiscount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
          couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
        }
      } else if (coupon.type === CouponType.FIXED) {
        couponDiscount = Math.min(coupon.discountValue, subtotal);
      } else if (coupon.type === CouponType.FREE_SHIPPING) {
        couponDiscount = shippingCharge;
      }

      couponCodeUsed = coupon.code;

      // Update coupon usage
      await Coupon.findByIdAndUpdate(coupon._id, {
        $inc: { usedCount: 1 },
        $push: { usedBy: userId },
      });
    }

    // Apply loyalty points
    let loyaltyDiscount = 0;
    let loyaltyPointsRedeemed = 0;
    if (loyaltyPointsToRedeem !== undefined) {
      if (!Number.isSafeInteger(loyaltyPointsToRedeem) || loyaltyPointsToRedeem < 0) {
        throw new CustomError('Loyalty points must be a valid whole number', HTTP_STATUS.BAD_REQUEST);
      }
    }
    if (loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
      const user = await userRepository.findById(userId);
      if (!user) throw new CustomError('User not found', HTTP_STATUS.NOT_FOUND);

      const totalBeforeLoyalty = subtotal + shippingCharge - couponDiscount;
      const maxForOrder = Math.max(
        0,
        Math.floor((Math.max(0, totalBeforeLoyalty - 1) / LOYALTY.RUPEES_PER_POINT) + 1e-9)
      );
      const maxRedeemable = Math.min(user.loyaltyPoints, maxForOrder);
      if (loyaltyPointsToRedeem > maxRedeemable) {
        throw new CustomError(
          `You can redeem up to ${maxRedeemable} loyalty points on this order`,
          HTTP_STATUS.BAD_REQUEST
        );
      }
      loyaltyPointsRedeemed = loyaltyPointsToRedeem;
      loyaltyDiscount = loyaltyPointsRedeemed * LOYALTY.RUPEES_PER_POINT;

      await userRepository.updateLoyaltyPoints(userId, -loyaltyPointsRedeemed);
    }

    const taxAmount = 0; // GST can be added here
    const totalDiscount = couponDiscount + loyaltyDiscount;
    const totalAmount = Math.max(0, subtotal + shippingCharge + taxAmount - totalDiscount);

    // Loyalty points earned (1 point per rupee)
    const loyaltyPointsEarned = Math.floor(totalAmount * loyaltyPointsRate);

    // Create order
    const order = await orderRepository.create({
      ...(orderNumber && { orderNumber }),
      user: userId as unknown as import('mongoose').Types.ObjectId,
      items: orderItems,
      shippingAddress,
      paymentInfo: {
        method: paymentMethod,
        status: PaymentStatus.PENDING,
      },
      status: OrderStatus.PENDING,
      subtotal,
      shippingCharge: shippingCharge - (couponCode && couponDiscount === shippingCharge ? shippingCharge : 0),
      taxAmount,
      discount: totalDiscount,
      couponCode: couponCodeUsed,
      couponDiscount,
      totalAmount,
      loyaltyPointsEarned,
      loyaltyPointsRedeemed,
      notes,
    });

    // Deduct stock (reserve inventory)
    await Promise.all(
      items.map((item) =>
        productRepository.updateStock(item.productId, item.quantity)
      )
    );

    // Send order confirmation email
    const user = await userRepository.findById(userId);
    if (user) {
      emailService
        .sendOrderConfirmation(
          user.email,
          user.name,
          order.orderNumber,
          orderItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
          order.totalAmount
        )
        .catch(console.error);
    }

    return order;
  }

  async getUserOrders(userId: string, options: PaginationOptions = {}) {
    return orderRepository.findUserOrders(userId, options);
  }

  async getOrderById(orderId: string, userId: string): Promise<IOrder> {
    const order = await orderRepository.findByIdAndUser(orderId, userId);
    if (!order) {
      throw new CustomError('Order not found', HTTP_STATUS.NOT_FOUND);
    }
    return order;
  }

  async getOrderByIdForAdmin(orderId: string): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new CustomError('Order not found', HTTP_STATUS.NOT_FOUND);
    }
    return order;
  }

  async cancelOrder(orderId: string, userId: string, reason: string): Promise<IOrder> {
    const order = await orderRepository.findByIdAndUser(orderId, userId);
    if (!order) {
      throw new CustomError('Order not found', HTTP_STATUS.NOT_FOUND);
    }

    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING];
    if (!cancellableStatuses.includes(order.status)) {
      throw new CustomError(
        `Order cannot be cancelled. Current status: ${order.status}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Restore stock
    for (const item of order.items) {
      await productRepository.updateStock(item.product.toString(), -item.quantity);
    }

    // Restore loyalty points if redeemed
    if (order.loyaltyPointsRedeemed > 0) {
      await userRepository.updateLoyaltyPoints(userId, order.loyaltyPointsRedeemed);
    }

    const updated = await orderRepository.updateById(orderId, {
      status: OrderStatus.CANCELLED,
      cancelReason: reason,
    } as Partial<IOrder>);

    return updated!;
  }

  async requestReturn(orderId: string, userId: string, reason: string): Promise<IOrder> {
    const order = await orderRepository.findByIdAndUser(orderId, userId);
    if (!order) {
      throw new CustomError('Order not found', HTTP_STATUS.NOT_FOUND);
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new CustomError('Only delivered orders can be returned', HTTP_STATUS.BAD_REQUEST);
    }

    if (!order.isReturnable) {
      throw new CustomError('This order is not eligible for return', HTTP_STATUS.BAD_REQUEST);
    }

    const returnWindowEnd = new Date(
      order.deliveredAt!.getTime() + order.returnWindowDays * 24 * 60 * 60 * 1000
    );
    if (new Date() > returnWindowEnd) {
      throw new CustomError('Return window has closed for this order', HTTP_STATUS.BAD_REQUEST);
    }

    const updated = await orderRepository.updateById(orderId, {
      status: OrderStatus.RETURN_REQUESTED,
      returnReason: reason,
      returnRequestedAt: new Date(),
    } as Partial<IOrder>);

    return updated!;
  }

  // Admin methods
  async getAllOrders(filter = {}, options: PaginationOptions = {}) {
    return orderRepository.findAll(filter, options);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, trackingInfo?: object): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new CustomError('Order not found', HTTP_STATUS.NOT_FOUND);
    }

    const updates: Partial<IOrder> = { status };
    if (trackingInfo) {
      (updates as Record<string, unknown>).trackingInfo = trackingInfo;
    }

    const updated = await orderRepository.updateById(orderId, updates);

    // Send email notifications
    const user = await userRepository.findById(getReferenceId(order.user));
    if (user) {
      if (status === OrderStatus.SHIPPED) {
        const ti = trackingInfo as { courier?: string; trackingNumber?: string; trackingUrl?: string } | undefined;
        await emailService.sendShippingUpdate(
          user.email, user.name, order.orderNumber,
          ti?.trackingNumber, ti?.courier, ti?.trackingUrl
        ).catch((error) => {
          logger.error(`Shipping email failed for order ${order.orderNumber}`, error);
        });
      } else if (status === OrderStatus.DELIVERED) {
        await emailService.sendDeliveryConfirmation(user.email, user.name, order.orderNumber).catch((error) => {
          logger.error(`Delivery email failed for order ${order.orderNumber}`, error);
        });
        // Award loyalty points
        await userRepository.updateLoyaltyPoints(user._id.toString(), order.loyaltyPointsEarned);
      }
    }

    return updated!;
  }

  async getDashboardStats() {
    const now = new Date();
    const indiaDateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now).reduce<Record<string, string>>((parts, part) => {
      if (part.type !== 'literal') parts[part.type] = part.value;
      return parts;
    }, {});
    const startOfToday = new Date(`${indiaDateParts.year}-${indiaDateParts.month}-${indiaDateParts.day}T00:00:00+05:30`);
    const startOfMonth = new Date(`${indiaDateParts.year}-${indiaDateParts.month}-01T00:00:00+05:30`);

    const last30Days = new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      monthlyStats,
      todayStats,
      statusDistribution,
      monthlyOrders,
      todayOrders,
      dailyRevenue,
      totalCustomers,
      topProducts,
      paymentDistribution,
    ] = await Promise.all([
      orderRepository.countDocuments(),
      orderRepository.getRevenueStats(startOfMonth, new Date()),
      orderRepository.getRevenueStats(startOfToday, new Date()),
      orderRepository.getStatusDistribution(),
      orderRepository.countDocuments({ createdAt: { $gte: startOfMonth }, status: { $ne: OrderStatus.CANCELLED } }),
      orderRepository.countDocuments({ createdAt: { $gte: startOfToday }, status: { $ne: OrderStatus.CANCELLED } }),
      orderRepository.getDailyRevenue(30),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: {
          'paymentInfo.status': PaymentStatus.COMPLETED,
          $expr: { $gte: [{ $ifNull: ['$paymentInfo.paidAt', '$createdAt'] }, last30Days] },
        } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.name' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: {
          'paymentInfo.status': PaymentStatus.COMPLETED,
          'paymentInfo.method': { $in: Object.values(PaymentMethod) },
        } },
        { $group: { _id: '$paymentInfo.method', count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totalOrders,
      monthlyRevenue: monthlyStats[0]?.totalRevenue || 0,
      monthlyOrders,
      todayRevenue: todayStats[0]?.totalRevenue || 0,
      todayOrders,
      averageOrderValue: monthlyStats[0]?.averageOrderValue || 0,
      statusDistribution,
      dailyRevenue,
      totalCustomers,
      topProducts,
      paymentDistribution,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const orderService = new OrderService();
