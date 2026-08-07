import api from './api';
import { User } from '@/types';

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    referralCode?: string;
  }) {
    const response = await api.post('/auth/register', data);
    return response.data.data as { user: User; tokens: { accessToken: string; refreshToken: string } };
  },

  async login(data: { email: string; password: string }) {
    const response = await api.post('/auth/login', data);
    return response.data.data as { user: User; tokens: { accessToken: string; refreshToken: string } };
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.data as { user: User };
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh-token');
    return response.data.data as { tokens: { accessToken: string; refreshToken: string } };
  },

  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string) {
    const response = await api.put(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
};
