import Order from '../models/Order';
import { IOrder } from '../interfaces';
import { parsePagination, buildPaginationMeta, PaginationOptions } from '../utils/pagination';
import { FilterQuery, Types } from 'mongoose';
import { OrderStatus, PaymentStatus } from '../constants';

export class OrderRepository {
  async findById(id: string): Promise<IOrder | null> {
    return Order.findById(id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name slug images');
  }

  async findByIdAndUser(id: string, userId: string): Promise<IOrder | null> {
    return Order.findOne({ _id: id, user: userId })
      .populate('items.product', 'name slug images');
  }

  async findByOrderNumber(orderNumber: string): Promise<IOrder | null> {
    return Order.findOne({ orderNumber })
      .populate('user', 'name email phone')
      .populate('items.product', 'name slug images');
  }

  async create(data: Partial<IOrder>): Promise<IOrder> {
    return Order.create(data);
  }

  async updateById(id: string, update: Partial<IOrder>): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  async findUserOrders(userId: string, options: PaginationOptions = {}) {
    const { skip, limit, page, sort } = parsePagination(options);
    const filter: FilterQuery<IOrder> = {
      user: new Types.ObjectId(userId),
      $or: [
        { status: { $ne: OrderStatus.PENDING } },
        // A submitted static-QR proof is still awaiting admin confirmation, but
        // it is a real customer order and should remain visible for tracking.
        { status: OrderStatus.PENDING, 'paymentInfo.status': PaymentStatus.PROCESSING },
      ],
    };

    const [data, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-items.product'),
      Order.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findAll(filter: FilterQuery<IOrder> = {}, options: PaginationOptions = {}) {
    const { skip, limit, page, sort } = parsePagination(options);

    const [data, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentDetails?: object
  ): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(
      orderId,
      {
        'paymentInfo.status': paymentStatus,
        ...paymentDetails,
      },
      { new: true }
    );
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<IOrder | null> {
    const update: Partial<IOrder> = { status };
    if (status === OrderStatus.DELIVERED) {
      (update as Record<string, unknown>).deliveredAt = new Date();
    }
    return Order.findByIdAndUpdate(orderId, update, { new: true });
  }

  async claimLoyaltyPointsAward(orderId: string): Promise<IOrder | null> {
    return Order.findOneAndUpdate(
      { _id: orderId, loyaltyPointsAwarded: { $ne: true } },
      { $set: { loyaltyPointsAwarded: true } },
      { new: true }
    );
  }

  async findByRazorpayOrderId(razorpayOrderId: string): Promise<IOrder | null> {
    return Order.findOne({ 'paymentInfo.razorpayOrderId': razorpayOrderId });
  }

  // Analytics
  async getRevenueStats(startDate: Date, endDate: Date) {
    return Order.aggregate([
      {
        $match: {
          'paymentInfo.status': PaymentStatus.COMPLETED,
          $expr: {
            $and: [
              { $gte: [{ $ifNull: ['$paymentInfo.paidAt', '$createdAt'] }, startDate] },
              { $lte: [{ $ifNull: ['$paymentInfo.paidAt', '$createdAt'] }, endDate] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
        },
      },
    ]);
  }

  async getDailyRevenue(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return Order.aggregate([
      {
        $match: {
          'paymentInfo.status': PaymentStatus.COMPLETED,
          $expr: {
            $gte: [{ $ifNull: ['$paymentInfo.paidAt', '$createdAt'] }, startDate],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $ifNull: ['$paymentInfo.paidAt', '$createdAt'] },
              timezone: 'Asia/Kolkata',
            },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getStatusDistribution() {
    return Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  async countDocuments(filter: FilterQuery<IOrder> = {}): Promise<number> {
    return Order.countDocuments(filter);
  }

  async findAbandonedOrders(hoursAgo = 24): Promise<IOrder[]> {
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    return Order.find({
      status: OrderStatus.PENDING,
      'paymentInfo.status': PaymentStatus.PENDING,
      createdAt: { $lte: cutoff },
    })
      .populate('user', 'name email')
      .limit(100);
  }
}

export const orderRepository = new OrderRepository();
