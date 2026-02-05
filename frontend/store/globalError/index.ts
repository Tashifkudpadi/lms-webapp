import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface GlobalErrorState {
  message: string | null;
  detail?: any;
}

const initialState: GlobalErrorState = {
  message: null,
  detail: undefined,
};

const globalErrorSlice = createSlice({
  name: "globalError",
  initialState,
  reducers: {
    setGlobalError: (
      state,
      action: PayloadAction<{ message: string; detail?: any } | string>
    ) => {
      if (typeof action.payload === "string") {
        state.message = action.payload;
        state.detail = undefined;
      } else {
        state.message = action.payload.message;
        state.detail = action.payload.detail;
      }
    },
    clearGlobalError: (state) => {
      state.message = null;
      state.detail = undefined;
    },
  },
});

export const { setGlobalError, clearGlobalError } = globalErrorSlice.actions;
export default globalErrorSlice.reducer;
