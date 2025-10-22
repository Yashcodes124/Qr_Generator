// #!/usr/bin/env node
import express from "express";
import qr from "inquirer";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("../frontend"));

// Serve main page
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "../frontend" });
});

// Generate QR from URL
app.post("/generate", (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required for QR generation" });
  }
  try {
    const qrPng = qr.imageSync(url, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");
    // Save URL with a newline
    fs.appendFile("urls.txt", url + "\n", (err) => {
      if (err) console.log("Failed to write URL to file", err);
    });
    res.json({ qrCode: qrBase64 });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// Start server ONCE (outside any route)
app.listen(port, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
