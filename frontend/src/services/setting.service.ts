import api from './api';
import type { StoreSettings } from './admin.service';

export interface StoreStats {
  sareesSold: number;
  customersServed: number;
}

export const settingService = {
  async getStoreStats() {
    const response = await api.get('/settings/stats');
    return response.data.data as { stats: StoreStats };
  },
  async getStoreSettings() {
    const response = await api.get('/settings');
    return response.data.data as { settings: StoreSettings };
  },
};
