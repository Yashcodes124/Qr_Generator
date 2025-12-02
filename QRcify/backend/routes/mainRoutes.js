//  updated the imports and routes:

import express from "express";
import fs from "fs/promises";
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
import {
  shortenURL,
  resolveShortURL,
  getUserShortenedURLs,
  getURLStats,
  deleteShortURL,
  toggleURLStatus,
} from "../services/urlShortenerService.js";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Applying rate limiting middleware to all QR generation routes
router.use(
  [
    "/generate",
    "/generate-encryptedText",
    "/encrypt-file",
    "/generate-vcard",
    "/generate-wifi",
    "/batch-generate",
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
    const fileSize = Buffer.from(base64, "base64").length;
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

router.post("/batch-generate", authMiddleware, async (req, res) => {
  const { urls } = req.body;
  const fs = await import("fs/promises");

  console.log("📦 Batch QR request received");
  console.log("   URLs count:", urls ? urls.length : 0);

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({
      error: "URLs array is required",
      example: { urls: ["https://example.com", "https://google.com"] },
    });
  }

  if (urls.length > 100) {
    return res.status(400).json({
      error: "Maximum 100 URLs per batch",
    });
  }

  let tempDir = null;
  let zipPath = null;

  try {
    // Create temporary directory for this batch
    const batchId = Date.now();
    tempDir = path.join(__dirname, `../temp/batch_${batchId}`);
    zipPath = path.join(__dirname, `../temp/qr_codes_${batchId}.zip`);

    console.log(`📂 Batch ID: ${batchId}`);

    // Generate QR codes
    const { generateBatchQRs, createZipFile } = await import(
      "../services/batchService.js"
    );

    const qrFiles = await generateBatchQRs(urls, tempDir);

    if (qrFiles.length === 0) {
      return res.status(400).json({
        error: "No valid URLs to process",
      });
    }

    // Create ZIP file
    await createZipFile(tempDir, zipPath);

    // Verify ZIP file exists and has size
    const stats = await fs.stat(zipPath);
    console.log(`✅ ZIP file verified: ${stats.size} bytes`);

    // Log to database (if you have this function)
    await logQRGeneration("batch", urls.length, req, {
      batchSize: urls.length,
      filesGenerated: qrFiles.length,
    });

    // Send ZIP file with proper headers
    const filename = `qr_codes_batch_${batchId}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", stats.size);

    // Send the file
    const fileStream = await fs.readFile(zipPath);
    res.send(fileStream);

    console.log("✅ ZIP file sent to user");

    // Cleanup after response is sent
    setImmediate(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        await fs.unlink(zipPath);
        console.log("🧹 Cleaned up temporary files");
      } catch (cleanupErr) {
        console.warn("⚠️  Cleanup warning:", cleanupErr.message);
      }
    });
  } catch (error) {
    console.error("❌ Batch generation error:", error);

    // Cleanup on error
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.warn("Cleanup error:", e.message);
      }
    }
    if (zipPath) {
      try {
        await fs.unlink(zipPath);
      } catch (e) {
        console.warn("Cleanup error:", e.message);
      }
    }

    res.status(500).json({
      error: "Failed to generate batch QR codes",
      message: error.message,
    });
  }
});

// POST /api/batch-from-csv
router.post("/batch-from-csv", authMiddleware, async (req, res) => {
  const { csvData } = req.body;
  const fs = await import("fs/promises");

  console.log("📄 CSV batch request received");

  if (!csvData) {
    return res.status(400).json({ error: "CSV data is required" });
  }

  let tempDir = null;
  let zipPath = null;

  try {
    // Parse CSV (simple format: one URL per line)
    const urls = csvData
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line.startsWith("http"));

    console.log(`📄 Parsed ${urls.length} URLs from CSV`);

    if (urls.length === 0) {
      return res.status(400).json({ error: "No valid URLs found in CSV" });
    }

    // Create temporary directory
    const batchId = Date.now();
    tempDir = path.join(__dirname, `../temp/batch_${batchId}`);
    zipPath = path.join(__dirname, `../temp/qr_codes_${batchId}.zip`);

    const { generateBatchQRs, createZipFile } = await import(
      "../services/batchService.js"
    );

    const qrFiles = await generateBatchQRs(urls, tempDir);

    if (qrFiles.length === 0) {
      return res.status(400).json({ error: "No valid URLs to process" });
    }

    await createZipFile(tempDir, zipPath);

    // Verify ZIP file exists and has size
    const stats = await fs.stat(zipPath);
    console.log(`✅ ZIP file verified: ${stats.size} bytes`);

    // Log to database (if you have this function)
    await logQRGeneration("batch_csv", urls.length, req);

    // Send ZIP file with proper headers
    const filename = `qr_codes_batch_${batchId}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", stats.size);

    // Send the file
    const fileStream = await fs.readFile(zipPath);
    res.send(fileStream);

    console.log("✅ ZIP file sent to user");

    // Cleanup after response is sent
    setImmediate(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        await fs.unlink(zipPath);
        console.log("🧹 Cleaned up temporary files");
      } catch (cleanupErr) {
        console.warn("⚠️  Cleanup warning:", cleanupErr.message);
      }
    });
  } catch (error) {
    console.error("❌ CSV batch error:", error);

    // Cleanup on error
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.warn("Cleanup error:", e.message);
      }
    }
    if (zipPath) {
      try {
        await fs.unlink(zipPath);
      } catch (e) {
        console.warn("Cleanup error:", e.message);
      }
    }

    res.status(500).json({
      error: "Failed to process CSV batch",
      message: error.message,
    });
  }
});

router.post("/decrypt", (req, res) => {
  const { cipher, passphrase } = req.body;
  if (!cipher || !passphrase)
    return res.status(400).json({ error: "Missing ciphertext or passphrase" });

  try {
    const decrypted = decryptData(cipher.trim(), passphrase.trim());
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
    console.log(" TXET DECRYTION ERROR:", error);
    return res.status(400).json({
      success: false,
      error: error.message || "Decryption failed",
    });
  }
});

router.post("/decrypt-file", (req, res) => {
  const { encryptedData, passphrase, filename } = req.body;
  if (!encryptedData || !passphrase)
    return res
      .status(400)
      .json({ error: "Missing Encrypted Data or Passphrase" });

  try {
    const decryptedBase64 = decryptData(
      encryptedData.trim(),
      passphrase.trim()
    );
    if (!decryptedBase64) {
      return res.status(400).json({
        success: false,
        error: "Invalid passphrase or corrupted file",
      });
    }
    // 4️⃣ Send Base64 data back to frontend
    const cleanFilename = filename.replace(".enc", "").replace(/_\d+$/, "");
    res.json({
      success: true,
      decryptedBase64,
      suggestedFilename: cleanFilename,
    });
  } catch (error) {
    console.error("File decryption failed at server:", error);
    res.status(500).json({
      success: false,
      error: error.message || "File decryption failed",
    });
  }
});

router.post("/shorten", authMiddleware, async (req, res) => {
  try {
    console.log("🔗 Shortening URL request received");

    const result = await shortenURL(req.body, req);

    res.json({
      success: true,
      data: result,
      message: "URL shortened successfully",
    });
  } catch (error) {
    console.error("❌ URL shortening error:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});
router.get("/urls", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await getUserShortenedURLs(req, limit, offset);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Failed to get URLs:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/urls/:id/stats - Get URL statistics
router.get("/urls/:id/stats", authMiddleware, async (req, res) => {
  try {
    const stats = await getURLStats(parseInt(req.params.id), req);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Failed to get URL stats:", error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE /api/urls/:id - Delete shortened URL
router.delete("/urls/:id", authMiddleware, async (req, res) => {
  try {
    const result = await deleteShortURL(parseInt(req.params.id), req);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Failed to delete URL:", error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// PATCH /api/urls/:id/toggle - Toggle URL active status
router.patch("/urls/:id/toggle", authMiddleware, async (req, res) => {
  try {
    const result = await toggleURLStatus(parseInt(req.params.id), req);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Failed to toggle URL:", error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /s/:shortCode - Redirect to original URL (PUBLIC - NO AUTH NEEDED)
router.get("/s/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;
    console.log(`🔗 Redirect request for: ${shortCode}`);

    const url = await resolveShortURL(shortCode);

    // Redirect to original URL
    res.redirect(301, url.originalURL);
  } catch (error) {
    console.error("❌ Redirect error:", error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/shorten-batch - Shorten multiple URLs for batch QR
router.post("/shorten-batch", authMiddleware, async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        error: "URLs array is required",
      });
    }

    if (urls.length > 100) {
      return res.status(400).json({
        error: "Maximum 100 URLs per batch",
      });
    }

    console.log(`🔗 Shortening batch of ${urls.length} URLs`);

    const shortenedURLs = [];
    const errors = [];

    for (let i = 0; i < urls.length; i++) {
      try {
        const result = await shortenURL({ originalURL: urls[i] }, req);
        shortenedURLs.push(result);
      } catch (error) {
        errors.push({
          url: urls[i],
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      data: {
        shortenedURLs,
        errors,
        total: urls.length,
        successful: shortenedURLs.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error("❌ Batch shortening error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
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
    console.log(`📊 Dashboard stats request from user: ${req.user.userId}`);

    const stats = await getStats(req);

    // ✅ Verify we got data
    if (!stats) {
      return res.status(500).json({
        error: "Failed to fetch stats",
        success: false,
      });
    }

    console.log(`✅ Returning stats:`, stats);

    res.json({
      success: true,
      stats,
      userId: req.user.userId, //Confirming the user
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Dashboard stats error:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard stats",
      success: false,
      message: error.message,
    });
  }
});

export default router;
