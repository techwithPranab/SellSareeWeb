import api from './api';

export interface LaunchRegistrationData {
  name: string;
  email: string;
  phone: string;
}

export const launchService = {
  async register(data: LaunchRegistrationData) {
    const response = await api.post('/launch/register', data);
    return response.data as { success: boolean; message: string };
  },
};
