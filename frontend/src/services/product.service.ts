import api from './api';
import { Product, PaginatedResponse } from '@/types';

export const productService = {
  async getProducts(params: {
    filter?: Record<string, unknown>;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    [key: string]: unknown;
  }) {
    const { filter, ...rest } = params;
    const queryParams = { ...filter, ...rest };
    const response = await api.get('/products', { params: queryParams });
    return response.data as PaginatedResponse<Product>;
  },

  async getProductBySlug(slug: string) {
    const response = await api.get(`/products/${slug}`);
    return response.data.data as { product: Product };
  },

  async getProductById(id: string) {
    const response = await api.get(`/products/id/${id}`);
    return response.data.data as { product: Product };
  },

  async getFeaturedProducts() {
    const response = await api.get('/products/featured');
    return response.data.data as { products: Product[] };
  },

  async getNewArrivals() {
    const response = await api.get('/products/new-arrivals');
    return response.data.data as { products: Product[] };
  },

  async getBestSellers() {
    const response = await api.get('/products/best-sellers');
    return response.data.data as { products: Product[] };
  },

  async searchProducts(query: string, params?: { page?: number; limit?: number }) {
    const response = await api.get('/products/search', { params: { q: query, ...params } });
    return response.data as PaginatedResponse<Product>;
  },

  async getRelatedProducts(productId: string, categoryId: string) {
    const response = await api.get(`/products/${productId}/related/${categoryId}`);
    return response.data.data as { products: Product[] };
  },

  // Admin
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
};
