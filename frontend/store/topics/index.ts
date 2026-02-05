import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axios";
import type { RootState } from "@/store";

export interface TopicItem {
  id: number;
  name: string;
  description?: string | null;
  subject_id: number;
}

type TopicsState = {
  bySubject: Record<number, TopicItem[]>;
  loading: boolean;
  error: string;
};

const initialState: TopicsState = {
  bySubject: {},
  loading: false,
  error: "",
};

export const fetchTopicsBySubject = createAsyncThunk<
  { subjectId: number; topics: TopicItem[] },
  number
>("topics/fetchBySubject", async (subjectId: number, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/topics/by-subject/${subjectId}`);
    return { subjectId, topics: (res.data || []) as TopicItem[] };
  } catch (e: any) {
    return rejectWithValue(e?.message || "Failed to fetch topics");
  }
});

export const deleteTopic = createAsyncThunk<void, number>(
  "topics/deleteTopic",
  async (topicId: number, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/topics/${topicId}`);
    } catch (e: any) {
      return rejectWithValue(e?.message || "Failed to delete topic");
    }
  }
);

const slice = createSlice({
  name: "topics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopicsBySubject.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchTopicsBySubject.fulfilled,
        (state, action: PayloadAction<{ subjectId: number; topics: TopicItem[] }>) => {
          state.bySubject[action.payload.subjectId] = action.payload.topics;
          state.loading = false;
          state.error = "";
        }
      )
      .addCase(fetchTopicsBySubject.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch topics";
      });
  },
});

export const selectTopicsBySubject = (state: RootState, subjectId: number): TopicItem[] =>
  state.topicsReducer?.bySubject?.[subjectId] || [];

export default slice.reducer;
