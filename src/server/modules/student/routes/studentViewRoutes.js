import express from "express";
import jwt from "jsonwebtoken";
import { recordRoomView } from "../controllers/propertyViewController.js";

const authenticateStudent = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token required" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.account_type !== "student") {
      return res.status(403).json({ message: "Student access required" });
    }

    req.user = { student_id: decoded.student_id };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const router = express.Router();

router.post("/room/:id/view", authenticateStudent, recordRoomView);

export default router;