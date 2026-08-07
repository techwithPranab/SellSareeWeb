import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance: Razorpay;

export const getRazorpayInstance = (): Razorpay => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials are not configured');
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
  const razorpay = getRazorpayInstance();

  return razorpay.orders.create({
    amount: amount * 100, // Amount in paise
    currency,
    receipt,
    notes,
    payment_capture: true,
  });
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
