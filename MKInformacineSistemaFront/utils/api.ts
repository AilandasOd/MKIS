// MKInformacineSistemaFront/utils/api.ts
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Token dynamically before requests
api.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem("accessToken");

  // bypass headers for login-related requests
  if (config.url?.includes("/login") || config.url?.includes("/signup")) {
    return config;
  }

  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return config;
});

// Redirect on 401 (Unauthorized) or 403 (Forbidden)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const requestUrl = error.config.url;

      // Handle 401 Unauthorized (EXCEPT login)
      if (status === 401 && !requestUrl?.includes("/login")) {
        console.warn("Unauthorized! Logging out...");

        // Clear token
        sessionStorage.removeItem("accessToken");
        
        // Redirect to login
        window.location.href = "/auth/login";
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.warn("Forbidden! Access denied...");
        window.location.href = "/auth/access"; // Forbidden page
      }
    }

    return Promise.reject(error);
  }
);

export default api;