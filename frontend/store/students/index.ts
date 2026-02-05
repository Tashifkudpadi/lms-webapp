import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axios";

interface Student {
  id: number;
  name: string;
  email: string;
  roll_number: string;
  mobile_number: number;
  enrollment_date: string;
}

interface StudentState {
  students: Student[];
  error: string;
}

const initialState: StudentState = {
  students: [],
  error: "",
};

const studentSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    setStudents(state, action) {
      state.students = action.payload;
      state.error = "";
    },
    hasError(state, action) {
      state.error = action.payload;
    },
    clearStudentError(state) {
      state.error = "";
    },
  },
});

export const fetchStudents = createAsyncThunk(
  "students/fetchStudents",
  async (_, { dispatch }) => {
    try {
      const response = await axiosInstance.get("/students");
      dispatch(setStudents(response.data));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to fetch students";
      dispatch(hasError(errorMessage));
      throw error;
    }
  }
);

export const addStudent = createAsyncThunk(
  "students/addStudent",
  async (
    studentData: {
      name: string;
      email: string;
      roll_number: string;
      mobile_number: number;
      enrollment_date: string;
    },
    { dispatch }
  ) => {
    try {
      const response = await axiosInstance.post("/students", studentData);
      dispatch(fetchStudents());
      return response.data;
    } catch (error: any) {
      const errorMessage =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error.response?.data?.detail?.map((e: any) => e.msg).join(", ") ||
            "Failed to add student";
      dispatch(hasError(errorMessage));
      throw error;
    }
  }
);

export const updateStudent = createAsyncThunk(
  "students/updateStudent",
  async (
    {
      studentId,
      studentData,
    }: {
      studentId: number;
      studentData: {
        name?: string;
        email?: string;
        roll_number?: string;
        mobile_number?: string;
        enrollment_date?: string;
      };
    },
    { dispatch }
  ) => {
    try {
      const response = await axiosInstance.put(
        `/students/${studentId}`,
        studentData
      );
      dispatch(fetchStudents());
      return response.data;
    } catch (error: any) {
      const errorMessage =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error.response?.data?.detail?.map((e: any) => e.msg).join(", ") ||
            "Failed to update student";
      dispatch(hasError(errorMessage));
      throw error;
    }
  }
);

export const deleteStudent = createAsyncThunk(
  "students/deleteStudent",
  async (studentId: number, { dispatch }) => {
    try {
      await axiosInstance.delete(`/students/${studentId}`);
      dispatch(fetchStudents());
    } catch (error: any) {
      const errorMessage =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error.response?.data?.detail?.map((e: any) => e.msg).join(", ") ||
            "Failed to delete student";
      dispatch(hasError(errorMessage));
      throw error;
    }
  }
);

export const { setStudents, hasError, clearStudentError } =
  studentSlice.actions;
export default studentSlice.reducer;
