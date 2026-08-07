'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { loginUser, logoutUser, registerUser, getCurrentUser } from '@/features/auth/authSlice';
import { clearCart } from '@/features/cart/cartSlice';
import { clearWishlist } from '@/features/wishlist/wishlistSlice';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error, accessToken } = useAppSelector(
    (state) => state.auth
  );

  const login = useCallback(
    async (data: { email: string; password: string }) => {
      const result = await dispatch(loginUser(data));
      if (loginUser.fulfilled.match(result)) {
        toast.success(`Welcome back, ${result.payload.user.name}! 🥻`);
        return { success: true };
      } else {
        toast.error(result.payload as string || 'Login failed');
        return { success: false, error: result.payload };
      }
    },
    [dispatch]
  );

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      referralCode?: string;
    }) => {
      const result = await dispatch(registerUser(data));
      if (registerUser.fulfilled.match(result)) {
        toast.success(`Welcome to Rupkatha Sarees, ${result.payload.user.name}! 🎉`);
        return { success: true };
      } else {
        toast.error(result.payload as string || 'Registration failed');
        return { success: false, error: result.payload };
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
    dispatch(clearCart());
    dispatch(clearWishlist());
    toast.success('Logged out successfully');
    router.push('/');
  }, [dispatch, router]);

  const fetchCurrentUser = useCallback(async () => {
    return dispatch(getCurrentUser());
  }, [dispatch]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    isAdmin,
    isSuperAdmin,
    login,
    register,
    logout,
    fetchCurrentUser,
  };
};
