import express from "express";
import multer from "multer";
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
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });

router.post("/draft", createBoardingHouseDraft);
router.post("/:id/photos", upload.array("photos", 10), uploadBoardingHousePhotos);

export default router;
