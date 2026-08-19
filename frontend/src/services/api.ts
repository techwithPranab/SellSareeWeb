import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/constants';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Track if we're refreshing to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor — Add access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Let the browser add the multipart boundary. Keeping the instance's
    // application/json header (or manually setting multipart/form-data without
    // a boundary) can cause Multer to receive no files.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      config.headers.delete('Content-Type');
    }

    // Get token from Redux store / localStorage
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (!originalRequest) return Promise.reject(error);
    const requestUrl = originalRequest?.url || '';
    const isAuthenticationRequest = [
      '/auth/login',
      '/auth/register',
      '/auth/logout',
      '/auth/refresh-token',
      '/auth/forgot-password',
      '/auth/reset-password',
    ].some((path) => requestUrl.includes(path));

    // Authentication failures must reach their calling form directly. Attempting
    // token refresh for a failed login causes the refresh request to queue itself.
    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthenticationRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh-token', {
          refreshToken: getRefreshToken(),
        });

        const { accessToken, refreshToken } = response.data.data?.tokens || {};

        if (accessToken) {
          setAccessToken(accessToken);
          if (refreshToken) setRefreshToken(refreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearTokens();
        if (typeof window !== 'undefined') {
          const isAdminPage = window.location.pathname.startsWith('/admin');
          window.location.href = isAdminPage
            ? '/admin-login?session=expired'
            : '/login?session=expired';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// =============================================
// TOKEN MANAGEMENT
// =============================================

const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const state = JSON.parse(localStorage.getItem('persist:pps_aura_root') || '{}');
    const auth = JSON.parse(state.auth || '{}');
    return auth.accessToken || null;
  } catch {
    return null;
  }
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const state = JSON.parse(localStorage.getItem('persist:pps_aura_root') || '{}');
    const auth = JSON.parse(state.auth || '{}');
    return auth.refreshToken || null;
  } catch {
    return null;
  }
};

const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const state = JSON.parse(localStorage.getItem('persist:pps_aura_root') || '{}');
    const auth = JSON.parse(state.auth || '{}');
    auth.accessToken = token;
    state.auth = JSON.stringify(auth);
    localStorage.setItem('persist:pps_aura_root', JSON.stringify(state));
  } catch {
    // silent fail
  }
};

const setRefreshToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const state = JSON.parse(localStorage.getItem('persist:pps_aura_root') || '{}');
    const auth = JSON.parse(state.auth || '{}');
    auth.refreshToken = token;
    state.auth = JSON.stringify(auth);
    localStorage.setItem('persist:pps_aura_root', JSON.stringify(state));
  } catch {
    // silent fail
  }
};

const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const state = JSON.parse(localStorage.getItem('persist:pps_aura_root') || '{}');
    const auth = JSON.parse(state.auth || '{}');
    auth.accessToken = null;
    auth.refreshToken = null;
    auth.isAuthenticated = false;
    auth.user = null;
    state.auth = JSON.stringify(auth);
    localStorage.setItem('persist:pps_aura_root', JSON.stringify(state));
  } catch {
    // silent fail
  }
};

export default api;
