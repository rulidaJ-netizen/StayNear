import axios from "axios";

const normalizeBaseUrl = (value) =>
  String(value ?? "/api").replace(/\/+$/, "");

const resolveImageBaseUrl = (apiBaseUrl) => {
  const configuredImageBaseUrl = String(
    import.meta.env.VITE_IMAGE_BASE_URL || ""
  ).trim();

  if (configuredImageBaseUrl) {
    return configuredImageBaseUrl.replace(/\/+$/, "");
  }

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return "";
  }
};

const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL || "/api");

const api = axios.create({
  baseURL: apiBaseUrl,
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

export const imageBaseUrl = resolveImageBaseUrl(apiBaseUrl);

export default api;
