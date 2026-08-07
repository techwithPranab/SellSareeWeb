import { createRazorpayOrder, verifyRazorpaySignature, fetchRazorpayPayment, refundRazorpayPayment } from '../config/razorpay';
import { orderRepository } from '../repositories/order.repository';
import { CustomError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PaymentStatus, OrderStatus } from '../constants';

export class PaymentService {
  async initiatePayment(orderId: string, amount: number, userId: string) {
    const order = await orderRepository.findByIdAndUser(orderId, userId);
    if (!order) {
      throw new CustomError('Order not found', HTTP_STATUS.NOT_FOUND);
    }

    const receipt = `receipt_${order.orderNumber}`;
    const razorpayOrder = await createRazorpayOrder(amount, 'INR', receipt, {
      orderId: orderId,
      userId: userId,
    });

    // Update order with Razorpay order ID
    await orderRepository.updatePaymentStatus(orderId, PaymentStatus.PROCESSING, {
      'paymentInfo.razorpayOrderId': razorpayOrder.id,
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    };
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    userId: string
  ) {
    // Verify Razorpay signature
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      throw new CustomError('Payment verification failed. Invalid signature.', HTTP_STATUS.BAD_REQUEST);
    }

    // Find order
    const order = await orderRepository.findByRazorpayOrderId(razorpayOrderId);
    if (!order) {
      throw new CustomError('Order not found', HTTP_STATUS.NOT_FOUND);
    }

    if (order.user.toString() !== userId) {
      throw new CustomError('Unauthorized', HTTP_STATUS.FORBIDDEN);
    }

    // Fetch payment details from Razorpay
    const payment = await fetchRazorpayPayment(razorpayPaymentId);

    // Update order payment status
    await orderRepository.updateById(order._id.toString(), {
      'paymentInfo.razorpayPaymentId': razorpayPaymentId,
      'paymentInfo.razorpaySignature': razorpaySignature,
      'paymentInfo.status': PaymentStatus.COMPLETED,
      'paymentInfo.paidAt': new Date(),
      status: OrderStatus.CONFIRMED,
    } as Partial<typeof order>);

    return { success: true, payment, order };
  }

  async initiateRefund(orderId: string, amount?: number): Promise<void> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new CustomError('Order not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!order.paymentInfo.razorpayPaymentId) {
      throw new CustomError('No payment found for this order', HTTP_STATUS.BAD_REQUEST);
    }

    await refundRazorpayPayment(order.paymentInfo.razorpayPaymentId, amount);

    await orderRepository.updatePaymentStatus(orderId, PaymentStatus.REFUNDED);
    await orderRepository.updateById(orderId, {
      status: OrderStatus.REFUNDED,
    } as Partial<typeof order>);
  }

  async handleWebhook(body: string, signature: string): Promise<void> {
    // Verify webhook signature
    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new CustomError('Invalid webhook signature', HTTP_STATUS.BAD_REQUEST);
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'payment.captured': {
        const { order_id, id: paymentId } = event.payload.payment.entity;
        const order = await orderRepository.findByRazorpayOrderId(order_id);
        if (order) {
          await orderRepository.updatePaymentStatus(order._id.toString(), PaymentStatus.COMPLETED, {
            'paymentInfo.razorpayPaymentId': paymentId,
            'paymentInfo.paidAt': new Date(),
          });
        }
        break;
      }
      case 'payment.failed': {
        const { order_id, error_description } = event.payload.payment.entity;
        const order = await orderRepository.findByRazorpayOrderId(order_id);
        if (order) {
          await orderRepository.updatePaymentStatus(order._id.toString(), PaymentStatus.FAILED, {
            'paymentInfo.failureReason': error_description,
          });
        }
        break;
      }
    }
  }
}

export const paymentService = new PaymentService();
