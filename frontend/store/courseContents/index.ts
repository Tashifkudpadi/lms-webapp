import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axios";
import { RootState } from "../index";
import { uploadToMinio } from "@/utils/uploadToMinio";

export type CourseContent = {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  file_type?: string | null;
  file_url?: string | null;
  youtube_link?: string | null;
  subject_id: number;
  topic_id: number;
};

export const fetchCourseContents = createAsyncThunk<
  {
    courseId: number;
    items: CourseContent[];
    subjectNames: Record<number, string>;
    topicNames: Record<number, { name: string; subject_id: number }>;
  },
  number
>(
  "courseContents/fetchByCourse",
  async (courseId: number, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/course-contents/course/${courseId}`
      );
      const items: CourseContent[] = res.data || [];

      const subjectIds = Array.from(
        new Set(items.map((c) => c.subject_id).filter(Boolean))
      );
      const topicIds = Array.from(
        new Set(items.map((c) => c.topic_id).filter(Boolean))
      );

      const subjectPairs = await Promise.all(
        subjectIds.map(async (sid) => {
          try {
            const r = await axiosInstance.get(`/subjects/${sid}`);
            return { id: sid, name: r.data?.name as string };
          } catch {
            return { id: sid, name: `Subject ${sid}` };
          }
        })
      );

      const topicPairs = await Promise.all(
        topicIds.map(async (tid) => {
          try {
            const r = await axiosInstance.get(`/topics/${tid}`);
            return {
              id: tid,
              name: r.data?.name as string,
              subject_id: r.data?.subject_id as number,
            };
          } catch {
            // infer subject_id from first content row
            const fromContent = items.find((c) => c.topic_id === tid);
            return {
              id: tid,
              name: `Topic ${tid}`,
              subject_id: (fromContent?.subject_id as number) || 0,
            };
          }
        })
      );

      const subjectNames: Record<number, string> = {};
      subjectPairs.forEach((s) => (subjectNames[s.id] = s.name));
      const topicNames: Record<number, { name: string; subject_id: number }> =
        {};
      topicPairs.forEach(
        (t) => (topicNames[t.id] = { name: t.name, subject_id: t.subject_id })
      );

      return { courseId, items, subjectNames, topicNames };
    } catch (e: any) {
      return rejectWithValue(e?.message || "Failed to fetch course contents");
    }
  }
);

export const getPresignedDownloadUrl = createAsyncThunk<
  string,
  { objectName: string }
>(
  "courseContents/getPresignedDownloadUrl",
  async ({ objectName }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/course-contents/download-url`, {
        params: { file_name: objectName },
      });
      return res.data?.download_url as string;
    } catch (e: any) {
      return rejectWithValue(e?.message || "Failed to get download URL");
    }
  }
);

export const deleteCourseContent = createAsyncThunk<void, number>(
  "courseContents/deleteById",
  async (contentId: number, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/course-contents/${contentId}`);
    } catch (e: any) {
      return rejectWithValue(e?.message || "Failed to delete course content");
    }
  }
);

export const deleteContentsByTopic = createAsyncThunk<
  void,
  { courseId: number; topicId: number },
  { state: RootState }
>(
  "courseContents/deleteByTopic",
  async ({ courseId, topicId }, { dispatch, rejectWithValue }) => {
    try {
      // Call the new endpoint that removes topic from course and deletes its contents
      await axiosInstance.delete(`/courses/${courseId}/topic/${topicId}`);
    } catch (e: any) {
      return rejectWithValue(e?.message || "Failed to delete topic contents");
    }
  }
);

export const deleteContentsBySubject = createAsyncThunk<
  void,
  { courseId: number; subjectId: number },
  { state: RootState }
>(
  "courseContents/deleteBySubject",
  async ({ courseId, subjectId }, { dispatch, rejectWithValue }) => {
    try {
      // Call the new endpoint that removes subject from course and deletes its contents
      await axiosInstance.delete(`/courses/${courseId}/subject/${subjectId}`);
    } catch (e: any) {
      return rejectWithValue(e?.message || "Failed to delete subject contents");
    }
  }
);

export const addFileContent = createAsyncThunk<
  void,
  {
    courseId: number;
    title: string;
    description?: string;
    subjectId: number;
    topicId: number;
    file: File;
  }
>("courseContents/addFile", async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { file } = payload;
    const { fileUrl } = await uploadToMinio(file);
    await axiosInstance.post("/course-contents", {
      course_id: payload.courseId,
      title: payload.title,
      description: payload.description || "",
      file_type: file.type || "application/octet-stream",
      file_url: fileUrl,
      subject_id: payload.subjectId,
      topic_id: payload.topicId,
    });
    await dispatch(fetchCourseContents(payload.courseId));
  } catch (e: any) {
    return rejectWithValue(e?.message || "Failed to add file content");
  }
});

export const addYouTubeContent = createAsyncThunk<
  void,
  {
    courseId: number;
    title: string;
    description?: string;
    youtubeLink: string;
    subjectId: number;
    topicId: number;
  }
>(
  "courseContents/addYouTube",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      await axiosInstance.post("/course-contents/youtube", {
        course_id: payload.courseId,
        title: payload.title,
        description: payload.description || "",
        youtube_link: payload.youtubeLink,
        subject_id: payload.subjectId,
        topic_id: payload.topicId,
      });
      await dispatch(fetchCourseContents(payload.courseId));
    } catch (e: any) {
      return rejectWithValue(e?.message || "Failed to add youtube content");
    }
  }
);

export const fetchCourseContentsByTopic = createAsyncThunk<
  {
    topicId: number;
    items: CourseContent[];
  },
  { courseId: number; topicId: number }
>(
  "courseContents/fetchByTopic",
  async ({ courseId, topicId }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/course-contents/course/${courseId}/topic/${topicId}`
      );
      const items: CourseContent[] = res.data || [];

      return { topicId, items };
    } catch (e: any) {
      return rejectWithValue(e?.message || "Failed to fetch topic contents");
    }
  }
);

export type CourseContentsState = {
  byCourse: Record<number, CourseContent[]>;
  byTopic: Record<number, CourseContent[]>;
  loading: boolean;
  loadingTopics: Record<number, boolean>;
  subjectNames: Record<number, string>;
  topicNames: Record<number, { name: string; subject_id: number }>;
};

const initialState: CourseContentsState = {
  byCourse: {},
  byTopic: {},
  loading: false,
  loadingTopics: {},
  subjectNames: {},
  topicNames: {},
};

const slice = createSlice({
  name: "courseContents",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseContents.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchCourseContents.fulfilled,
        (
          state,
          action: PayloadAction<{
            courseId: number;
            items: CourseContent[];
            subjectNames: Record<number, string>;
            topicNames: Record<number, { name: string; subject_id: number }>;
          }>
        ) => {
          state.byCourse[action.payload.courseId] = action.payload.items;
          state.subjectNames = {
            ...state.subjectNames,
            ...action.payload.subjectNames,
          };
          state.topicNames = {
            ...state.topicNames,
            ...action.payload.topicNames,
          };
          state.loading = false;
        }
      )
      .addCase(fetchCourseContents.rejected, (state) => {
        state.loading = false;
      })
      .addCase(addFileContent.pending, (state) => {
        state.loading = true;
      })
      .addCase(addFileContent.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addFileContent.rejected, (state) => {
        state.loading = false;
      })
      .addCase(addYouTubeContent.pending, (state) => {
        state.loading = true;
      })
      .addCase(addYouTubeContent.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addYouTubeContent.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchCourseContentsByTopic.pending, (state, action) => {
        state.loadingTopics[action.meta.arg.topicId] = true;
      })
      .addCase(
        fetchCourseContentsByTopic.fulfilled,
        (
          state,
          action: PayloadAction<{
            topicId: number;
            items: CourseContent[];
          }>
        ) => {
          state.byTopic[action.payload.topicId] = action.payload.items;
          state.loadingTopics[action.payload.topicId] = false;
        }
      )
      .addCase(fetchCourseContentsByTopic.rejected, (state, action) => {
        state.loadingTopics[action.meta.arg.topicId] = false;
      });
  },
});

export default slice.reducer;

// Selectors
export const selectCourseContents = (state: RootState, courseId: number) =>
  state.coursesContentsReducer?.byCourse?.[courseId] || [];

export const selectCourseContentsLoading = (state: RootState) =>
  state.coursesContentsReducer?.loading || false;

export const selectCourseContentsByTopic = (
  state: RootState,
  topicId: number
) => state.coursesContentsReducer?.byTopic?.[topicId] || [];

export const selectTopicContentsLoading = (state: RootState, topicId: number) =>
  state.coursesContentsReducer?.loadingTopics?.[topicId] || false;

export const selectSubjectsAndTopicsFromContents = (
  state: RootState,
  courseId: number
): {
  subjects: Array<{ id: number; name: string }>;
  map: Record<number, { topics: Array<{ id: number; name: string }> }>;
} => {
  const items = selectCourseContents(state, courseId);
  const subjectNames = state.coursesContentsReducer.subjectNames || {};
  const topicNames = state.coursesContentsReducer.topicNames || {};
  // Build IDs
  const subjectIds = Array.from(
    new Set(items.map((c) => c.subject_id).filter(Boolean))
  );
  const topicIds = Array.from(
    new Set(items.map((c) => c.topic_id).filter(Boolean))
  );

  const subjects = subjectIds.map((id) => ({
    id,
    name: subjectNames[id] || `Subject ${id}`,
  }));
  const map: Record<number, { topics: Array<{ id: number; name: string }> }> =
    {};
  for (const sid of subjectIds) map[sid] = { topics: [] };
  for (const tid of topicIds) {
    const tn = topicNames[tid];
    const sid =
      tn?.subject_id ?? items.find((c) => c.topic_id === tid)?.subject_id;
    if (!sid) continue;
    if (!map[sid]) map[sid] = { topics: [] };
    if (!map[sid].topics.find((t) => t.id === tid)) {
      map[sid].topics.push({ id: tid, name: tn?.name || `Topic ${tid}` });
    }
  }
  // sort names for readability
  subjects.sort((a, b) => a.name.localeCompare(b.name));
  for (const sid of Object.keys(map)) {
    map[Number(sid)].topics.sort((a, b) => a.name.localeCompare(b.name));
  }
  return { subjects, map };
};
