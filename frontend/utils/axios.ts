// lib/axios.ts

import axios from "axios";
import { store } from "@/store";
import { setGlobalError } from "@/store/globalError";

// Create a base Axios instance
const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:8000", // Change to your backend URL in production
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // set to true if you're using cookies
});

// Automatically attach token from localStorage to every request
axiosInstance.interceptors.request.use(
  (config) => {
    let token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    // Fallback: read from persisted user if token key not set
    if (!token && typeof window !== "undefined") {
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          token = parsed?.access_token || null;
        }
      } catch (_) {
        // ignore JSON parse errors
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Handle global response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can catch token expiration, network errors etc. here
    if (error.response?.status === 401) {
      console.warn("Unauthorized - possibly invalid token");
    }
    try {
      const res = error.response;
      const cfg = error.config || {};
      const url = (cfg?.baseURL || "") + (cfg?.url || "");
      const method = (cfg?.method || "GET").toString().toUpperCase();
      const status = res?.status;
      const statusText = res?.statusText;
      const data = res?.data;

      const backendDetail =
        (typeof data?.detail === "string" && data.detail) ||
        (Array.isArray(data?.detail) && "Validation error(s)") ||
        data?.message ||
        error.message ||
        "Network error";

      // Only keep JSON-serializable primitives / plain objects in Redux
      const safeData =
        data && typeof data === "object"
          ? {
              // commonly useful fields from typical FastAPI/DRF error shapes
              detail: data.detail ?? undefined,
              message: data.message ?? undefined,
            }
          : data;

      const payload = {
        message: backendDetail,
        detail: {
          status,
          statusText,
          method,
          url,
          data: safeData,
        },
      } as const;

      store.dispatch(setGlobalError(payload));
    } catch (_) {
      // noop if store is not available for any reason
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
