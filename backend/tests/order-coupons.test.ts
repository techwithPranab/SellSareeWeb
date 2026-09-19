jest.mock('../src/repositories/order.repository', () => ({ orderRepository: { create: jest.fn(async (data) => data) } }));
jest.mock('../src/repositories/product.repository', () => ({ productRepository: { findById: jest.fn(), reserveStock: jest.fn().mockResolvedValue(true), releaseStock: jest.fn() } }));
jest.mock('../src/repositories/user.repository', () => ({ userRepository: { saveCheckoutAddress: jest.fn().mockResolvedValue({}), findById: jest.fn().mockResolvedValue(null) } }));
jest.mock('../src/services/email.service', () => ({ emailService: {} }));
jest.mock('../src/models/Coupon', () => ({ __esModule: true, default: { findOne: jest.fn(), findOneAndUpdate: jest.fn() } }));
jest.mock('../src/models/StoreSetting', () => ({ __esModule: true, default: { findOne: () => ({ lean: async () => ({ freeShippingThreshold: 999, standardShippingRate: 50 }) }) } }));
import { OrderService, CreateOrderData } from '../src/services/order.service';
import { productRepository } from '../src/repositories/product.repository';
import Coupon from '../src/models/Coupon';
import { PaymentMethod } from '../src/constants';

const data = (couponCodes: string[]): CreateOrderData => ({
  items: [{ productId: 'product', quantity: 1 }], couponCodes,
  shippingAddress: { fullName: 'Test', phone: '1234567890', addressLine1: 'Test', city: 'Test', state: 'Test', pincode: '123456', country: 'India' },
  paymentMethod: 'cod' as PaymentMethod,
});
beforeEach(() => {
  jest.clearAllMocks();
  (productRepository.findById as jest.Mock).mockResolvedValue({ _id: 'product', name: 'Saree', isActive: true, stock: 5, price: 500, images: [] });
  (Coupon.findOne as jest.Mock).mockImplementation(async ({ code }) => code === 'INVALID' ? null : ({
    code, type: code.startsWith('SHIP') ? 'free_shipping' : code === 'PERCENT' ? 'percentage' : 'fixed',
    discountValue: code === 'PERCENT' ? 10 : 300, minOrderAmount: 0, usageLimit: 0, usedBy: [], userUsageLimit: 1,
  }));
});
it('stacks repeated codes, normalizes them and counts usage once per order', async () => {
  const order = await new OrderService().createOrder('user', data([' fixed ', 'PERCENT', 'FIXED']));
  expect(order.couponCodes).toEqual(['FIXED', 'PERCENT', 'FIXED']);
  expect(order.couponDiscount).toBe(500);
  expect(order.totalAmount).toBe(50);
  expect(Coupon.findOneAndUpdate).toHaveBeenCalledTimes(2);
});
it('caps merchandise discounts and applies free shipping only once', async () => {
  const order = await new OrderService().createOrder('user', data(['FIXED', 'FIXED2', 'SHIP', 'SHIP2']));
  expect(order.couponDiscount).toBe(550);
  expect(order.totalAmount).toBe(0);
  expect(order.subtotal + order.shippingCharge - order.discount).toBe(order.totalAmount);
});
it('does not consume earlier coupons when another coupon is invalid', async () => {
  await expect(new OrderService().createOrder('user', data(['FIXED', 'INVALID']))).rejects.toThrow('Invalid or expired');
  expect(Coupon.findOneAndUpdate).not.toHaveBeenCalled();
});

it('adds the discount for every application of the same percentage coupon', async () => {
  const order = await new OrderService().createOrder('user', data(['PERCENT', 'percent']));
  expect(order.couponCodes).toEqual(['PERCENT', 'PERCENT']);
  expect(order.couponDiscount).toBe(100);
  expect(order.totalAmount).toBe(450);
  expect(Coupon.findOneAndUpdate).toHaveBeenCalledTimes(1);
});

it('allows an admin-created order to bypass the customer coupon usage limit', async () => {
  (Coupon.findOne as jest.Mock).mockResolvedValue({
    code: 'FIXED', type: 'fixed', discountValue: 100, minOrderAmount: 0,
    usageLimit: 0, usedBy: [{ toString: () => 'user' }], userUsageLimit: 1,
  });
  const order = await new OrderService().createOrder('user', { ...data(['FIXED', 'FIXED']), bypassCouponUserUsageLimit: true });
  expect(order.couponDiscount).toBe(200);
});
