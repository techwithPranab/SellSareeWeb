import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState, Product } from '@/types';
import { calculateCartSummary, getProductEffectivePrice } from '@/utils/helpers';

const initialState: CartState = {
  items: [],
  coupons: [],
  couponCode: null,
  couponDiscount: 0,
  loyaltyPointsToRedeem: 0,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<{ product: Product; quantity: number; color?: string }>
    ) => {
      const { product, quantity, color } = action.payload;
      const price = getProductEffectivePrice(product);
      const existingIndex = state.items.findIndex(
        (item) => item.product._id === product._id && item.color === color
      );
      const quantityInCart = state.items
        .filter((item) => item.product._id === product._id)
        .reduce((total, item) => total + item.quantity, 0);
      const quantityToAdd = Math.min(quantity, Math.max(0, product.stock - quantityInCart));

      if (quantityToAdd <= 0) return;

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += quantityToAdd;
        state.items[existingIndex].subtotal = state.items[existingIndex].quantity * price;
      } else {
        state.items.push({
          _id: `${product._id}_${color || 'default'}_${Date.now()}`,
          product,
          quantity: quantityToAdd,
          color,
          price,
          subtotal: quantityToAdd * price,
        });
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item._id !== action.payload);
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find((i) => i._id === itemId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i._id !== itemId);
        } else {
          const quantityInOtherLines = state.items
            .filter((other) => other._id !== itemId && other.product._id === item.product._id)
            .reduce((total, other) => total + other.quantity, 0);
          const allowedQuantity = Math.min(quantity, Math.max(0, item.product.stock - quantityInOtherLines));
          item.quantity = allowedQuantity;
          item.subtotal = allowedQuantity * item.price;
        }
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.coupons = [];
      state.couponCode = null;
      state.couponDiscount = 0;
      state.loyaltyPointsToRedeem = 0;
    },

    applyCoupon: (
      state,
      action: PayloadAction<{ code: string; discount: number; type?: string; discountValue?: number; maxDiscount?: number }>
    ) => {
      state.coupons ??= state.couponCode ? [{ code: state.couponCode, discount: state.couponDiscount }] : [];
      state.coupons.push(action.payload);
      state.couponCode = state.coupons[0]?.code ?? null;
      state.couponDiscount = state.coupons.reduce((sum, coupon) => sum + coupon.discount, 0);
    },

    removeCoupon: (state, action: PayloadAction<string | undefined>) => {
      state.coupons ??= state.couponCode ? [{ code: state.couponCode, discount: state.couponDiscount }] : [];
      if (action.payload === undefined) {
        state.coupons = [];
      } else {
        const index = state.coupons.findIndex((coupon) => coupon.code === action.payload);
        if (index >= 0) state.coupons.splice(index, 1);
      }
      state.couponCode = state.coupons[0]?.code ?? null;
      state.couponDiscount = state.coupons.reduce((sum, coupon) => sum + coupon.discount, 0);
    },

    setLoyaltyPoints: (state, action: PayloadAction<number>) => {
      state.loyaltyPointsToRedeem = action.payload;
    },

    setCartError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  applyCoupon,
  removeCoupon,
  setLoyaltyPoints,
  setCartError,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCoupons = (state: { cart: CartState }) => state.cart.coupons ??
  (state.cart.couponCode ? [{ code: state.cart.couponCode, discount: state.cart.couponDiscount }] : []);
export const selectCartSummary = (state: { cart: CartState }) => {
  const base = calculateCartSummary(state.cart.items);
  const coupons = selectCoupons(state);
  const merchandiseDiscount = Math.min(base.subtotal, coupons.reduce((sum, coupon) => {
    if (coupon.type === 'free_shipping') return sum;
    let amount = coupon.type === 'percentage' ? base.subtotal * (coupon.discountValue ?? 0) / 100
      : coupon.type === 'fixed' ? (coupon.discountValue ?? 0) : coupon.discount;
    if (coupon.type === 'percentage' && coupon.maxDiscount) amount = Math.min(amount, coupon.maxDiscount);
    return sum + amount;
  }, 0));
  const discount = merchandiseDiscount + (coupons.some((coupon) => coupon.type === 'free_shipping') ? base.shippingCharge : 0);
  return calculateCartSummary(state.cart.items, discount, state.cart.loyaltyPointsToRedeem);
};
export const selectCoupon = (state: { cart: CartState }) => ({
  code: selectCoupons(state).map((coupon) => coupon.code).join(', ') || null,
  discount: selectCartSummary(state).couponDiscount,
});
export const selectLoyaltyPointsToRedeem = (state: { cart: CartState }) =>
  state.cart.loyaltyPointsToRedeem;

export default cartSlice.reducer;
