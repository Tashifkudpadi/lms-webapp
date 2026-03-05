import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axios";

export interface Message {
  id: number;
  course_id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
  course_name?: string;
}

export interface Conversation {
  other_user_id: number;
  other_user_name: string;
  course_id: number;
  course_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface CourseFaculty {
  user_id: number;
  faculty_id: number;
  name: string;
  email: string;
}

interface MessagesState {
  conversations: Conversation[];
  currentMessages: Message[];
  courseFaculty: CourseFaculty[];
  loading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  conversations: [],
  currentMessages: [],
  courseFaculty: [],
  loading: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  "messages/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/messages/conversations");
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.detail || "Failed to fetch conversations"
      );
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async (
    { courseId, otherUserId }: { courseId: number; otherUserId: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/messages/${courseId}/${otherUserId}`
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.detail || "Failed to fetch messages"
      );
    }
  }
);

export const sendMessage = createAsyncThunk(
  "messages/send",
  async (
    data: { course_id: number; recipient_id: number; content: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.post("/messages", data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.detail || "Failed to send message"
      );
    }
  }
);

export const fetchCourseFaculty = createAsyncThunk(
  "messages/fetchCourseFaculty",
  async (courseId: number, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/messages/course/${courseId}/faculty`
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.detail || "Failed to fetch faculty"
      );
    }
  }
);

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    clearCurrentMessages: (state) => {
      state.currentMessages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch conversations";
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.currentMessages = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.currentMessages.push(action.payload);
      })
      .addCase(fetchCourseFaculty.fulfilled, (state, action) => {
        state.courseFaculty = action.payload;
      });
  },
});

export const { clearCurrentMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
