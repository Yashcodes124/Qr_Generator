//  updated the imports and routes:

import express from "express";
import fs from "fs";
import path from "path";
import qr from "qr-image";
import { encryptData, decryptData } from "../utils/cryptoUtils.js";
import { logQRGeneration } from "../services/historyService.js";
import qrGenerationLimiter from "../middleware/rateLimit.js";
import { validateUrl, validatePassphrase } from "../utils/validation.js";
import { getStats } from "../services/historyService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();
import { fileURLToPath } from "url";
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

    // Log to database
    // await logQRGeneration("url", url.length, req);

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

// 🟨 3️⃣ Encrypt file
router.post("/encrypt-file", async (req, res) => {
  const { base64, passphrase, filename } = req.body;
  if (!base64 || !passphrase || !filename || !validatePassphrase(passphrase))
    return res.status(400).json({ error: "Missing required data" });

  try {
    const combined = encryptData(base64, passphrase);

    const fileId = Math.floor(100000 + Math.random() * 900000);
    const encryptedDir = path.join(__dirname, "../encrypted");
    if (!fs.existsSync(encryptedDir))
      fs.mkdirSync(encryptedDir, { recursive: true });

    const filePath = path.join(encryptedDir, `${filename}_${fileId}.enc`);
    fs.writeFileSync(filePath, combined);

    // If too large for QR, send QR with download link
    let qrTarget =
      combined.length > 1200 //if file is large send this downladable link
        ? `http://localhost:3000/encrypted/${filename}_${fileId}.enc`
        : combined; //else send the normal encryted one for QR
    //   QR generation for both bases
    const qrPng = qr.imageSync(qrTarget, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");

    // Adding DB logging
    await logQRGeneration("encrypted_file", base64.length, req);

    // 6️⃣ Send response
    res.json({
      success: true,
      qrCode: qrBase64,
      downloadUrl: `/encrypted/${filename}_${fileId}.enc`,
      encrypted: combined, // important!
      message: "Encrypted file saved successfully.",
    });
  } catch (error) {
    console.error("File encryption failed at server:", error);
    res.status(500).json({ error: "File encryption failed" });
  }
});
// 🆕 Generate QR with different types
router.post("/generate-vcard", (req, res) => {
  const { name, phone, email, company } = req.body;

  if (!name || !phone) {
    console.log("❌ vCard missing name or phone");
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

    // Generate QR from vcard string
    const qrPng = qr.imageSync(vcard, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");

    res.json({ success: true, qrCode: qrBase64 });
    console.log("✅ vCard QR generated successfully");
  } catch (error) {
    console.error("❌ vCard QR generation failed:", error);
    res
      .status(500)
      .json({ error: "vCard QR generation failed: " + error.message });
  }
});

// 🆕 WiFi QR Code
router.post("/generate-wifi", (req, res) => {
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

    res.json({ success: true, qrCode: qrBase64 });
    console.log("✅ WiFi QR generated successfully");
  } catch (error) {
    console.error("❌ WiFi QR generation failed:", error);
    res
      .status(500)
      .json({ error: "WiFi QR generation failed: " + error.message });
  }
});

// 🟥 4️⃣ Decrypt text
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
    console.error("Decryption failed at server:", error);
    res.status(500).json({ error: "Invalid passphrase or corrupted text" });
  }
});

// 🟪 5️⃣ Decrypt file
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

router.get("/stats",authMiddleware , async (req, res) => {
  try {
    const stats = await getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
