import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axios";

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  course_id?: number;
  test_id?: number;
  created_at: string;
}

interface NotificationsState {
  list: Notification[];
  unreadCount: number;
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  list: [],
  unreadCount: 0,
  total: 0,
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (
    params?: { skip?: number; limit?: number; unread_only?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get("/notifications", { params });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.detail || "Failed to fetch notifications"
      );
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async () => {
    const res = await axiosInstance.get("/notifications/unread-count");
    return res.data.unread_count;
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (notificationId: number) => {
    await axiosInstance.put(`/notifications/${notificationId}/read`);
    return notificationId;
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async () => {
    await axiosInstance.put("/notifications/read-all");
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (notificationId: number) => {
    await axiosInstance.delete(`/notifications/${notificationId}`);
    return notificationId;
  }
);

export const clearAllNotifications = createAsyncThunk(
  "notifications/clearAll",
  async () => {
    await axiosInstance.delete("/notifications");
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.items;
        state.total = action.payload.total;
        state.unreadCount = action.payload.unread_count;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch notifications";
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const notif = state.list.find((n) => n.id === id);
        if (notif && !notif.is_read) {
          notif.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.list.forEach((n) => (n.is_read = true));
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const id = action.payload;
        const notif = state.list.find((n) => n.id === id);
        if (notif && !notif.is_read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.list = state.list.filter((n) => n.id !== id);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.list = [];
        state.total = 0;
        state.unreadCount = 0;
      });
  },
});

export default notificationsSlice.reducer;
