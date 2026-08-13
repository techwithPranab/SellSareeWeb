'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  applyCoupon,
  removeCoupon,
  setLoyaltyPoints,
  selectCartItems,
  selectCartItemCount,
  selectCartSummary,
  selectCoupon,
  selectLoyaltyPointsToRedeem,
} from '@/features/cart/cartSlice';
import { Product } from '@/types';
import toast from 'react-hot-toast';
import { userService } from '@/services/user.service';
import { isProductComingSoon } from '@/utils/helpers';

export const useCart = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const itemCount = useAppSelector(selectCartItemCount);
  const summary = useAppSelector(selectCartSummary);
  const coupon = useAppSelector(selectCoupon);
  const loyaltyPointsToRedeem = useAppSelector(selectLoyaltyPointsToRedeem);

  const addItem = useCallback(
    (product: Product, quantity = 1, color?: string) => {
      if (isProductComingSoon(product)) {
        toast.error('This product is coming soon and is not available to order yet.');
        return;
      }
      if (product.stock < quantity) {
        toast.error('Insufficient stock available');
        return;
      }
      dispatch(addToCart({ product, quantity, color }));
      toast.success('Added to cart! 🛒');
    },
    [dispatch]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      dispatch(removeFromCart(itemId));
    },
    [dispatch]
  );

  const updateItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      dispatch(updateQuantity({ itemId, quantity }));
    },
    [dispatch]
  );

  const emptyCart = useCallback(() => {
    dispatch(clearCart());
  }, [dispatch]);

  const applyCouponCode = useCallback(
    async (code: string) => {
      try {
        const result = await userService.validateCoupon(code, summary.subtotal);
        dispatch(applyCoupon({ code, discount: result.coupon.discountAmount }));
        toast.success(`Coupon "${code}" applied! You saved ₹${result.coupon.discountAmount}`);
        return { success: true, discount: result.coupon.discountAmount };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message: string };
        const message = err.response?.data?.message || 'Invalid coupon code';
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [dispatch, summary.subtotal]
  );

  const removeCouponCode = useCallback(() => {
    dispatch(removeCoupon());
    toast.success('Coupon removed');
  }, [dispatch]);

  const redeemLoyaltyPoints = useCallback(
    (points: number) => {
      dispatch(setLoyaltyPoints(points));
    },
    [dispatch]
  );

  const isInCart = useCallback(
    (productId: string) => items.some((item) => item.product._id === productId),
    [items]
  );

  const getCartItemQuantity = useCallback(
    (productId: string) => {
      const item = items.find((i) => i.product._id === productId);
      return item?.quantity || 0;
    },
    [items]
  );

  return {
    items,
    itemCount,
    summary,
    coupon,
    loyaltyPointsToRedeem,
    addItem,
    removeItem,
    updateItemQuantity,
    emptyCart,
    applyCouponCode,
    removeCouponCode,
    redeemLoyaltyPoints,
    isInCart,
    getCartItemQuantity,
  };
};
