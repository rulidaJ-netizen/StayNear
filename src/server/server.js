import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./shared/prismaClient.js";
import authRoutes from "./modules/auth/auth.routes.js";
import landownerBoardingHouseRoutes from "./modules/landowner/routes/boardingHouse.routes.js";
import landownerListingsRoutes from "./modules/landowner/routes/listings.routes.js";
import landownerProfileRoutes from "./modules/landowner/routes/profile.routes.js";
import roomRoutes from "./modules/landowner/routes/rooms.routes.js";
import favoritesRoutes from "./modules/student/routes/favorites.routes.js";
import studentListingsRoutes from "./modules/student/routes/listings.routes.js";
import studentProfileRoutes from "./modules/student/routes/profile.routes.js";
import studentUserRoutes from "./modules/student/routes/user.routes.js";
import { uploadsDir } from "./shared/config/runtimePaths.js";
import studentViewRoutes from "./modules/student/routes/studentViewRoutes.js"; // ✅ ADDED

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const distDir = path.join(rootDir, "dist");
const allowedOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOptions =
  allowedOrigins.length > 0
    ? {
        origin(origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
          }

          callback(new Error("Origin not allowed by CORS"));
        },
      }
    : undefined;

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/", (_req, res) => {
  res.send("Server is running");
});

app.get("/accounts", async (_req, res) => {
  try {
    const accounts = await prisma.account.findMany();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/students", async (_req, res) => {
  try {
    const students = await prisma.student.findMany();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/student/profile", studentProfileRoutes);
app.use("/api/student/favorites", favoritesRoutes);
app.use("/api/student/boarding-houses", studentListingsRoutes);
app.use("/api/student", studentViewRoutes); // ✅ ADDED – mounts the new route under /api/student
app.use("/api/user", studentUserRoutes);
app.use("/api/landowner/profile", landownerProfileRoutes);
app.use("/api/landowner/boarding-houses", landownerBoardingHouseRoutes);
app.use("/api/landowner/boarding-houses", landownerListingsRoutes);
app.use("/api/landowner/rooms", roomRoutes);

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    return res.sendFile(path.join(distDir, "index.html"));
  });
}

const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
