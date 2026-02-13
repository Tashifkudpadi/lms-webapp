// lib/axios.ts

import axios from "axios";

// Note: Global error handling is done via store middleware (globalErrorMiddleware)
// which catches all rejected async thunks. Do NOT import store here to avoid
// circular dependency (axios -> store -> reducers -> axios).

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
    // Global error dispatching is handled by store middleware (globalErrorMiddleware)
    // which catches all rejected async thunks automatically
    return Promise.reject(error);
  }
);

export default axiosInstance;
