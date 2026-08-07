import api from './api';
import { Order, PaginatedResponse } from '@/types';

export interface CreateOrderData {
  items: Array<{ productId: string; quantity: number; color?: string }>;
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
  paymentMethod: string;
  couponCode?: string;
  loyaltyPointsToRedeem?: number;
  notes?: string;
}

export const orderService = {
  async createOrder(data: CreateOrderData) {
    const response = await api.post('/orders', data);
    return response.data.data as { order: Order };
  },

  async getUserOrders(params?: { page?: number; limit?: number }) {
    const response = await api.get('/orders/my-orders', { params });
    return response.data as PaginatedResponse<Order>;
  },

  async getOrderById(orderId: string) {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.data as { order: Order };
  },

  async cancelOrder(orderId: string, reason: string) {
    const response = await api.put(`/orders/${orderId}/cancel`, { reason });
    return response.data.data as { order: Order };
  },

  async requestReturn(orderId: string, reason: string) {
    const response = await api.put(`/orders/${orderId}/return`, { reason });
    return response.data.data as { order: Order };
  },

  async initiatePayment(orderId: string, amount: number) {
    const response = await api.post('/orders/payment/initiate', { orderId, amount });
    return response.data.data as {
      razorpayOrderId: string;
      amount: number;
      currency: string;
      key: string;
    };
  },

  async verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const response = await api.post('/orders/payment/verify', data);
    return response.data.data as { success: boolean; order: Order };
  },

  // Admin
  async getAllOrders(params?: { page?: number; limit?: number; status?: string }) {
    const response = await api.get('/orders', { params });
    return response.data as PaginatedResponse<Order>;
  },

  async updateOrderStatus(
    orderId: string,
    status: string,
    trackingInfo?: object
  ) {
    const response = await api.put(`/orders/${orderId}/status`, { status, trackingInfo });
    return response.data.data as { order: Order };
  },

  async getDashboardStats() {
    const response = await api.get('/orders/admin/stats');
    return response.data.data.stats as import('@/types').DashboardStats;
  },
};
