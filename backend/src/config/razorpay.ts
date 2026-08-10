import Razorpay from 'razorpay';
import crypto from 'crypto';
import { HTTP_STATUS } from '../constants';
import { CustomError } from '../middlewares/error.middleware';

let razorpayInstance: Razorpay;

const isPlaceholder = (value?: string): boolean =>
  !value || /your_|change[_-]?me|x{6,}/i.test(value);

export const getRazorpayInstance = (): Razorpay => {
  if (!razorpayInstance) {
    if (
      isPlaceholder(process.env.RAZORPAY_KEY_ID) ||
      isPlaceholder(process.env.RAZORPAY_KEY_SECRET)
    ) {
      throw new CustomError(
        'Online payment is not configured. Please use Cash on Delivery.',
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
    }

    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  return razorpayInstance;
};

export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
};

export const createRazorpayOrder = async (
  amount: number,
  currency = 'INR',
  receipt: string,
  notes?: Record<string, string>
) => {
  try {
    const razorpay = getRazorpayInstance();

    return await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency,
      receipt,
      notes,
      payment_capture: true,
    });
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      'Online payment service is currently unavailable. Please use Cash on Delivery or try again later.',
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }
};

export const fetchRazorpayPayment = async (paymentId: string) => {
  const razorpay = getRazorpayInstance();
  return razorpay.payments.fetch(paymentId);
};

export const refundRazorpayPayment = async (paymentId: string, amount?: number) => {
  const razorpay = getRazorpayInstance();
  return razorpay.payments.refund(paymentId, {
    amount: amount ? amount * 100 : undefined,
  });
};
