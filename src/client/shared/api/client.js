import axios from "axios";

const normalizeBaseUrl = (value) =>
  String(value ?? "/api").replace(/\/+$/, "");

const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();

const isMissingVercelApiUrl = () => {
  if (configuredApiUrl || !import.meta.env.PROD || typeof window === "undefined") {
    return false;
  }

  const hostname = String(window.location.hostname || "").toLowerCase();

  return hostname === "vercel.app" || hostname.endsWith(".vercel.app");
};

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

const apiBaseUrl = normalizeBaseUrl(configuredApiUrl || "/api");

if (isMissingVercelApiUrl()) {
  console.error(
    "[api] VITE_API_URL is not configured for this Vercel deployment. " +
      "Requests are falling back to /api, but this project deploys the Express API separately. " +
      "Set VITE_API_URL to your Railway /api URL and redeploy."
  );
}

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
