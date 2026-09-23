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

export interface GiftItem {
  _id: string;
  name: string;
  sku: string;
  stock: number;
  unitCost: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkProductResult {
  row: number;
  sku: string;
  success: boolean;
  productId?: string;
  error?: string;
}

export interface StoreSettings {
  _id?: string;
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  storeAddress: string;
  freeShippingThreshold: number;
  standardShippingRate: number;
  loyaltyPointsRate: number;
  upiId: string;
  upiPayeeName: string;
  upcomingSareeAnnouncementDate?: string | null;
  socialLinks: Record<string, string>;
}

export interface AdminExpense {
  _id: string;
  transactionType: 'expense' | 'investment';
  expenseDate: string;
  category: string;
  amount: number;
  description: string;
  vendor?: string;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
  reference?: string;
  notes?: string;
  isSettled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  isActive: boolean;
  subscribedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  asOf: string;
  totalRevenue: number;
  totalInvestments: number;
  totalExpenses: number;
  currentBalance: number;
  todayExpenses: number;
  monthExpenses: number;
  todayInvestments: number;
  monthInvestments: number;
  byCategory: Array<{ _id: string; amount: number; count: number }>;
}

export interface ProfitLossMetrics {
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  ebitda: number;
  depreciationAndAmortization: number;
  ebit: number;
  interest: number;
  profitBeforeTax: number;
  taxes: number;
  netProfit: number;
  grossMargin: number;
  ebitdaMargin: number;
  netMargin: number;
  orderCount?: number;
  missingBuyPriceSoldUnits?: number;
}

export interface ProfitLossReport {
  period: { from: string; to: string; previousFrom: string; previousTo: string };
  current: ProfitLossMetrics;
  previous: ProfitLossMetrics;
  trend: Array<ProfitLossMetrics & { month: string }>;
  expensesByCategory: Array<{ _id: string; amount: number; count: number }>;
  unrealizedRevenue: { amount: number; orders: number };
  inventory: { value: number; units: number; products: number; missingBuyPriceProducts: number; sareeValue: number; giftValue: number; giftUnits: number; giftItems: number };
  orderProfitability: {
    averageOtherExpense: number;
    allocationOperatingExpenses: number;
    allocationInventoryUnits: number;
    inStockInventoryUnits: number;
    soldInventoryUnits: number;
    orders: Array<{ _id: string; orderNumber: string; orderDate: string; customerName: string; status: string; paymentStatus: string; revenue: number; sareeCount: number; buyPrice: number; allocatedOtherExpense: number; netProfit: number; netMargin: number; missingBuyPriceUnits: number }>;
  };
}

export const adminService = {
  async getGiftItems(activeOnly = false) {
    const response = await api.get('/gift-items', { params: activeOnly ? { active: true } : undefined });
    return response.data.data as { items: GiftItem[] };
  },

  async createGiftItem(data: Omit<GiftItem, '_id' | 'createdAt' | 'updatedAt'>) {
    const response = await api.post('/gift-items', data);
    return response.data.data as { item: GiftItem };
  },

  async updateGiftItem(id: string, data: Omit<GiftItem, '_id' | 'createdAt' | 'updatedAt'>) {
    const response = await api.put(`/gift-items/${id}`, data);
    return response.data.data as { item: GiftItem };
  },

  async deleteGiftItem(id: string) { await api.delete(`/gift-items/${id}`); },

  async getNewsletterSubscribers(params?: { page?: number; limit?: number; search?: string }) {
    const response = await api.get('/newsletter/admin/subscribers', { params });
    return response.data as PaginatedResponse<NewsletterSubscriber>;
  },

  async getExpenses(params?: { page?: number; limit?: number; category?: string; from?: string; to?: string; settlement?: 'settled' | 'pending' }) {
    const response = await api.get('/expenses', { params });
    return response.data as PaginatedResponse<AdminExpense>;
  },

  async getExpenseSummary() {
    const response = await api.get('/expenses/summary');
    return response.data.data as { summary: ExpenseSummary };
  },

  async getProfitLoss(params?: { from?: string; to?: string }) {
    const response = await api.get('/expenses/profit-loss', { params });
    return response.data.data as ProfitLossReport;
  },

  async exportExpenses(params?: { category?: string; from?: string; to?: string; settlement?: 'settled' | 'pending' }) {
    const response = await api.get('/expenses/export', { params, responseType: 'blob' });
    return response.data as Blob;
  },

  async createExpense(data: Omit<AdminExpense, '_id' | 'createdAt' | 'updatedAt'>) {
    const response = await api.post('/expenses', data);
    return response.data.data as { expense: AdminExpense };
  },

  async updateExpense(id: string, data: Omit<AdminExpense, '_id' | 'createdAt' | 'updatedAt'>) {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data.data as { expense: AdminExpense };
  },

  async updateExpenseSettlement(id: string, isSettled: boolean) {
    const response = await api.patch(`/expenses/${id}/settlement`, { isSettled });
    return response.data.data as { expense: AdminExpense };
  },

  async deleteExpense(id: string) {
    await api.delete(`/expenses/${id}`);
  },

  async getStoreSettings() {
    const response = await api.get('/settings');
    return response.data.data as { settings: StoreSettings };
  },

  async updateStoreSettings(data: StoreSettings) {
    const response = await api.put('/settings', data);
    return response.data.data as { settings: StoreSettings };
  },

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
    status?: 'active' | 'inactive';
    stockStatus?: 'in_stock' | 'out_of_stock';
    sortBy?: string;
    sortOrder?: string;
  }) {
    const response = await api.get('/products/admin/all', { params: { ...params, limit: params?.limit ?? 20 } });
    return response.data as PaginatedResponse<Product>;
  },

  async getProduct(id: string) {
    const response = await api.get(`/products/admin/${id}`);
    return response.data.data as { product: Product };
  },

  async createProduct(formData: FormData) {
    const response = await api.post('/products', formData);
    return response.data.data as { product: Product };
  },

  async bulkCreateProducts(products: Array<Record<string, string>>) {
    const response = await api.post('/products/bulk', { products });
    return response.data.data as { created: number; failed: number; results: BulkProductResult[] };
  },

  async cloneProduct(id: string) {
    const response = await api.post(`/products/${id}/clone`);
    return response.data.data as { product: Product };
  },

  async updateProduct(id: string, formData: FormData) {
    const response = await api.put(`/products/${id}`, formData);
    return response.data.data as { product: Product };
  },

  async deleteProductImage(productId: string, publicId: string) {
    const response = await api.delete(
      `/products/${productId}/images/${encodeURIComponent(publicId)}`
    );
    return response.data.data as { product: Product };
  },

  async deleteProduct(id: string) {
    await api.delete(`/products/${id}`);
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  async getOrders(params?: { page?: number; limit?: number; status?: string; search?: string; customerId?: string; paymentStatus?: string; paymentMethod?: string; from?: string; to?: string }) {
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

  async updateOrderGiftItems(orderId: string, giftItems: Array<{ giftItemId: string; quantity: number }>) {
    const response = await api.put(`/orders/${orderId}/gift-items`, { giftItems });
    return response.data.data as { order: Order };
  },

  async initiateRefund(orderId: string, amount?: number) {
    const response = await api.post(`/orders/${orderId}/refund`, { amount });
    return response.data.data as { success: boolean };
  },

  async confirmManualPayment(orderId: string) {
    const response = await api.put(`/orders/${orderId}/manual-payment/confirm`);
    return response.data.data as { order: Order };
  },

  async recordManualPayment(orderId: string, data: { amount: number; paidAt: string; reference?: string; note?: string }) {
    const response = await api.post(`/orders/${orderId}/manual-payments`, data);
    return response.data.data as { order: Order };
  },

  async markOrderUnpaid(orderId: string) {
    const response = await api.put(`/orders/${orderId}/mark-unpaid`);
    return response.data.data as { order: Order };
  },

  async createOrderForCustomer(data: {
    customerId?: string;
    customer?: { name: string; email: string; phone: string };
    items: Array<{ productId: string; quantity: number }>;
    shippingAddress: {
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
    paymentMethod: 'upi';
    couponCodes?: string[];
    notes?: string;
    transactionId?: string;
    paymentScreenshot?: File;
  }) {
    const formData = new FormData();
    if (data.customerId) formData.append('customerId', data.customerId);
    if (data.customer) formData.append('customer', JSON.stringify(data.customer));
    formData.append('items', JSON.stringify(data.items));
    if (data.couponCodes) formData.append('couponCodes', JSON.stringify(data.couponCodes));
    formData.append('shippingAddress', JSON.stringify(data.shippingAddress));
    formData.append('paymentMethod', data.paymentMethod);
    if (data.notes) formData.append('notes', data.notes);
    if (data.transactionId) formData.append('transactionId', data.transactionId);
    if (data.paymentScreenshot) formData.append('paymentScreenshot', data.paymentScreenshot);
    const response = await api.post('/orders/admin/create-for-customer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as { order: Order };
  },

  // ── Customers ──────────────────────────────────────────────────────────────
  async getCustomers(params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }) {
    const response = await api.get('/users/admin/users', { params });
    return response.data as PaginatedResponse<User>;
  },

  async toggleCustomerStatus(userId: string) {
    const response = await api.put(`/users/admin/users/${userId}/toggle-status`);
    return response.data.data as { user: User };
  },

  async updateCustomer(userId: string, data: {
    name: string;
    email: string;
    phone?: string;
    importantDates: Array<{ label: string; date: string; notes?: string }>;
  }) {
    const response = await api.put(`/users/admin/users/${userId}`, data);
    return response.data.data as { user: User };
  },

  // ── Coupons ────────────────────────────────────────────────────────────────
  async getCoupons(params?: { page?: number; limit?: number; isActive?: boolean; code?: string }) {
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

  async toggleHomepageReview(reviewId: string) {
    const response = await api.put(`/users/admin/reviews/${reviewId}/homepage`);
    return response.data;
  },

  // ── Categories ─────────────────────────────────────────────────────────────
  async getCategories() {
    const response = await api.get('/categories/admin/all');
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

  async updateCategoryStatus(id: string, isActive: boolean) {
    const response = await api.patch(`/categories/${id}/status`, { isActive });
    return response.data.data as { category: import('@/types').Category };
  },
};

export type { PaginationMeta };
