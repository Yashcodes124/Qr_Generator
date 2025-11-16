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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = config.PORT;

// ✅ PROPER JWT_SECRET VALIDATION
if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET === "your_jwt_secret_here"
) {
  console.warn("⚠️  WARNING: Using default JWT_SECRET for development");
  console.warn("💡 For production, set a secure JWT_SECRET in .env file");
  process.env.JWT_SECRET = "qrcify_dev_jwt_secret_2025_" + Date.now();
} else {
  console.log("✅ JWT_SECRET configured");
}

// ✅ IMPROVED CORS Configuration
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
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
console.log("✅ CORS configured");

// Middleware
app.use(express.json({ limit: config.MAX_FILE_SIZE }));
app.use(express.urlencoded({ limit: config.MAX_FILE_SIZE, extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  req.clientIp = req.ip || req.connection.remoteAddress;
  next();
});

// Static files
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/dashboard", express.static(path.join(__dirname, "../dashboard")));
app.use("/encrypted", express.static(path.join(__dirname, "encrypted")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", mainRoutes);

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Serve dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../dashboard/dashboard.html"));
});


// Error handler
app.use(errorHandler);

// ✅ PROPER DATABASE CONNECTION WITH ERROR HANDLING
async function startServer() {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
      console.log(
        `📊 Dashboard: http://localhost:${port}/dashboard/dashboard.html`
      );
      console.log(`🔐 API: http://localhost:${port}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
