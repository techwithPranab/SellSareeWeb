import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product, ProductsState, ProductFilter, PaginationMeta } from '@/types';
import { productService } from '@/services/product.service';

const initialState: ProductsState = {
  items: [],
  featuredProducts: [],
  newArrivals: [],
  bestSellers: [],
  currentProduct: null,
  relatedProducts: [],
  isLoading: false,
  error: null,
  pagination: null,
  filters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc',
  viewMode: 'grid',
  recentlyViewed: [],
};

// =============================================
// ASYNC THUNKS
// =============================================

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (
    params: { filter?: ProductFilter; page?: number; limit?: number; sortBy?: string; sortOrder?: string },
    { rejectWithValue }
  ) => {
    try {
      return await productService.getProducts(params);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message: string };
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchProductBySlug = createAsyncThunk(
  'products/fetchBySlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      return await productService.getProductBySlug(slug);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message: string };
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeatured',
  async (_, { rejectWithValue }) => {
    try {
      return await productService.getFeaturedProducts();
    } catch (error: unknown) {
      const err = error as { message: string };
      return rejectWithValue(err.message);
    }
  }
);

export const fetchNewArrivals = createAsyncThunk(
  'products/fetchNewArrivals',
  async (_, { rejectWithValue }) => {
    try {
      return await productService.getNewArrivals();
    } catch (error: unknown) {
      const err = error as { message: string };
      return rejectWithValue(err.message);
    }
  }
);

export const fetchBestSellers = createAsyncThunk(
  'products/fetchBestSellers',
  async (_, { rejectWithValue }) => {
    try {
      return await productService.getBestSellers();
    } catch (error: unknown) {
      const err = error as { message: string };
      return rejectWithValue(err.message);
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/search',
  async (
    params: { query: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      return await productService.searchProducts(params.query, params);
    } catch (error: unknown) {
      const err = error as { message: string };
      return rejectWithValue(err.message);
    }
  }
);

// =============================================
// SLICE
// =============================================

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ProductFilter>) => {
      state.filters = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<ProductFilter>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.viewMode = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.relatedProducts = [];
    },
    addToRecentlyViewed: (state, action: PayloadAction<Product>) => {
      const existing = state.recentlyViewed.findIndex((p) => p._id === action.payload._id);
      if (existing >= 0) {
        state.recentlyViewed.splice(existing, 1);
      }
      state.recentlyViewed.unshift(action.payload);
      if (state.recentlyViewed.length > 20) {
        state.recentlyViewed.pop();
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.meta?.pagination || null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch by slug
    builder
      .addCase(fetchProductBySlug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentProduct = null;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload.product;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Featured products
    builder.addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
      state.featuredProducts = action.payload.products;
    });

    // New arrivals
    builder.addCase(fetchNewArrivals.fulfilled, (state, action) => {
      state.newArrivals = action.payload.products;
    });

    // Best sellers
    builder.addCase(fetchBestSellers.fulfilled, (state, action) => {
      state.bestSellers = action.payload.products;
    });

    // Search
    builder
      .addCase(searchProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.meta?.pagination || null;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setFilters,
  updateFilters,
  clearFilters,
  setSortBy,
  setSortOrder,
  setViewMode,
  clearCurrentProduct,
  addToRecentlyViewed,
  clearError,
} = productsSlice.actions;

export default productsSlice.reducer;
