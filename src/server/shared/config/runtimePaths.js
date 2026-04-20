import fs from "fs";
import path from "path";

const resolveConfiguredPath = (value, fallbackPath) =>
  value ? path.resolve(value) : fallbackPath;

export const rootDir = process.cwd();
export const dataDir = resolveConfiguredPath(process.env.DATA_DIR, rootDir);
export const uploadsDir = resolveConfiguredPath(
  process.env.UPLOADS_DIR,
  path.join(dataDir, "uploads")
);
export const storageDir = resolveConfiguredPath(
  process.env.STORAGE_DIR,
  path.join(dataDir, "storage")
);

export const ensureDirectory = (directoryPath) => {
  fs.mkdirSync(directoryPath, { recursive: true });
  return directoryPath;
};

export const resolveUploadsPath = (...segments) =>
  path.join(uploadsDir, ...segments);

export const resolveStoragePath = (...segments) =>
  path.join(storageDir, ...segments);

export const toUploadsUrl = (...segments) => {
  const normalizedSegments = segments
    .filter(Boolean)
    .map((segment) => String(segment).replace(/\\/g, "/").replace(/^\/+/, ""));

  return `/uploads/${normalizedSegments.join("/")}`.replace(/\/+/g, "/");
};

export const resolveUploadUrlPath = (uploadUrl) => {
  const normalizedPath = String(uploadUrl || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  const relativePath = normalizedPath.startsWith("uploads/")
    ? normalizedPath.slice("uploads/".length)
    : normalizedPath;

  return path.join(uploadsDir, relativePath);
};

ensureDirectory(uploadsDir);
ensureDirectory(storageDir);
