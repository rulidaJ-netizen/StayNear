import express from "express";
import multer from "multer";
import path from "path";
import {
  createBoardingHouseDraft,
  uploadBoardingHousePhotos,
} from "../controllers/boardingHouse.controller.js";
import {
  ensureDirectory,
  resolveUploadsPath,
} from "../../../shared/config/runtimePaths.js";

const router = express.Router();
const uploadDir = ensureDirectory(resolveUploadsPath("boardinghouses"));
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureDirectory(uploadDir));
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, safeName);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }

  cb(new Error("Only image files (JPEG, JPG, PNG, WebP) are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 5,
  },
});

const getUploadErrorMessage = (error) => {
  if (!(error instanceof multer.MulterError)) {
    return error?.message || "Failed to upload photos";
  }

  switch (error.code) {
    case "LIMIT_FILE_SIZE":
      return "Each photo must be 20 MB or smaller.";
    case "LIMIT_FILE_COUNT":
      return "You can upload up to 5 photos at a time.";
    case "LIMIT_UNEXPECTED_FILE":
      return "Only the photos field can be used for image uploads.";
    default:
      return error.message || "Failed to upload photos";
  }
};

const handleMulterErrors = (error, _req, res, next) => {
  if (!error) {
    return next();
  }

  return res.status(400).json({ message: getUploadErrorMessage(error) });
};

router.post("/draft", createBoardingHouseDraft);
router.post(
  "/:id/photos",
  upload.array("photos", 5),
  handleMulterErrors,
  uploadBoardingHousePhotos
);

export default router;
