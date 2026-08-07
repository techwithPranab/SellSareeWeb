import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState, Product } from '@/types';
import { calculateCartSummary } from '@/utils/helpers';

const initialState: CartState = {
  items: [],
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
      const price = product.salePrice || product.price;
      const existingIndex = state.items.findIndex(
        (item) => item.product._id === product._id && item.color === color
      );

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += quantity;
        state.items[existingIndex].subtotal = state.items[existingIndex].quantity * price;
      } else {
        state.items.push({
          _id: `${product._id}_${color || 'default'}_${Date.now()}`,
          product,
          quantity,
          color,
          price,
          subtotal: quantity * price,
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
          item.quantity = quantity;
          item.subtotal = quantity * item.price;
        }
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.couponCode = null;
      state.couponDiscount = 0;
      state.loyaltyPointsToRedeem = 0;
    },

    applyCoupon: (
      state,
      action: PayloadAction<{ code: string; discount: number }>
    ) => {
      state.couponCode = action.payload.code;
      state.couponDiscount = action.payload.discount;
    },

    removeCoupon: (state) => {
      state.couponCode = null;
      state.couponDiscount = 0;
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
export const selectCartSummary = (state: { cart: CartState }) =>
  calculateCartSummary(
    state.cart.items,
    state.cart.couponDiscount,
    state.cart.loyaltyPointsToRedeem
  );
export const selectCoupon = (state: { cart: CartState }) => ({
  code: state.cart.couponCode,
  discount: state.cart.couponDiscount,
});

export default cartSlice.reducer;
