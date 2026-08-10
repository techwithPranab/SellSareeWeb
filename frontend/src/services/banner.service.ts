import api from './api';
import type { Banner } from '@/types';

export const bannerService = {
  async getActiveCarouselSlides() {
    const response = await api.get('/banners/active', { params: { position: 'hero' } });
    return response.data.data as { banners: Banner[] };
  },
};
