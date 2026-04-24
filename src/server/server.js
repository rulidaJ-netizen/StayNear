import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./shared/prismaClient.js";
import { db } from "./shared/db.js";
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
import studentViewRoutes from "./modules/student/routes/studentViewRoutes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const distDir = path.join(rootDir, "dist");
const defaultDevOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];
const defaultProductionOrigins = ["https://stay-near-ten.vercel.app"];
const defaultProductionOriginPatterns = [/^https:\/\/.*\.vercel\.app$/];
const configuredOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(
  new Set(
    [...defaultDevOrigins, ...defaultProductionOrigins, ...configuredOrigins]
  )
);
const allowedOriginPatterns = defaultProductionOriginPatterns;
const corsOptions =
  allowedOrigins.length > 0 || allowedOriginPatterns.length > 0
    ? {
        origin(origin, callback) {
          if (
            !origin ||
            allowedOrigins.includes(origin) ||
            allowedOriginPatterns.some((pattern) => pattern.test(origin))
          ) {
            callback(null, true);
            return;
          }

          callback(new Error("Origin not allowed by CORS"));
        },
        methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        optionsSuccessStatus: 204,
      }
    : {
        origin(origin, callback) {
          if (!origin) {
            callback(null, true);
            return;
          }

          callback(new Error("Origin not allowed by CORS"));
        },
        methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        optionsSuccessStatus: 204,
      };

const pingMysqlConnection = () =>
  new Promise((resolve, reject) => {
    db.query("SELECT 1", (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/", (_req, res) => {
  res.send("Server is running");
});

app.get("/api/health", async (_req, res) => {
  try {
    await Promise.all([prisma.$queryRaw`SELECT 1`, pingMysqlConnection()]);

    return res.json({
      status: "ok",
      service: "staynear-api",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check error:", error);

    return res.status(503).json({
      status: "error",
      service: "staynear-api",
      database: "unreachable",
    });
  }
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
app.use("/api/student", studentViewRoutes);
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

app.use((error, _req, res, next) => {
  if (error?.message === "Origin not allowed by CORS") {
    return res.status(403).json({ message: error.message });
  }

  return next(error);
});

const PORT = Number(process.env.PORT || 5000);
const DB_KEEP_ALIVE_INTERVAL_MS = Number(
  process.env.DB_KEEP_ALIVE_INTERVAL_MS || 30000
);

async function keepDatabaseAlive() {
  try {
    await Promise.all([prisma.$queryRaw`SELECT 1`, pingMysqlConnection()]);
    console.log("[db] keep-alive ping");
  } catch (error) {
    console.error("[db] keep-alive failed:", error?.message || error);
  }
}

const keepAliveTimer = setInterval(keepDatabaseAlive, DB_KEEP_ALIVE_INTERVAL_MS);

if (typeof keepAliveTimer.unref === "function") {
  keepAliveTimer.unref();
}

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(", ") || "none"}`);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully.`);
  clearInterval(keepAliveTimer);

  await new Promise((resolve) => {
    server.close(() => resolve());
  });

  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Prisma disconnect failed:", error);
  }

  db.end((error) => {
    if (error) {
      console.error("MySQL disconnect failed:", error);
    }

    process.exit(0);
  });
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
