import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WishlistState } from '@/types';

const initialState: WishlistState = {
  productIds: [],
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<string>) => {
      if (!state.productIds.includes(action.payload)) {
        state.productIds.push(action.payload);
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.productIds = state.productIds.filter((id) => id !== action.payload);
    },
    toggleWishlist: (state, action: PayloadAction<string>) => {
      const index = state.productIds.indexOf(action.payload);
      if (index >= 0) {
        state.productIds.splice(index, 1);
      } else {
        state.productIds.push(action.payload);
      }
    },
    clearWishlist: (state) => {
      state.productIds = [];
    },
    setWishlist: (state, action: PayloadAction<string[]>) => {
      state.productIds = action.payload;
    },
  },
});

export const { addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist, setWishlist } = wishlistSlice.actions;

// Selectors
export const selectWishlistIds = (state: { wishlist: WishlistState }) => state.wishlist.productIds;
export const selectIsInWishlist = (productId: string) => (state: { wishlist: WishlistState }) =>
  state.wishlist.productIds.includes(productId);

export default wishlistSlice.reducer;
