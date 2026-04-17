import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import {
  getLandownerFavorites,
  getLandownerProfile,
  updateLandownerProfile,
  uploadLandownerAvatar,
} from "../controllers/profile.controller.js";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "uploads", "avatars", "landowners");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeFilename = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;
    cb(null, safeFilename);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Only image files are allowed"));
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/favorites", getLandownerFavorites);
router.get("/", getLandownerProfile);
router.put("/update", updateLandownerProfile);
router.post("/upload-avatar", (req, res) => {
  upload.single("avatar")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return uploadLandownerAvatar(req, res);
  });
});

router.get("/:id", getLandownerProfile);
router.put("/:id", updateLandownerProfile);

export default router;
