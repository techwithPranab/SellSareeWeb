import api from './api';
import type { StoreSettings } from './admin.service';

export const settingService = {
  async getStoreSettings() {
    const response = await api.get('/settings');
    return response.data.data as { settings: StoreSettings };
  },
};
