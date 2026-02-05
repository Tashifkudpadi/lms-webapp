import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axios";

interface Subject {
  id: number;
  name: string;
  code: string;
  faculty_ids: number[];
}

interface SubjectState {
  subjects: Subject[];
  error: string;
  hasFetched: boolean;
}

const initialState: SubjectState = {
  subjects: [],
  error: "",
  hasFetched: false,
};

const subjectSlice = createSlice({
  name: "subjects",
  initialState,
  reducers: {
    setSubjects(state, action) {
      state.subjects = action.payload;
      state.error = "";
      state.hasFetched = true;
    },
    hasError(state, action) {
      state.error = action.payload;
    },
  },
});

export const fetchSubjects = createAsyncThunk(
  "subjects/fetchSubjects",
  async (_, { dispatch }) => {
    try {
      const response = await axiosInstance.get("/subjects");
      dispatch(setSubjects(response.data));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to fetch subjects";
      dispatch(hasError(errorMessage));
    }
  }
);

export const addSubject = createAsyncThunk(
  "subjects/addSubject",
  async (
    subjectData: { name: string; code: string; faculty_ids: number[] },
    { dispatch }
  ) => {
    try {
      const response = await axiosInstance.post("/subjects", subjectData);
      dispatch(fetchSubjects());
      return response.data;
    } catch (error: any) {
      const errorMessage =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error.response?.data?.detail?.map((e: any) => e.msg).join(", ") ||
            "Failed to add subject";
      dispatch(hasError(errorMessage));
      throw error;
    }
  }
);

export const updateSubject = createAsyncThunk(
  "subjects/updateSubject",
  async (
    {
      subjectId,
      subjectData,
    }: {
      subjectId: number;
      subjectData: { name?: string; code?: string; faculty_ids?: number[] };
    },
    { dispatch }
  ) => {
    try {
      const response = await axiosInstance.put(
        `/subjects/${subjectId}`,
        subjectData
      );
      dispatch(fetchSubjects());
      return response.data;
    } catch (error: any) {
      const errorMessage =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error.response?.data?.detail?.map((e: any) => e.msg).join(", ") ||
            "Failed to update subject";
      dispatch(hasError(errorMessage));
      throw error;
    }
  }
);

export const deleteSubject = createAsyncThunk(
  "subjects/deleteSubject",
  async (subjectId: number, { dispatch }) => {
    try {
      await axiosInstance.delete(`/subjects/${subjectId}`);
      dispatch(fetchSubjects());
    } catch (error: any) {
      const errorMessage =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error.response?.data?.detail?.map((e: any) => e.msg).join(", ") ||
            "Failed to delete subject";
      dispatch(hasError(errorMessage));
      throw error;
    }
  }
);

export const { setSubjects, hasError } = subjectSlice.actions;
export default subjectSlice.reducer;
