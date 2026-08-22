import api from './api';
import { User, Address, Review } from '@/types';

export const userService = {
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data.data as { user: User };
  },

  async updateProfile(data: { name?: string; phone?: string; preferredLanguage?: string; preferredCurrency?: string }) {
    const response = await api.put('/users/profile', data);
    return response.data.data as { user: User };
  },

  async getAddresses() {
    const response = await api.get('/users/addresses');
    return response.data.data as { addresses: Address[] };
  },

  async addAddress(data: Omit<Address, '_id'>) {
    const response = await api.post('/users/addresses', data);
    return response.data.data as { addresses: Address[] };
  },

  async updateAddress(addressId: string, data: Partial<Address>) {
    const response = await api.put(`/users/addresses/${addressId}`, data);
    return response.data.data as { addresses: Address[] };
  },

  async deleteAddress(addressId: string) {
    const response = await api.delete(`/users/addresses/${addressId}`);
    return response.data.data as { addresses: Address[] };
  },

  async setDefaultAddress(addressId: string) {
    const response = await api.put(`/users/addresses/${addressId}/default`);
    return response.data.data as { addresses: Address[] };
  },

  async getWishlist() {
    const response = await api.get('/users/wishlist');
    return response.data.data;
  },

  async addToWishlist(productId: string) {
    await api.post(`/users/wishlist/${productId}`);
  },

  async removeFromWishlist(productId: string) {
    await api.delete(`/users/wishlist/${productId}`);
  },

  async getLoyaltyPoints() {
    const response = await api.get('/users/loyalty-points');
    return response.data.data as { points: number; worth: number };
  },

  async createReview(data: {
    productId: string;
    rating: number;
    title: string;
    comment: string;
    orderId?: string;
  }) {
    const response = await api.post('/users/reviews', data);
    return response.data.data as { review: Review };
  },

  async getMyReviews(params?: { page?: number; limit?: number }) {
    const response = await api.get('/users/reviews/my', { params });
    return response.data;
  },

  async getProductReviews(productId: string, params?: { page?: number; limit?: number }) {
    const response = await api.get(`/users/reviews/product/${productId}`, { params });
    return response.data;
  },

  async getHomepageReviews() {
    const response = await api.get('/users/reviews/homepage');
    return response.data.data as { reviews: Review[] };
  },

  async validateCoupon(code: string, orderAmount: number) {
    const response = await api.post('/users/coupons/validate', { code, orderAmount });
    return response.data.data;
  },

  // Admin
  async getAllUsers(params?: { page?: number; limit?: number; role?: string; search?: string }) {
    const response = await api.get('/users/admin/users', { params });
    return response.data;
  },

  async toggleUserStatus(userId: string) {
    const response = await api.put(`/users/admin/users/${userId}/toggle-status`);
    return response.data.data;
  },

  async getAllReviews(params?: { page?: number; limit?: number; isApproved?: boolean }) {
    const response = await api.get('/users/admin/reviews', { params });
    return response.data;
  },

  async approveReview(reviewId: string) {
    const response = await api.put(`/users/admin/reviews/${reviewId}/approve`);
    return response.data;
  },

  async replyToReview(reviewId: string, reply: string) {
    const response = await api.put(`/users/admin/reviews/${reviewId}/reply`, { reply });
    return response.data;
  },
};
