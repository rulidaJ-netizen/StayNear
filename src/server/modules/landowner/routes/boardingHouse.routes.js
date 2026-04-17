import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import {
  createBoardingHouseDraft,
  uploadBoardingHousePhotos,
} from "../controllers/boardingHouse.controller.js";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "uploads", "boardinghouses");

fs.mkdirSync(uploadDir, { recursive: true });

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
