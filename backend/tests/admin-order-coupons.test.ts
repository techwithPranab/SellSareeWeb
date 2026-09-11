jest.mock('../src/services/order.service', () => ({ orderService: { createOrder: jest.fn() } }));
jest.mock('../src/services/payment.service', () => ({ paymentService: {} }));
jest.mock('../src/config/cloudinary', () => ({ cloudinary: {}, getCloudinaryPaymentFolder: jest.fn() }));
jest.mock('../src/models/User', () => ({ __esModule: true, default: { findById: jest.fn() } }));
import type { Request, Response } from 'express';
import { createOrderForCustomer } from '../src/controllers/order.controller';
import { orderService } from '../src/services/order.service';
import User from '../src/models/User';

const submit = (body: Record<string, unknown>): Promise<number> => new Promise((resolve, reject) => {
  let statusCode = 200;
  const res = {
    status(code: number) { statusCode = code; return this; },
    json() { resolve(statusCode); return this; },
  } as unknown as Response;
  const req = { body, user: { id: 'admin', email: 'admin@example.com' } } as Request;
  createOrderForCustomer(req, res, reject);
});
const body = {
  customerId: 'customer',
  items: JSON.stringify([{ productId: 'product', quantity: 1 }]),
  shippingAddress: JSON.stringify({ fullName: 'Customer', phone: '9876543210', addressLine1: 'Test', city: 'Test', state: 'Test', pincode: '123456', country: 'India' }),
  paymentMethod: 'upi',
};
beforeEach(() => {
  jest.clearAllMocks();
  (User.findById as jest.Mock).mockResolvedValue({ _id: 'customer', isActive: true });
  (orderService.createOrder as jest.Mock).mockResolvedValue({ _id: 'order' });
});
it('decodes form coupon codes and creates the order for the customer, not the admin', async () => {
  expect(await submit({ ...body, couponCodes: JSON.stringify(['SAVE100', 'SHIP']) })).toBe(201);
  expect(orderService.createOrder).toHaveBeenCalledWith('customer', expect.objectContaining({ couponCodes: ['SAVE100', 'SHIP'] }));
});
it.each(['invalid-json', '{}', '[123]', '[""]'])('rejects malformed coupon input %s before creating the order', async (couponCodes) => {
  expect(await submit({ ...body, couponCodes })).toBe(400);
  expect(orderService.createOrder).not.toHaveBeenCalled();
  expect(User.findById).not.toHaveBeenCalled();
});
it('still accepts an order without coupons', async () => {
  expect(await submit(body)).toBe(201);
  expect(orderService.createOrder).toHaveBeenCalledWith('customer', expect.objectContaining({ couponCodes: [] }));
});
