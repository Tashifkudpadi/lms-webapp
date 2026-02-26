import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axios";

export interface ZoomClass {
  id: number;
  name: string;
  course_id: number;
  subject_id: number | null;
  faculty_id: number | null;
  class_date: string;
  start_time: string;
  end_time: string;
  zoom_url: string;
  subject_name: string | null;
  faculty_name: string | null;
  course_name: string | null;
  created_at: string;
}

interface ZoomClassState {
  list: ZoomClass[];
  error: string;
}

const initialState: ZoomClassState = {
  list: [],
  error: "",
};

const zoomClassSlice = createSlice({
  name: "zoomClasses",
  initialState,
  reducers: {
    setZoomClasses(state, action) {
      state.list = action.payload;
      state.error = "";
    },
    hasError(state, action) {
      state.error = action.payload;
    },
  },
});

export const addZoomClass = createAsyncThunk(
  "zoomClasses/addZoomClass",
  async (
    data: {
      name: string;
      course_id: number;
      subject_id: number | null;
      faculty_id: number | null;
      class_date: string;
      start_time: string;
      end_time: string;
      zoom_url: string;
    },
    { dispatch }
  ) => {
    try {
      const response = await axiosInstance.post("/zoom-classes", data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error.response?.data?.detail?.map((e: any) => e.msg).join(", ") ||
            "Failed to add class";
      dispatch(hasError(errorMessage));
      throw error;
    }
  }
);

export const deleteZoomClass = createAsyncThunk(
  "zoomClasses/deleteZoomClass",
  async (classId: number, { dispatch }) => {
    try {
      await axiosInstance.delete(`/zoom-classes/${classId}`);
    } catch (error: any) {
      const errorMessage =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "Failed to delete class";
      dispatch(hasError(errorMessage));
      throw error;
    }
  }
);

export const { setZoomClasses, hasError } = zoomClassSlice.actions;
export default zoomClassSlice.reducer;
