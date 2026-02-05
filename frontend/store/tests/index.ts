import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axios";

// Enums
export enum ExamType {
  UPSC = "UPSC",
  TNPSC = "TNPSC",
}

export enum TestCategory {
  PRELIMS = "PRELIMS",
  MAINS = "MAINS",
}

export enum TestStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum AttemptStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
  EVALUATED = "EVALUATED",
}

// Types
export interface TestSubCategory {
  id: number;
  name: string;
  description?: string;
  exam_type: ExamType;
  is_active: boolean;
  created_at: string;
  test_count: number;
}

export interface TestQuestionOption {
  id: number;
  option_number: number;
  option_text: string;
  option_image_url?: string;
}

export interface TestQuestion {
  id: number;
  test_id: number;
  question_number: number;
  question_text: string;
  question_image_url?: string;
  correct_option: number;
  marks: number;
  solution?: string;
  solution_image_url?: string;
  options: TestQuestionOption[];
  created_at: string;
}

export interface Test {
  id: number;
  test_name: string;
  description?: string;
  exam_type: ExamType;
  category: TestCategory;
  sub_category_id?: number;
  sub_category_name?: string;
  status: TestStatus;
  duration_minutes?: number;
  total_marks: number;
  passing_marks?: number;
  negative_marking: number;
  start_datetime?: string;
  end_datetime?: string;
  instructions?: string;
  question_file_url?: string;
  question_file_name?: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
  student_ids: number[];
  faculty_ids: number[];
  batch_ids: number[];
  course_ids: number[];
  question_count: number;
}

export interface TestListItem {
  id: number;
  test_name: string;
  exam_type: ExamType;
  category: TestCategory;
  sub_category_name?: string;
  status: TestStatus;
  duration_minutes?: number;
  total_marks: number;
  question_count: number;
  start_datetime?: string;
  end_datetime?: string;
  created_at: string;
  course_ids?: number[];
  batch_ids?: number[];
}

export interface TestAttempt {
  id: number;
  test_id: number;
  student_id: number;
  status: AttemptStatus;
  started_at?: string;
  submitted_at?: string;
  time_taken_seconds?: number;
  answer_file_url?: string;
  answer_file_name?: string;
  total_questions?: number;
  attempted_questions?: number;
  correct_answers?: number;
  wrong_answers?: number;
  score?: number;
  percentage?: number;
  evaluated_by?: number;
  evaluated_at?: string;
  evaluation_remarks?: string;
  created_at: string;
}

export interface StudentWithAttemptStatus {
  student_id: number;
  student_name: string;
  student_email: string;
  student_roll_number: string;
  attempt_status?: AttemptStatus | null;
  attempt_id?: number | null;
  score?: number | null;
  percentage?: number | null;
  submitted_at?: string | null;
  total_questions?: number | null;
  attempted_questions?: number | null;
  correct_answers?: number | null;
  wrong_answers?: number | null;
}

export interface TestAnswer {
  id: number;
  question_id: number;
  selected_option?: number | null;
  is_correct?: boolean | null;
  marks_obtained?: number | null;
  answered_at?: string | null;
}

export interface TestAttemptWithAnswers extends TestAttempt {
  answers: TestAnswer[];
  test_name: string;
}

export interface TestPreview extends Test {
  questions: TestQuestion[];
}

interface TestsState {
  tests: TestListItem[];
  selected: Test | null;
  preview: TestPreview | null;
  subCategories: TestSubCategory[];
  questions: TestQuestion[];
  attempts: TestAttempt[];
  studentsWithStatus: StudentWithAttemptStatus[];
  attemptReview: TestAttemptWithAnswers | null;
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
}

const initialState: TestsState = {
  tests: [],
  selected: null,
  preview: null,
  subCategories: [],
  questions: [],
  attempts: [],
  studentsWithStatus: [],
  attemptReview: null,
  loading: false,
  error: null,
  hasFetched: false,
};

// Async Thunks
export const fetchTests = createAsyncThunk(
  "tests/fetchTests",
  async (params?: {
    exam_type?: ExamType;
    category?: TestCategory;
    sub_category_id?: number;
    status?: TestStatus;
    course_id?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.exam_type) queryParams.append("exam_type", params.exam_type);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.sub_category_id) queryParams.append("sub_category_id", params.sub_category_id.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.course_id) queryParams.append("course_id", params.course_id.toString());

    const url = `/tests${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await axiosInstance.get(url);
    return response.data;
  }
);

export const fetchMyTests = createAsyncThunk(
  "tests/fetchMyTests",
  async (params?: {
    exam_type?: ExamType;
    category?: TestCategory;
    course_id?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.exam_type) queryParams.append("exam_type", params.exam_type);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.course_id) queryParams.append("course_id", params.course_id.toString());

    const url = `/tests/my-tests${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await axiosInstance.get(url);
    return response.data;
  }
);

export const fetchTestById = createAsyncThunk(
  "tests/fetchTestById",
  async (testId: number) => {
    const response = await axiosInstance.get(`/tests/${testId}`);
    return response.data;
  }
);

export const fetchTestPreview = createAsyncThunk(
  "tests/fetchTestPreview",
  async (testId: number) => {
    const response = await axiosInstance.get(`/tests/${testId}/preview`);
    return response.data;
  }
);

export const createTest = createAsyncThunk(
  "tests/createTest",
  async (data: Partial<Test>) => {
    const response = await axiosInstance.post("/tests", data);
    return response.data;
  }
);

export const updateTest = createAsyncThunk(
  "tests/updateTest",
  async ({ id, data }: { id: number; data: Partial<Test> }) => {
    const response = await axiosInstance.put(`/tests/${id}`, data);
    return response.data;
  }
);

export const deleteTest = createAsyncThunk(
  "tests/deleteTest",
  async (testId: number) => {
    await axiosInstance.delete(`/tests/${testId}`);
    return testId;
  }
);

// Sub Categories
export const fetchSubCategories = createAsyncThunk(
  "tests/fetchSubCategories",
  async (exam_type?: ExamType) => {
    const url = exam_type
      ? `/tests/sub-categories?exam_type=${exam_type}`
      : "/tests/sub-categories";
    const response = await axiosInstance.get(url);
    return response.data;
  }
);

export const createSubCategory = createAsyncThunk(
  "tests/createSubCategory",
  async (data: { name: string; description?: string; exam_type: ExamType }) => {
    const response = await axiosInstance.post("/tests/sub-categories", data);
    return response.data;
  }
);

export const deleteSubCategory = createAsyncThunk(
  "tests/deleteSubCategory",
  async (subCatId: number) => {
    await axiosInstance.delete(`/tests/sub-categories/${subCatId}`);
    return subCatId;
  }
);

// Questions
export const fetchQuestions = createAsyncThunk(
  "tests/fetchQuestions",
  async (testId: number) => {
    const response = await axiosInstance.get(`/tests/${testId}/questions`);
    return response.data;
  }
);

export const addQuestion = createAsyncThunk(
  "tests/addQuestion",
  async ({ testId, data }: { testId: number; data: any }) => {
    const response = await axiosInstance.post(`/tests/${testId}/questions`, data);
    return response.data;
  }
);

export const deleteQuestion = createAsyncThunk(
  "tests/deleteQuestion",
  async ({ testId, questionId }: { testId: number; questionId: number }) => {
    await axiosInstance.delete(`/tests/${testId}/questions/${questionId}`);
    return questionId;
  }
);

export const importQuestions = createAsyncThunk(
  "tests/importQuestions",
  async ({ testId, file }: { testId: number; file: File }) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post(
      `/tests/${testId}/questions/import`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }
);

// Attempts
export const fetchTestAttempts = createAsyncThunk(
  "tests/fetchTestAttempts",
  async (testId: number) => {
    const response = await axiosInstance.get(`/tests/${testId}/attempts`);
    return response.data;
  }
);

export const fetchStudentsWithAttemptStatus = createAsyncThunk(
  "tests/fetchStudentsWithAttemptStatus",
  async (testId: number) => {
    const response = await axiosInstance.get(`/tests/${testId}/students-with-status`);
    return response.data;
  }
);

export const fetchAttemptReview = createAsyncThunk(
  "tests/fetchAttemptReview",
  async ({ testId, attemptId }: { testId: number; attemptId: number }) => {
    const response = await axiosInstance.get(`/tests/${testId}/attempts/${attemptId}/review`);
    return response.data;
  }
);

export const startTestAttempt = createAsyncThunk(
  "tests/startTestAttempt",
  async ({ testId, studentId }: { testId: number; studentId: number }) => {
    const response = await axiosInstance.post(
      `/tests/${testId}/start?student_id=${studentId}`
    );
    return response.data;
  }
);

export const submitTestAttempt = createAsyncThunk(
  "tests/submitTestAttempt",
  async ({
    testId,
    attemptId,
    data,
  }: {
    testId: number;
    attemptId: number;
    data: {
      answers: { question_id: number; selected_option: number | null }[];
      answer_file_url?: string;
      answer_file_name?: string;
    };
  }) => {
    const response = await axiosInstance.post(
      `/tests/${testId}/submit/${attemptId}`,
      data
    );
    return response.data;
  }
);

export const evaluateMainsAttempt = createAsyncThunk(
  "tests/evaluateMainsAttempt",
  async ({
    testId,
    attemptId,
    evaluatorId,
    score,
    remarks,
  }: {
    testId: number;
    attemptId: number;
    evaluatorId: number;
    score: number;
    remarks?: string;
  }) => {
    const response = await axiosInstance.post(
      `/tests/${testId}/attempts/${attemptId}/evaluate?evaluator_id=${evaluatorId}`,
      { score, remarks }
    );
    return response.data;
  }
);

// Slice
const testsSlice = createSlice({
  name: "tests",
  initialState,
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
      state.preview = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tests
      .addCase(fetchTests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTests.fulfilled, (state, action) => {
        state.loading = false;
        state.tests = action.payload;
        state.hasFetched = true;
        state.error = null;
      })
      .addCase(fetchTests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch tests";
      })
      // Fetch My Tests
      .addCase(fetchMyTests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyTests.fulfilled, (state, action) => {
        state.loading = false;
        state.tests = action.payload;
        state.hasFetched = true;
        state.error = null;
      })
      .addCase(fetchMyTests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch tests";
      })
      // Fetch Test By ID
      .addCase(fetchTestById.pending, (state) => {
        state.loading = true;
        state.selected = null;
      })
      .addCase(fetchTestById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
        state.error = null;
      })
      .addCase(fetchTestById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch test";
      })
      // Fetch Test Preview
      .addCase(fetchTestPreview.fulfilled, (state, action) => {
        state.preview = action.payload;
      })
      // Create Test
      .addCase(createTest.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTest.fulfilled, (state, action) => {
        state.loading = false;
        state.tests.unshift(action.payload);
        state.error = null;
      })
      .addCase(createTest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create test";
      })
      // Update Test
      .addCase(updateTest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tests.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tests[index] = action.payload;
        }
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
        state.error = null;
      })
      // Delete Test
      .addCase(deleteTest.fulfilled, (state, action) => {
        state.tests = state.tests.filter((t) => t.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
      })
      // Sub Categories
      .addCase(fetchSubCategories.fulfilled, (state, action) => {
        state.subCategories = action.payload;
      })
      .addCase(createSubCategory.fulfilled, (state, action) => {
        state.subCategories.push(action.payload);
      })
      .addCase(deleteSubCategory.fulfilled, (state, action) => {
        state.subCategories = state.subCategories.filter(
          (sc) => sc.id !== action.payload
        );
      })
      // Questions
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.questions = action.payload;
      })
      .addCase(addQuestion.fulfilled, (state, action) => {
        state.questions.push(action.payload);
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.questions = state.questions.filter((q) => q.id !== action.payload);
      })
      // Attempts
      .addCase(fetchTestAttempts.fulfilled, (state, action) => {
        state.attempts = action.payload;
      })
      // Fetch Students with Attempt Status
      .addCase(fetchStudentsWithAttemptStatus.fulfilled, (state, action) => {
        state.studentsWithStatus = action.payload;
      })
      // Fetch Attempt Review
      .addCase(fetchAttemptReview.pending, (state) => {
        state.loading = true;
        state.attemptReview = null;
      })
      .addCase(fetchAttemptReview.fulfilled, (state, action) => {
        state.loading = false;
        state.attemptReview = action.payload;
        state.error = null;
      })
      .addCase(fetchAttemptReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch attempt review";
      });
  },
});

export const { clearSelected, clearError } = testsSlice.actions;
export default testsSlice.reducer;
