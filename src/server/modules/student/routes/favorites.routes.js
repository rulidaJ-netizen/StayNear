import express from "express";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "../controllers/favorites.controller.js";

const router = express.Router();

router.get("/:student_id", getFavorites);
router.post("/", addFavorite);
router.delete("/:student_id/:boardinghouse_id", removeFavorite);

export default router;
