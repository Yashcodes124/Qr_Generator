import express from "express";
import qr from "qr-image";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import CryptoJS from "crypto-js";

// By adding PBKDF2 + Salt, you’ll:
// Generate a random salt (unique per encryption).
// Derive a secure 256-bit key from the passphrase + salt using PBKDF2
// Use that key + a random IV (initialization vector) to run AES encryption
// Bundle the salt + IV + ciphertext together for decryption later.

// crypto.randomBytes(16); // Generate a random salt

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/encrypted", express.static(path.join(__dirname, "encrypted")));

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
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

    fs.appendFile("urls.txt", url + "\n", (err) => {
      if (err) console.log("Failed to write URL to file", err);
    });

    res.json({ success: true, qrCode: qrBase64 });
  } catch (err) {
    console.error("Error generating QR:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate QR code" });
  }
});

//Encrypt and create Qr
// API: Generate encrypted QR
app.post("/api/generate-encryptedText", (req, res) => {
  const { secretData, passphrase } = req.body;
  if (!secretData || !passphrase)
    return res
      .status(400)
      .json({ error: "Secret data and passphrase required" });

  try {
    // Encrypt with AES : aes is a algorithm used to secure e-data  by converting it into an unreadable format
    //it encryps data breaking it into 128 bit blocks using a key of 128,256 bits for substitutes  and shuffing through  multiple rounds and uses  the same key for both encryption and decryption.
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    // Derive key
    const key = CryptoJS.PBKDF2(passphrase, salt, {
      keySize: 256 / 32,
      iterations: 10000,
      hasher: CryptoJS.algo.SHA256,
    });


    // Encrypt
    const encrypted = CryptoJS.AES.encrypt(secretData, key, { iv }).toString();

    // Combine salt + iv + ciphertext (for easy storage)
    const combined = [
      CryptoJS.enc.Base64.stringify(salt),
      CryptoJS.enc.Base64.stringify(iv),
      encrypted,
    ].join("::");

    // Prevent overlong QR payload
    if (combined.length > 1200) {
      return res.json({
        success: false,
        error: "Data too large for QR. Please use file download instead.",
      });
    }

    // Generate QR
    const qrPng = qr.imageSync(combined, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");
    res.json({ success: true, qrCode: qrBase64, encrypted: combined });
  } catch (err) {
    console.error("Encryption error:", err);
    res
      .status(500)
      .json({ success: false, error: "Encryption/QR generation failed" });
  }
});

//Route for file encryption
app.post("/api/encrypt-file", (req, res) => {
  // get the data
  const { base64, passphrase, filename } = req.body;
  //check existence
  if (!base64 || !passphrase || !filename) {
    return res.status(400).json({ error: "Missing required data." });
  }

  try {
    // 1️⃣ Generate salt + derive key + iv
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const key = CryptoJS.PBKDF2(passphrase, salt, {
      keySize: 256 / 32,
      iterations: 10000,
      hasher: CryptoJS.algo.SHA256,
    });
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    // 2️⃣ Encrypt file base64 data
    const encrypted = CryptoJS.AES.encrypt(base64, key, { iv: iv }).toString();

    // 3️⃣ Combine salt + iv + ciphertext
    const combined = [
      CryptoJS.enc.Base64.stringify(salt),
      CryptoJS.enc.Base64.stringify(iv),
      encrypted,
    ].join("::");

    // 4️⃣ Optional: handle large data gracefully
    if (combined.length > 1200) {
      return res.json({
        success: false,
        error:
          "Encrypted data too large for QR. File saved successfully — use the download link instead.",
      });
    }

    // 5️⃣ Generate QR and save encrypted file
    const qrPng = qr.imageSync(combined, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");

    const fileId = Math.floor(100000 + Math.random() * 900000);
    const encryptedDir = path.join(__dirname, "encrypted");

    if (!fs.existsSync(encryptedDir)) {
      fs.mkdirSync(encryptedDir, { recursive: true });
    }

    const filePath = path.join(encryptedDir, `${filename}_${fileId}.enc`);
    fs.writeFileSync(filePath, combined);

    // 6️⃣ Send full response
    res.json({
      success: true,
      qrCode: qrBase64,
      downloadUrl: `/encrypted/${filename}_${fileId}.enc`,
      encrypted: combined, // important!
      message: `Encrypted file saved successfully.`,
    });
  } catch (error) {
    console.error("File encryption failed:", error);
    res.status(500).json({ success: false, error: "Failed to encrypt file." });
  }
});

app.post("/api/decrypt", (req, res) => {
  const { cipher, passphrase } = req.body;
  console.log("Received cipher:", cipher);

  if (!cipher || !passphrase) {
    return res.status(400).json({ error: "Missing required data." });
  }

  try {
    const parts = cipher.split("::");
    if (parts.length !== 3) throw new Error("Invalid ciphertext format.");

    const salt = CryptoJS.enc.Base64.parse(parts[0]);
    const iv = CryptoJS.enc.Base64.parse(parts[1]);
    const encryptedText = parts[2];

    const key = CryptoJS.PBKDF2(passphrase, salt, {
      keySize: 256 / 32,
      iterations: 10000,
      hasher: CryptoJS.algo.SHA256,
    });

    const decrypted = CryptoJS.AES.decrypt(encryptedText, key, { iv });
    const original = decrypted.toString(CryptoJS.enc.Utf8);

    if (!original) {
      return res.status(400).json({
        success: false,
        error: "Invalid passphrase or corrupted ciphertext.",
      });
    }

    res.json({
      success: true,
      decrypted: original,
      message: "Decryption successful.",
    });
  } catch (error) {
    console.error("Decryption failed:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during decryption.",
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
