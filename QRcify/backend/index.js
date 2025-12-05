import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mainRoutes from "./routes/mainRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./config/database.js";
import { config } from "./config/config.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = config.PORT || 3000;

// ==================== CONFIGURATION ====================

// JWT Secret validation
if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET === "your_jwt_secret_here"
) {
  console.warn("⚠️  WARNING: Using default JWT_SECRET for development");
  console.warn("🔐 For production, set a secure JWT_SECRET in .env file");
  process.env.JWT_SECRET = "qrcify_dev_jwt_secret_2025_" + Date.now();
} else {
  console.log("✅ JWT_SECRET configured");
}

// CORS Configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "*"
      : [
          "http://localhost:3000",
          "http://localhost:5173",
          "http://127.0.0.1:3000",
        ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
console.log("✅ CORS configured");

// ==================== MIDDLEWARE ====================

// Body parsers
app.use(express.json({ limit: config.MAX_FILE_SIZE || "50mb" }));
app.use(
  express.urlencoded({ limit: config.MAX_FILE_SIZE || "50mb", extended: true })
);

// Request logging
app.use((req, res, next) => {
  req.clientIp = req.ip || req.connection.remoteAddress;
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ==================== STATIC FILES ====================

app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/dashboard", express.static(path.join(__dirname, "../dashboard")));
app.use("/encrypted", express.static(path.join(__dirname, "encrypted")));

// ==================== API ROUTES ====================

app.use("/api/auth", authRoutes);
app.use("/api", mainRoutes);

// ==================== FRONTEND ROUTES ====================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../dashboard/dashboard.html"));
});

// ==================== ERROR HANDLING ====================

app.use(errorHandler);

// ==================== SERVER START ====================

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log("✅ Database connected");

    // Start listening
    app.listen(port, () => {
      console.log("\n");
      console.log("╔════════════════════════════════════════╗");
      console.log("║    🚀 QRcify Pro - Server Running      ║");
      console.log("╚════════════════════════════════════════╝\n");
      console.log(`📍 Main App:     http://localhost:${port}`);
      console.log(`📊 Dashboard:    http://localhost:${port}/dashboard`);
      console.log(`🔌 API Base:     http://localhost:${port}/api`);
      console.log(`🔐 Auth:         http://localhost:${port}/api/auth\n`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Max File Size: ${config.MAX_FILE_SIZE}`);
      console.log("\n✅ Ready to accept requests...\n");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("⚠️  SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();
