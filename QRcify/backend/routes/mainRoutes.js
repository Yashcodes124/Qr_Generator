import express from "express";
import fs from "fs";
import path from "path";
import qr from "qr-image";
import { encryptData, decryptData } from "../utils/cryptoUtils.js";
import { error } from "console";

const router = express.Router();
const __dirname = path.resolve();

// 🟩 1️⃣ Generate QR from URL
router.post("/generate", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const qrPng = qr.imageSync(url, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");
    fs.appendFileSync("urls.txt", url + "\n");
    res.json({ success: true, qrCode: qrBase64 });
  } catch (error) {
    console.error("QR generation failed at server.", error);
    res.status(500).json({ error: "QR generation failed" });
  }
});

// 🟦 2️⃣ Encrypt text → generate QR
router.post("/generate-encryptedText", (req, res) => {
  const { secretData, passphrase } = req.body;
  if (!secretData || !passphrase)
    return res.status(400).json({ error: "Secret data & passphrase required" });

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

    res.json({ success: true, qrCode: qrBase64, encrypted: combined });
  } catch (error) {
    console.error("Text encryption failed at Server.", error);
    res.status(500).json({ error: "Text encryption failed" });
  }
});

// 🟨 3️⃣ Encrypt file
router.post("/encrypt-file", (req, res) => {
  const { base64, passphrase, filename } = req.body;
  if (!base64 || !passphrase || !filename)
    return res.status(400).json({ error: "Missing required data" });

  try {
    const combined = encryptData(base64, passphrase);

    const fileId = Math.floor(100000 + Math.random() * 900000);
    const encryptedDir = path.join(__dirname, "encrypted");
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
    // 6️⃣ Send response
    res.json({
      success: true,
      qrCode: qrBase64,
      downloadUrl: `/encrypted/${filename}_${fileId}.enc`,
      encrypted: combined, // important!
      message,
    });
  } catch (error) {
    console.error("File encryption failed at server:", error);
    res.status(500).json({ error: "File encryption failed" });
  }
});

// 🟥 4️⃣ Decrypt text
router.post("/decrypt", (req, res) => {
  const { cipher, passphrase } = req.body;
  if (!cipher || !passphrase)
    return res.status(400).json({ error: "Missing ciphertext or passphrase" });

  try {
    const decrypted = decryptData(cipher, passphrase);
    if (decrypted) {
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
      decryptedBase64,
      suggestedFilename: cleanFilename,
    });
  } catch (error) {
    console.error("File decryption failed at server:", error);
    res.status(500).json({ error: "Decryption failed" });
  }
});

export default router;
