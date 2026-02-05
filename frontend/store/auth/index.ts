import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_CONFIG } from "@/utils/config";

interface User {
  id: number;
  email: string;
  role: "student" | "faculty" | "admin";
  first_name?: string;
  last_name?: string;
  student_id?: number;
  faculty_id?: number;
  access_token?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

// ✅ Single thunk for signin + signup
export const authAction = createAsyncThunk(
  "auth/authAction",
  async (
    { data, type }: { data: any; type: "signin" | "signup" },
    { rejectWithValue }
  ) => {
    try {
      const endpoint =
        type === "signin"
          ? API_CONFIG.AUTHORIZE_API_URL
          : API_CONFIG.REGISTER_API_URL;

      const response = await axios.post(
        `${API_CONFIG.BASE_API}${endpoint}`,
        data,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // if backend sets cookie
        }
      );
      console.log(response);

      // persist user in localStorage
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
        // also persist access token if provided by backend
        const token = (response.data as any)?.access_token;
        if (token) {
          localStorage.setItem("token", token);
        }
      }

      return response.data; // 👈 only return user
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Authentication failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    loadUserFromStorage: (state) => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          state.user = JSON.parse(storedUser);
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
          state.user = null;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authAction.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(authAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, loadUserFromStorage } = authSlice.actions;
export default authSlice.reducer;
