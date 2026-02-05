import { API_CONFIG } from "@/utils/config";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  email: string;
  role: string;
  last_active: string | null;
}

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
};

// Fetch users
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_CONFIG.BASE_API}${API_CONFIG.USERS_API_URL}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data as User[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to fetch users"
      );
    }
  }
);

// Add user
export const addUser = createAsyncThunk(
  "users/addUser",
  async (
    userData: {
      first_name: string;
      last_name: string;
      email: string;
      role: string;
      password: string;
      confirm_password: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_CONFIG.BASE_API}${API_CONFIG.REGISTER_API_URL}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      // Transform response: register API returns first_name/last_name, but UI expects name
      const data = response.data;
      return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        role: data.role,
        last_active: null,
      } as User;
    } catch (err: any) {
      return rejectWithValue(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : err.response?.data?.detail?.map((e: any) => e.msg).join(", ") ||
              "Failed to add user"
      );
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async (
    {
      userId,
      userData,
    }: {
      userId: number;
      userData: {
        first_name?: string;
        last_name?: string;
        email?: string;
        role?: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_CONFIG.BASE_API}${API_CONFIG.USERS_API_URL}/${userId}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data as User;
    } catch (err: any) {
      return rejectWithValue(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : err.response?.data?.detail?.map((e: any) => e.msg).join(", ") ||
              "Failed to update user"
      );
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API_CONFIG.BASE_API}${API_CONFIG.USERS_API_URL}/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return userId;
    } catch (err: any) {
      return rejectWithValue(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : err.response?.data?.detail?.map((e: any) => e.msg).join(", ") ||
              "Failed to delete user"
      );
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch users
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.users = action.payload;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add user
    builder.addCase(addUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addUser.fulfilled, (state, action) => {
      state.loading = false;
      state.users.push(action.payload);
    });
    builder.addCase(addUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update user
    builder.addCase(updateUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.loading = false;
      state.users = state.users.map((user) =>
        user.id === action.payload.id ? action.payload : user
      );
    });
    builder.addCase(updateUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete user
    builder.addCase(deleteUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.loading = false;
      state.users = state.users.filter((user) => user.id !== action.payload);
    });
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
