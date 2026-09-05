import api from './api';

export const newsletterService = {
  async subscribe(email: string) {
    const response = await api.post('/newsletter/subscribe', { email });
    return response.data as { success: boolean; message: string };
  },
};
