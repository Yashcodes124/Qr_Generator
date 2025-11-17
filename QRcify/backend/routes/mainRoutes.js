//  updated the imports and routes:

import express from "express";
import fs from "fs";
import path from "path";
import qr from "qr-image";
import { encryptData, decryptData } from "../utils/cryptoUtils.js";
import { logQRGeneration } from "../services/historyService.js";
import qrGenerationLimiter from "../middleware/rateLimit.js";
import { validateUrl, validatePassphrase } from "../utils/validation.js";
import { getStats, getTimeAgo } from "../services/historyService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { fileURLToPath } from "url";
import QRHistory from "../models/QRHistory.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Applying rate limiting middleware to all QR generation routes
router.use(
  [
    "/generate",
    "/generate-encryptedText",
    "/encrypt-file",
    "/generate-vcard",
    "/generate-wifi",
  ],
  authMiddleware,
  qrGenerationLimiter
);

// 1️⃣ Generate QR from URL (Updated)
router.post("/generate", async (req, res) => {
  const { url } = req.body;

  if (!url || !validateUrl(url)) {
    return res.status(400).json({ error: "Valid URL is required" });
  }

  try {
    const qrPng = qr.imageSync(url, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");

    await logQRGeneration("url", url.length, req);

    fs.appendFileSync("urls.txt", url + "\n");
    res.json({ success: true, qrCode: qrBase64 });
  } catch (error) {
    console.error("QR generation failed:", error);
    res.status(500).json({ error: "QR generation failed" });
  }
});

// 🟦 2️⃣ Encrypt text → generate QR
router.post("/generate-encryptedText", async (req, res) => {
  const { secretData, passphrase } = req.body;
  // adding validation
  // Add validation
  if (!secretData || !passphrase || !validatePassphrase(passphrase)) {
    return res
      .status(400)
      .json({ error: "Valid secret data & passphrase required" });
  }
  try {
    const combined = encryptData(secretData, passphrase);
    // Prevent overlong QR payload
    if (combined.length > 1200)
      return res.json({
        success: false,
        error: "Data too large for QR. Please use file download instead.",
      });

    const qrPng = qr.imageSync(combined, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");
    // Adding DB logging
    await logQRGeneration("encrypted_text", secretData.length, req);

    res.json({ success: true, qrCode: qrBase64, encrypted: combined });
  } catch (error) {
    console.error("Text encryption failed at Server.", error);
    res.status(500).json({ error: "Text encryption failed" });
  }
});

router.post("/encrypt-file", async (req, res) => {
  const { base64, passphrase, filename, fileType } = req.body; // ← Add fileType

  if (!base64 || !passphrase || !filename || !validatePassphrase(passphrase)) {
    return res.status(400).json({ error: "Missing required data" });
  }

  //  NEW: Validate file type
  // const allowedTypes = [
  //   "image/jpeg",
  //   "image/png",
  //   "image/gif",
  //   "image/webp",
  //   "image/svg+xml",
  //   "application/pdf",
  //   "application/msword",
  //   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  //   "application/vnd.ms-excel",
  //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //   "application/vnd.ms-powerpoint",
  //   "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  //   "text/plain",
  //   "text/csv",
  //   "application/zip",
  //   "application/x-rar-compressed",
  //   "video/mp4",
  //   "video/quicktime",
  //   "audio/mpeg",
  //   "audio/wav",
  // ];

  // //  NEW: Security check
  // const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
  // const fileSize = Math.ceil((base64.length * 3) / 4); // Base64 to bytes

  // if (fileSize > maxFileSize) {
  //   return res.status(400).json({
  //     error: `File too large. Maximum size is 10MB. Your file is ${(fileSize / 1024 / 1024).toFixed(2)}MB`,
  //   });
  // }

  try {
    const combined = encryptData(base64, passphrase);
    const fileId = Math.floor(100000 + Math.random() * 900000);
    const encryptedDir = path.join(__dirname, "../encrypted");

    if (!fs.existsSync(encryptedDir)) {
      fs.mkdirSync(encryptedDir, { recursive: true });
    }

    const filePath = path.join(encryptedDir, `${filename}_${fileId}.enc`);
    fs.writeFileSync(filePath, combined);

    // ✅ IMPROVED: Dynamic URL based on environment
    const baseUrl =
      process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

    let qrTarget =
      combined.length > 1200
        ? `${baseUrl}/encrypted/${filename}_${fileId}.enc`
        : combined;

    const qrPng = qr.imageSync(qrTarget, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");

    await logQRGeneration("file", base64.length, req);

    res.json({
      success: true,
      qrCode: qrBase64,
      downloadUrl: `/encrypted/${filename}_${fileId}.enc`,
      encrypted: combined,
      fileSize: fileSize,
      message: "Encrypted file saved successfully.",
    });
  } catch (error) {
    console.error("File encryption failed:", error);
    res.status(500).json({ error: "File encryption failed" });
  }
});
router.post("/generate-vcard", async (req, res) => {
  const { name, phone, email, company } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone are required" });
  }

  try {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${phone}
EMAIL:${email}
ORG:${company}
END:VCARD`;

    const qrPng = qr.imageSync(vcard, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");

    await logQRGeneration("vcard", vcard.length, req);

    res.json({ success: true, qrCode: qrBase64 });
  } catch (error) {
    console.error("vCard QR generation failed:", error);
    res
      .status(500)
      .json({ error: "vCard QR generation failed: " + error.message });
  }
});

router.post("/generate-wifi", async (req, res) => {
  const { ssid, password, encryption = "WPA" } = req.body;
  // 🔒 VALIDATION: Network credentials check before passing data
  if (!ssid || !password) {
    return res.status(400).json({
      error: "SSID and password are required for WiFi QR",
    });
  }
  // 📶 WIFI STRING FORMAT (Standard format for mobile devices)
  // Format breakdown:
  // WIFI:    → Protocol identifier
  // S:ssid   → Network name (SSID)
  // T:WPA    → Encryption type (WPA, WEP, nopass)
  // P:pass   → Password
  // ;;       → End of data

  try {
    const wifiString = `WIFI:S:${ssid};T:${encryption};P:${password};;`;
    const qrPng = qr.imageSync(wifiString, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");

    await logQRGeneration("wifi", wifiString.length, req);
    res.json({ success: true, qrCode: qrBase64 });
    console.log("✅ WiFi QR generated successfully");
  } catch (error) {
    console.error("❌ WiFi QR generation failed:", error);
    res
      .status(500)
      .json({ error: "WiFi QR generation failed: " + error.message });
  }
});

router.post("/decrypt", (req, res) => {
  const { cipher, passphrase } = req.body;
  if (!cipher || !passphrase)
    return res.status(400).json({ error: "Missing ciphertext or passphrase" });

  try {
    const decrypted = decryptData(cipher, passphrase);
    if (!decrypted) {
      return res.status(400).json({
        success: false,
        error: "Invalid passphrase or corrupted ciphertext.",
      });
    }
    res.json({
      success: true,
      decrypted: decrypted,
      message: "Decryption successfull.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: err.message || "Decryption failed",
    });
  }
});

router.post("/decrypt-file", (req, res) => {
  const { encryptedData, passphrase, filename } = req.body;
  if (!encryptedData || !passphrase)
    return res.status(400).json({ error: "Missing data" });

  try {
    const decryptedBase64 = decryptData(encryptedData, passphrase);
    if (!decryptedBase64) throw new Error("Decryption failed or wrong key.");
    // 4️⃣ Send Base64 data back to frontend
    const cleanFilename = filename.replace(".enc", "").replace(/_\d+$/, "");
    res.json({
      success: true,
      decryptedBase64: decryptedBase64,
      suggestedFilename: cleanFilename,
    });
  } catch (error) {
    console.error("File decryption failed at server:", error);
    res.status(500).json({ error: "Decryption failed" });
  }
});

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const stats = await getStats(req);
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Stats endpoint error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/qr/history", authMiddleware, async (req, res) => {
  try {
    const history = await QRHistory.findAll({
      where: { userId: req.user.userId },
      order: [["createdAt", "DESC"]],
      limit: 10,
    });
    res.json({
      success: true,
      history: history.map((item) => ({
        id: item.id,
        type: item.type,
        dataSize: item.data_size,
        createdAt: item.createdAt,
        timeAgo: getTimeAgo(item.createdAt),
      })),
    });
  } catch (error) {
    console.error("Failed to get history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.get("/dashboard/stats", authMiddleware, async (req, res) => {
  try {
    //total qrs gen by user
    const stats = await getStats(req);
    res.json({
      success: true,
      stats: {
        totalQRs: stats.totalQRs,
        todayActivity: stats.todayActivity,
        byType: stats.byType,
        popularType: stats.popularType,
        totalScans: stats.totalQRs * 42, // Placeholder
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;
