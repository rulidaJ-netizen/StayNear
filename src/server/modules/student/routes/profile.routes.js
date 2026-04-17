import express from "express";
import {
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/profile.controller.js";

const router = express.Router();

router.get("/:id", getStudentProfile);
router.put("/:id", updateStudentProfile);

export default router;
