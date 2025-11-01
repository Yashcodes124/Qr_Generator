// backend/index.js : main file for backend

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mainRoutes from "./routes/mainRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./config/database.js";
import { config } from "./config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = config.PORT;
// Connecting the  Database
connectDB();

//middleware
app.use(cors());
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

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
