import express from "express";
import multer from "multer";
import path from "path";
import {
  createListing,
  deleteListing,
  getLandownerDashboard,
  getSingleListing,
  toggleAvailability,
  updateListing,
} from "../controllers/listings.controller.js";
import {
  ensureDirectory,
  resolveUploadsPath,
} from "../../../shared/config/runtimePaths.js";

const router = express.Router();
const uploadDir = ensureDirectory(resolveUploadsPath());

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/dashboard/:landownerId", getLandownerDashboard);
router.get("/:id", getSingleListing);
router.post("/", upload.array("photos", 4), createListing);
router.put("/:id", upload.array("photos", 4), updateListing);
router.patch("/:id/availability", toggleAvailability);
router.delete("/:id", deleteListing);

export default router;
