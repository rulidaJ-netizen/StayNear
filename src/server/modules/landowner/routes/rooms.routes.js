import express from "express";
import multer from "multer";
import { createRoom, uploadRoomPhotos } from "../controllers/room.controller.js";
import {
  ensureDirectory,
  resolveUploadsPath,
} from "../../../shared/config/runtimePaths.js";

const router = express.Router();
const uploadDir = ensureDirectory(resolveUploadsPath());

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post("/", createRoom);
router.post("/:propertyId/photos", upload.array("photos"), uploadRoomPhotos);

export default router;
