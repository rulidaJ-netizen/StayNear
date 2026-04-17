import axios from "axios";

const normalizeBaseUrl = (value) =>
  String(value ?? "/api").replace(/\/+$/, "");

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL || "/api"),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || "";

export default api;