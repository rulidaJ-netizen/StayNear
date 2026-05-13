import app from "../src/server/server.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const normalizePathParts = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizePathParts(item));
  }

  return String(value || "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
};

const buildForwardPath = (target, pathValue, query) => {
  const normalizedPath = normalizePathParts(pathValue).join("/");
  const basePath = target === "uploads" ? "uploads" : "api";
  const searchParams = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (key === "path" || key === "target" || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();
  const pathname = normalizedPath ? `/${basePath}/${normalizedPath}` : `/${basePath}`;

  return `${pathname}${queryString ? `?${queryString}` : ""}`;
};

export default async function handler(req, res) {
  req.url = buildForwardPath(req.query?.target, req.query?.path, req.query);
  req.originalUrl = req.url;

  return app(req, res);
}
