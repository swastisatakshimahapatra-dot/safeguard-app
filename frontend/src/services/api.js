import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// ✅ Auto attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("safeguard_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ FIX - Don't redirect on 401 for login/register routes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";

      // ✅ Only redirect if NOT on auth routes
      if (
        !url.includes("/auth/login") &&
        !url.includes("/auth/register") &&
        !url.includes("/auth/verify")
      ) {
        localStorage.removeItem("safeguard_token");
        localStorage.removeItem("safeguard_user");
        window.location.href = "/login";
      }
    }
    // ✅ Always reject so catch() works
    return Promise.reject(error);
  },
);

export default api;
