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
      const quantityInCart = items
        .filter((item) => item.product._id === product._id)
        .reduce((total, item) => total + item.quantity, 0);
      if (quantityInCart + quantity > product.stock) {
        toast.error('Insufficient stock available');
        return;
      }
      dispatch(addToCart({ product, quantity, color }));
      toast.success('Added to cart! 🛒');
    },
    [dispatch, items]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      dispatch(removeFromCart(itemId));
    },
    [dispatch]
  );

  const removeProduct = useCallback(
    (productId: string) => {
      items
        .filter((item) => item.product._id === productId)
        .forEach((item) => dispatch(removeFromCart(item._id)));
      toast.success('Removed from cart');
    },
    [dispatch, items]
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
      return items
        .filter((item) => item.product._id === productId)
        .reduce((total, item) => total + item.quantity, 0);
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
    removeProduct,
    updateItemQuantity,
    emptyCart,
    applyCouponCode,
    removeCouponCode,
    redeemLoyaltyPoints,
    isInCart,
    getCartItemQuantity,
  };
};
