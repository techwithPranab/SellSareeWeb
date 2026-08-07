import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Order, OrdersState, PaginationMeta } from '@/types';
import { orderService } from '@/services/order.service';

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  pagination: null,
};

// =============================================
// ASYNC THUNKS
// =============================================

export const fetchUserOrders = createAsyncThunk(
  'orders/fetchAll',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      return await orderService.getUserOrders(params);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message: string };
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      return await orderService.getOrderById(orderId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message: string };
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData: Parameters<typeof orderService.createOrder>[0], { rejectWithValue }) => {
    try {
      return await orderService.createOrder(orderData);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message: string };
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async (
    { orderId, reason }: { orderId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      return await orderService.cancelOrder(orderId, reason);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message: string };
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const requestReturnOrder = createAsyncThunk(
  'orders/requestReturn',
  async (
    { orderId, reason }: { orderId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      return await orderService.requestReturn(orderId, reason);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message: string };
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


// =============================================
// SLICE
// =============================================

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setCurrentOrder: (state, action: PayloadAction<Order>) => {
      state.currentOrder = action.payload;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder
      .addCase(fetchUserOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data ?? [];
        state.pagination = action.payload.meta?.pagination || null;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch by ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.order;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.order;
        state.orders.unshift(action.payload.order);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel
    builder.addCase(cancelOrder.fulfilled, (state, action) => {
      const index = state.orders.findIndex((o) => o._id === action.payload.order._id);
      if (index >= 0) state.orders[index] = action.payload.order;
      if (state.currentOrder?._id === action.payload.order._id) {
        state.currentOrder = action.payload.order;
      }
    });

    // Request Return
    builder.addCase(requestReturnOrder.fulfilled, (state, action) => {
      const index = state.orders.findIndex((o) => o._id === action.payload.order._id);
      if (index >= 0) state.orders[index] = action.payload.order;
      if (state.currentOrder?._id === action.payload.order._id) {
        state.currentOrder = action.payload.order;
      }
    });
  },
});

export const { setCurrentOrder, clearCurrentOrder, clearOrderError } = ordersSlice.actions;
export default ordersSlice.reducer;
