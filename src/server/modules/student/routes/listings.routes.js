import express from "express";
import {
  getPublicListingById,
  getPublicListings,
} from "../controllers/listings.controller.js";

const router = express.Router();

router.get("/", getPublicListings);
router.get("/:id", getPublicListingById);

export default router;
