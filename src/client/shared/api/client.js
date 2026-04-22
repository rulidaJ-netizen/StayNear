import axios from "axios";

const DEFAULT_API_BASE_PATH = "/api";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

const trimTrailingSlashes = (value) => String(value ?? "").replace(/\/+$/, "");
const isProductionBuild = import.meta.env.PROD;

const isLocalUrl = (value) => {
  try {
    const url = new URL(String(value || "").trim());
    return LOCAL_HOSTNAMES.has(String(url.hostname || "").toLowerCase());
  } catch {
    return false;
  }
};

const normalizeApiBaseUrl = (value) => {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return DEFAULT_API_BASE_PATH;
  }

  if (rawValue.startsWith("/")) {
    return trimTrailingSlashes(rawValue || DEFAULT_API_BASE_PATH);
  }

  try {
    const url = new URL(rawValue);

    if (!url.pathname || url.pathname === "/") {
      url.pathname = DEFAULT_API_BASE_PATH;
    }

    return trimTrailingSlashes(url.toString());
  } catch {
    return trimTrailingSlashes(rawValue);
  }
};

const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();
const sanitizedConfiguredApiUrl =
  isProductionBuild && isLocalUrl(configuredApiUrl) ? "" : configuredApiUrl;
const apiBaseUrl = normalizeApiBaseUrl(sanitizedConfiguredApiUrl);

const isMissingVercelApiUrl = () => {
  if (sanitizedConfiguredApiUrl || !isProductionBuild || typeof window === "undefined") {
    return false;
  }

  const hostname = String(window.location.hostname || "").toLowerCase();

  return hostname === "vercel.app" || hostname.endsWith(".vercel.app");
};

const resolveImageBaseUrl = (apiBaseUrl) => {
  const configuredImageBaseUrl = String(
    import.meta.env.VITE_IMAGE_BASE_URL || ""
  ).trim();
  const sanitizedConfiguredImageBaseUrl =
    isProductionBuild && isLocalUrl(configuredImageBaseUrl)
      ? ""
      : configuredImageBaseUrl;

  if (sanitizedConfiguredImageBaseUrl) {
    return trimTrailingSlashes(sanitizedConfiguredImageBaseUrl);
  }

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }

    return "";
  }
};

if (isMissingVercelApiUrl()) {
  console.error(
    "[api] VITE_API_URL is not configured for this Vercel deployment. " +
      "Requests are falling back to /api. " +
      "If Vercel is not proxying /api to Railway, set VITE_API_URL to your Railway backend origin and redeploy."
  );
}

if (isProductionBuild && configuredApiUrl && !sanitizedConfiguredApiUrl) {
  console.error(
    `[api] Refusing to rely on a localhost API URL in production: "${configuredApiUrl}". ` +
      "Ignoring it and falling back to /api instead."
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
