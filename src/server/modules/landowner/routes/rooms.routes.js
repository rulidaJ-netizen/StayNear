import express from "express";
import multer from "multer";
import { createRoom, uploadRoomPhotos } from "../controllers/room.controller.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post("/", createRoom);
router.post("/:propertyId/photos", upload.array("photos"), uploadRoomPhotos);

export default router;
