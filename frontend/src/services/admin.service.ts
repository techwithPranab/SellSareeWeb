import api from './api';
import {
  Product,
  Order,
  User,
  Review,
  Banner,
  PaginatedResponse,
  PaginationMeta,
  DashboardStats,
} from '@/types';

// ─── Coupon type (admin) ─────────────────────────────────────────────────────

export interface AdminCoupon {
  _id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  userUsageLimit: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  lowStockCount: number;
}

export const adminService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  async getOrderStats() {
    const response = await api.get('/orders/admin/stats');
    return response.data.data.stats as DashboardStats;
  },

  async getProductStats() {
    const response = await api.get('/products/admin/stats');
    return response.data.data.stats as ProductStats;
  },

  // ── Products ───────────────────────────────────────────────────────────────
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const response = await api.get('/products', { params: { ...params, limit: params?.limit ?? 20 } });
    return response.data as PaginatedResponse<Product>;
  },

  async getProduct(id: string) {
    const response = await api.get(`/products/id/${id}`);
    return response.data.data as { product: Product };
  },

  async createProduct(formData: FormData) {
    const response = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as { product: Product };
  },

  async updateProduct(id: string, formData: FormData) {
    const response = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as { product: Product };
  },

  async deleteProduct(id: string) {
    await api.delete(`/products/${id}`);
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  async getOrders(params?: { page?: number; limit?: number; status?: string }) {
    const response = await api.get('/orders', { params });
    return response.data as PaginatedResponse<Order>;
  },

  async getOrder(id: string) {
    const response = await api.get(`/orders/admin/${id}`);
    return response.data.data as { order: Order };
  },

  async updateOrderStatus(
    orderId: string,
    status: string,
    trackingInfo?: { courier: string; trackingNumber: string; trackingUrl?: string }
  ) {
    const response = await api.put(`/orders/${orderId}/status`, { status, trackingInfo });
    return response.data.data as { order: Order };
  },

  async initiateRefund(orderId: string, amount?: number) {
    const response = await api.post(`/orders/${orderId}/refund`, { amount });
    return response.data.data as { success: boolean };
  },

  // ── Customers ──────────────────────────────────────────────────────────────
  async getCustomers(params?: { page?: number; limit?: number; search?: string; role?: string }) {
    const response = await api.get('/users/admin/users', { params });
    return response.data as PaginatedResponse<User>;
  },

  async toggleCustomerStatus(userId: string) {
    const response = await api.put(`/users/admin/users/${userId}/toggle-status`);
    return response.data.data as { user: User };
  },

  // ── Coupons ────────────────────────────────────────────────────────────────
  async getCoupons(params?: { page?: number; limit?: number; isActive?: boolean }) {
    const response = await api.get('/users/admin/coupons', { params });
    return response.data as PaginatedResponse<AdminCoupon>;
  },

  async createCoupon(data: Partial<AdminCoupon>) {
    const response = await api.post('/users/admin/coupons', data);
    return response.data.data as { coupon: AdminCoupon };
  },

  async updateCoupon(id: string, data: Partial<AdminCoupon>) {
    const response = await api.put(`/users/admin/coupons/${id}`, data);
    return response.data.data as { coupon: AdminCoupon };
  },

  async deleteCoupon(id: string) {
    await api.delete(`/users/admin/coupons/${id}`);
  },

  // ── Banners ────────────────────────────────────────────────────────────────
  async getBanners(params?: { position?: string; isActive?: boolean }) {
    const response = await api.get('/banners', { params });
    return response.data.data as { banners: Banner[] };
  },

  async createBanner(formData: FormData) {
    const response = await api.post('/banners', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as { banner: Banner };
  },

  async updateBanner(id: string, formData: FormData) {
    const response = await api.put(`/banners/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as { banner: Banner };
  },

  async deleteBanner(id: string) {
    await api.delete(`/banners/${id}`);
  },

  // ── Reviews ────────────────────────────────────────────────────────────────
  async getReviews(params?: { page?: number; limit?: number; isApproved?: boolean }) {
    const response = await api.get('/users/admin/reviews', { params });
    return response.data as PaginatedResponse<Review>;
  },

  async approveReview(reviewId: string) {
    const response = await api.put(`/users/admin/reviews/${reviewId}/approve`);
    return response.data;
  },

  async rejectReview(reviewId: string) {
    await api.delete(`/users/admin/reviews/${reviewId}`);
  },

  async replyToReview(reviewId: string, reply: string) {
    const response = await api.put(`/users/admin/reviews/${reviewId}/reply`, { reply });
    return response.data;
  },

  // ── Categories ─────────────────────────────────────────────────────────────
  async getCategories() {
    const response = await api.get('/categories');
    return response.data.data as { categories: import('@/types').Category[] };
  },

  async createCategory(formData: FormData) {
    const response = await api.post('/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as { category: import('@/types').Category };
  },

  async updateCategory(id: string, formData: FormData) {
    const response = await api.put(`/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as { category: import('@/types').Category };
  },

  async deleteCategory(id: string) {
    await api.delete(`/categories/${id}`);
  },
};

export type { PaginationMeta };
