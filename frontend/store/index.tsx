import { AnyAction, configureStore, Middleware } from "@reduxjs/toolkit";
import StudentsReducer from "./students";
import BatchesReducer from "./batches";
import FacultyReducer from "./faculties";
import SubjectsReducer from "./subjects";
import AuthReducer from "./auth";
import UserReducer from "./users";
import CoursesReducer from "./courses";
import GlobalErrorReducer, { setGlobalError } from "./globalError";
import CourseContentsReducer from "./courseContents";
import TopicsReducer from "./topics";
import TestsReducer from "./tests";

// Middleware to catch all rejected async thunks and surface as global error
const globalErrorMiddleware: Middleware = (api) => (next) => (action: unknown) => {
  const type = (action as any)?.type as string | undefined;
  if (typeof type === "string" && type.endsWith("/rejected")) {
    const payload = (action as any)?.payload;
    const error = (action as any)?.error;
    const meta = (action as any)?.meta;
    const payloadMessage =
      (typeof payload === "string" && payload) ||
      payload?.message ||
      error?.message ||
      "Something went wrong";
    next(action as any);
    api.dispatch(
      setGlobalError({
        message: payloadMessage,
        detail: {
          actionType: type,
          payload,
          error,
          meta,
        },
      })
    );
    return;
  }
  return next(action as any);
};

export const store = configureStore({
  reducer: {
    authReducer: AuthReducer,
    userReducer: UserReducer,
    coursesReducer: CoursesReducer,
    coursesContentsReducer: CourseContentsReducer,
    topicsReducer: TopicsReducer,
    studentsReducer: StudentsReducer,
    batchesReducer: BatchesReducer,
    facultyReducer: FacultyReducer,
    subjectsReducer: SubjectsReducer,
    globalErrorReducer: GlobalErrorReducer,
    testsReducer: TestsReducer,
  },
  middleware: (getDefault) => getDefault().concat(globalErrorMiddleware as any),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
