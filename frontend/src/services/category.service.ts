import api from './api';
import { Category } from '@/types';

export const categoryService = {
  async getCategories() {
    const response = await api.get('/categories');
    return response.data.data as { categories: Category[] };
  },

  async getCategoryById(id: string) {
    const response = await api.get(`/categories/${id}`);
    return response.data.data as { category: Category };
  },
};
