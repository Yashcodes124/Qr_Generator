// backend/index.js : main file for backend

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mainRoutes from "./routes/mainRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./config/database.js";
import { config } from "./config/config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import "dotenv/config";

// const requiredEnvVars = ["JWT_SECRET"];
// const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

// if (missingVars.length > 0) {
//   console.error("❌ FATAL ERROR: Missing required environment variables:");
//   missingVars.forEach((varName) => {
//     console.error(`   - ${varName}`);
//   });
//   console.error("\n💡 Create a .env file with:");
//   console.error("   JWT_SECRET=your_secure_random_string_here\n");
//   process.exit(1);
// }

// console.log("Environment variables validated");
console.log(" Environment Loaded:", process.env.DB_DIALECT, process.env.PORT);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = config.PORT;
connectDB();

// ✅ IMPROVED: Proper CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://your-domain.com"
      : [
          "http://localhost:3000",
          "http://localhost:5173",
          "http://127.0.0.1:3000",
        ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
console.log("✅ CORS configured for:", corsOptions.origin);

// Allow larger JSON payloads for file uploads (up to 50mb)
app.use(express.json({ limit: config.MAX_FILE_SIZE }));
app.use(express.urlencoded({ limit: config.MAX_FILE_SIZE, extended: true }));
// request logging middleware
app.use((req, res, next) => {
  req.clientIp = req.ip || req.connection.remoteAddress;
  next();
});
app.use("/api/auth", authRoutes);
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/encrypted", express.static(path.join(__dirname, "encrypted")));

// Routes
app.use("/api", mainRoutes);
// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dashboard/dashboard.html"));
});
// Catch-all fallback for unknown routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ success: false, error: "Not Found" });
    next(error);
  }
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

















