import { API_CONFIG } from "@/utils/config";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

export interface Topic {
  id: number;
  name: string;
  description?: string;
}

export interface SubjectWithTopics {
  id: number;
  name: string;
  code: string;
  topics: Topic[];
}

export interface Course {
  id: number;
  course_name: string;
  course_desc?: string;
  course_img?: string;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  batch_ids: number[];
  student_ids: number[];
  faculty_ids: number[];
  subject_ids: number[];
  topic_ids: number[];
  subjects: SubjectWithTopics[];
}

export const fetchCourses = createAsyncThunk("courses/fetchAll", async () => {
  const res = await axios.get(
    `${API_CONFIG.BASE_API}${API_CONFIG.COURSES_API_URL}`
  );
  return res.data;
});

export const createCourse = createAsyncThunk(
  "courses/create",
  async (payload: any) => {
    const res = await axios.post(
      `${API_CONFIG.BASE_API}${API_CONFIG.COURSES_API_URL}`,
      payload
    );
    return res.data;
  }
);

export const fetchCourseById = createAsyncThunk(
  "courses/fetchById",
  async (id: string | number) => {
    const res = await axios.get(
      `${API_CONFIG.BASE_API}${API_CONFIG.COURSES_API_URL}/${id}`
    );
    return res.data;
  }
);

// Update a course by ID (PUT)
export const updateCourse = createAsyncThunk(
  "courses/update",
  async ({ id, payload }: { id: string | number; payload: any }) => {
    const res = await axios.put(
      `${API_CONFIG.BASE_API}${API_CONFIG.COURSES_API_URL}/${id}`,
      payload
    );
    return res.data;
  }
);

// Delete a course by ID (DELETE)
export const deleteCourse = createAsyncThunk(
  "courses/delete",
  async (id: string | number) => {
    const res = await axios.delete(
      `${API_CONFIG.BASE_API}${API_CONFIG.COURSES_API_URL}/${id}`
    );
    return { id, data: res.data };
  }
);

interface CoursesState {
  list: Course[];
  selected: Course | null;
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
}

const initialState: CoursesState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
  hasFetched: false,
};

const courseSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        state.error = null;
        state.hasFetched = true;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch courses";
      })
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = true;
        state.selected = null; // Clear stale data while loading new course
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
        state.error = null;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch course";
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.list.push(action.payload);
        state.error = null;
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create course";
      })
      // Update course
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.error = null;
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update course";
      })
      // Delete course
      .addCase(deleteCourse.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((c) => c.id !== action.payload.id);
        if (state.selected && state.selected.id === action.payload.id) {
          state.selected = null;
        }
        state.error = null;
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete course";
      });
  },
});

export const { clearError } = courseSlice.actions;
export default courseSlice.reducer;
