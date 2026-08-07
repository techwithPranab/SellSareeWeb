import { orderRepository } from '../repositories/order.repository';
import { productRepository } from '../repositories/product.repository';
import { userRepository } from '../repositories/user.repository';
import { emailService } from './email.service';
import { CustomError } from '../middlewares/error.middleware';
import { HTTP_STATUS, OrderStatus, PaymentMethod, PaymentStatus, SHIPPING, LOYALTY } from '../constants';
import { IOrder, IOrderItem } from '../interfaces';
import { PaginationOptions } from '../utils/pagination';
import Coupon from '../models/Coupon';

export interface CreateOrderData {
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
    const { items, shippingAddress, paymentMethod, couponCode, loyaltyPointsToRedeem, notes } = data;

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
      if (product.stock < item.quantity) {
        throw new CustomError(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const price = product.salePrice || product.price;
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

    // Calculate shipping
    const shippingCharge = subtotal >= SHIPPING.FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING.STANDARD_RATE;
    const codCharges = paymentMethod === PaymentMethod.COD ? SHIPPING.COD_CHARGES : 0;

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
    if (loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
      const user = await userRepository.findById(userId);
      if (!user) throw new CustomError('User not found', HTTP_STATUS.NOT_FOUND);

      const maxRedeemable = Math.min(user.loyaltyPoints, loyaltyPointsToRedeem);
      loyaltyDiscount = maxRedeemable * LOYALTY.RUPEES_PER_POINT;

      await userRepository.updateLoyaltyPoints(userId, -maxRedeemable);
    }

    const taxAmount = 0; // GST can be added here
    const totalDiscount = couponDiscount + loyaltyDiscount;
    const totalAmount = Math.max(0, subtotal + shippingCharge + codCharges + taxAmount - totalDiscount);

    // Loyalty points earned (1 point per rupee)
    const loyaltyPointsEarned = Math.floor(totalAmount * LOYALTY.POINTS_PER_RUPEE);

    // Create order
    const order = await orderRepository.create({
      user: userId as unknown as import('mongoose').Types.ObjectId,
      items: orderItems,
      shippingAddress,
      paymentInfo: {
        method: paymentMethod,
        status: paymentMethod === PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.PENDING,
      },
      status: OrderStatus.PENDING,
      subtotal,
      shippingCharge: paymentMethod === PaymentMethod.COD ? shippingCharge : shippingCharge - (couponCode && couponDiscount === shippingCharge ? shippingCharge : 0),
      taxAmount,
      discount: totalDiscount,
      couponCode: couponCodeUsed,
      couponDiscount,
      codCharges,
      totalAmount,
      loyaltyPointsEarned,
      loyaltyPointsRedeemed: loyaltyPointsToRedeem || 0,
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
    const user = await userRepository.findById(order.user.toString());
    if (user) {
      if (status === OrderStatus.SHIPPED && trackingInfo) {
        const ti = trackingInfo as { courier: string; trackingNumber: string; trackingUrl?: string };
        emailService.sendShippingUpdate(
          user.email, user.name, order.orderNumber,
          ti.trackingNumber, ti.courier, ti.trackingUrl
        ).catch(console.error);
      } else if (status === OrderStatus.DELIVERED) {
        emailService.sendDeliveryConfirmation(user.email, user.name, order.orderNumber).catch(console.error);
        // Award loyalty points
        await userRepository.updateLoyaltyPoints(user._id.toString(), order.loyaltyPointsEarned);
      }
    }

    return updated!;
  }

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    const [totalOrders, monthlyStats, todayStats, statusDistribution] = await Promise.all([
      orderRepository.countDocuments(),
      orderRepository.getRevenueStats(startOfMonth, new Date()),
      orderRepository.getRevenueStats(startOfToday, new Date()),
      orderRepository.getStatusDistribution(),
    ]);

    return {
      totalOrders,
      monthlyRevenue: monthlyStats[0]?.totalRevenue || 0,
      monthlyOrders: monthlyStats[0]?.totalOrders || 0,
      todayRevenue: todayStats[0]?.totalRevenue || 0,
      todayOrders: todayStats[0]?.totalOrders || 0,
      averageOrderValue: monthlyStats[0]?.averageOrderValue || 0,
      statusDistribution,
    };
  }
}

export const orderService = new OrderService();
