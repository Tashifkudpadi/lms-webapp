// store/batches.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_CONFIG } from "@/utils/config";

export interface Batch {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  num_learners: number;
}

interface BatchState {
  batches: Batch[];
  loading: boolean;
  error: string | null;
}

const initialState: BatchState = {
  batches: [],
  loading: false,
  error: null,
};

// Fetch all batches
export const fetchBatches = createAsyncThunk(
  "batches/fetchBatches",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${API_CONFIG.BASE_API}${API_CONFIG.BATCHES_API_URL}`
      );
      return res.data as Batch[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to fetch batches"
      );
    }
  }
);

// Add batch
export const addBatch = createAsyncThunk(
  "batches/addBatch",
  async (batchData: Omit<Batch, "id">, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_CONFIG.BASE_API}${API_CONFIG.BATCHES_API_URL}`,
        batchData
      );
      return res.data as Batch;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to add batch"
      );
    }
  }
);

// Update batch
export const updateBatch = createAsyncThunk(
  "batches/updateBatch",
  async (
    { batchId, batchData }: { batchId: number; batchData: Partial<Batch> },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.put(
        `${API_CONFIG.BASE_API}${API_CONFIG.BATCHES_API_URL}/${batchId}`,
        batchData
      );
      return res.data as Batch;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to update batch"
      );
    }
  }
);

// Delete batch
export const deleteBatch = createAsyncThunk(
  "batches/deleteBatch",
  async (batchId: number, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${API_CONFIG.BASE_API}${API_CONFIG.BATCHES_API_URL}/${batchId}`
      );
      return batchId;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to delete batch"
      );
    }
  }
);

const batchSlice = createSlice({
  name: "batches",
  initialState,
  reducers: {
    clearBatchError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = action.payload;
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addBatch.fulfilled, (state, action) => {
        state.batches.push(action.payload);
      })
      .addCase(updateBatch.fulfilled, (state, action) => {
        const index = state.batches.findIndex(
          (b) => b.id === action.payload.id
        );
        if (index !== -1) state.batches[index] = action.payload;
      })
      .addCase(deleteBatch.fulfilled, (state, action) => {
        state.batches = state.batches.filter((b) => b.id !== action.payload);
      });
  },
});

export const { clearBatchError } = batchSlice.actions;
export default batchSlice.reducer;
