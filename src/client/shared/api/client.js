import axios from "axios";

const DEFAULT_API_BASE_PATH = "/api";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

const trimTrailingSlashes = (value) => String(value ?? "").replace(/\/+$/, "");
const isProductionBuild = import.meta.env.PROD;
const isBrowser = typeof window !== "undefined";

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
const useSameOriginProxy = isProductionBuild && isBrowser;
export const apiBaseUrl = normalizeApiBaseUrl(
  useSameOriginProxy ? DEFAULT_API_BASE_PATH : sanitizedConfiguredApiUrl
);

const resolveImageBaseUrl = (apiBaseUrl) => {
  const configuredImageBaseUrl = String(
    import.meta.env.VITE_IMAGE_BASE_URL || ""
  ).trim();
  const sanitizedConfiguredImageBaseUrl =
    isProductionBuild && isLocalUrl(configuredImageBaseUrl)
      ? ""
      : configuredImageBaseUrl;

  if (useSameOriginProxy && isBrowser) {
    return window.location.origin;
  }

  if (sanitizedConfiguredImageBaseUrl) {
    if (sanitizedConfiguredImageBaseUrl.startsWith("/") && isBrowser) {
      return window.location.origin;
    }

    return trimTrailingSlashes(sanitizedConfiguredImageBaseUrl);
  }

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    if (isBrowser) {
      return window.location.origin;
    }

    return "";
  }
};

if (useSameOriginProxy) {
  console.info(
    "[api] Using same-origin /api and /uploads routes in this production browser build."
  );
}

if (isProductionBuild && configuredApiUrl && !sanitizedConfiguredApiUrl) {
  console.error(
    `[api] Refusing to rely on a localhost API URL in production: "${configuredApiUrl}". ` +
      "Ignoring it and falling back to /api instead."
  );
}

if (
  useSameOriginProxy &&
  sanitizedConfiguredApiUrl &&
  normalizeApiBaseUrl(sanitizedConfiguredApiUrl) !== DEFAULT_API_BASE_PATH
) {
  console.info(
    `[api] Ignoring the production VITE_API_URL value "${configuredApiUrl}" ` +
      "and using the same-origin /api proxy instead."
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
