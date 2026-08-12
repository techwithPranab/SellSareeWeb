import { createRazorpayOrder, verifyRazorpaySignature, fetchRazorpayPayment, refundRazorpayPayment } from '../config/razorpay';
import { orderRepository } from '../repositories/order.repository';
import { CustomError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PaymentStatus, OrderStatus } from '../constants';
import { getReferenceId } from '../utils/getReferenceId';

export class PaymentService {
  async initiatePayment(orderId: string, userId: string) {
    const order = await orderRepository.findByIdAndUser(orderId, userId);
    if (!order) {
      throw new CustomError('Order not found', HTTP_STATUS.NOT_FOUND);
    }

    if (order.paymentInfo.status === PaymentStatus.COMPLETED) {
      throw new CustomError('This order has already been paid', HTTP_STATUS.CONFLICT);
    }

    const amountInPaise = Math.round(order.totalAmount * 100);
    if (order.paymentInfo.status === PaymentStatus.PROCESSING && order.paymentInfo.razorpayOrderId) {
      return {
        razorpayOrderId: order.paymentInfo.razorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID,
      };
    }

    const receipt = `receipt_${order.orderNumber}`;
    const razorpayOrder = await createRazorpayOrder(order.totalAmount, 'INR', receipt, {
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
    const order = await orderRepository.findByRazorpayOrderId(razorpayOrderId);
    if (!order) {
      throw new CustomError('Order not found', HTTP_STATUS.NOT_FOUND);
    }

    if (getReferenceId(order.user) !== userId) {
      throw new CustomError('Unauthorized', HTTP_STATUS.FORBIDDEN);
    }

    const storedRazorpayOrderId = order.paymentInfo.razorpayOrderId;
    if (!storedRazorpayOrderId || storedRazorpayOrderId !== razorpayOrderId) {
      throw new CustomError('Payment order does not match', HTTP_STATUS.BAD_REQUEST);
    }

    const isValid = verifyRazorpaySignature(storedRazorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      throw new CustomError('Payment verification failed. Invalid signature.', HTTP_STATUS.BAD_REQUEST);
    }

    // Fetch payment details from Razorpay
    const payment = await fetchRazorpayPayment(razorpayPaymentId);
    const paymentAmount = Number(payment.amount);
    const expectedAmount = Math.round(order.totalAmount * 100);
    if (
      payment.order_id !== storedRazorpayOrderId ||
      paymentAmount !== expectedAmount ||
      payment.currency !== 'INR' ||
      payment.status !== 'captured'
    ) {
      throw new CustomError('Payment has not been captured for the correct order amount', HTTP_STATUS.BAD_REQUEST);
    }

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

  async handleWebhook(body: Buffer, signature: string): Promise<void> {
    const crypto = await import('crypto');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new CustomError('Razorpay webhook is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signature || '', 'utf8');
    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      throw new CustomError('Invalid webhook signature', HTTP_STATUS.BAD_REQUEST);
    }

    const event = JSON.parse(body.toString('utf8'));

    switch (event.event) {
      case 'payment.captured':
      case 'order.paid': {
        const paymentEntity = event.payload.payment?.entity;
        const order_id = paymentEntity?.order_id || event.payload.order?.entity?.id;
        const paymentId = paymentEntity?.id;
        if (!order_id || !paymentId) break;
        const order = await orderRepository.findByRazorpayOrderId(order_id);
        if (order) {
          await orderRepository.updateById(order._id.toString(), {
            'paymentInfo.razorpayPaymentId': paymentId,
            'paymentInfo.status': PaymentStatus.COMPLETED,
            'paymentInfo.paidAt': new Date(),
            status: OrderStatus.CONFIRMED,
          } as Partial<typeof order>);
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
