import express from "express";
import qr from "qr-image";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import CryptoJS from "crypto-js";

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
    const encrypted = CryptoJS.AES.encrypt(secretData, passphrase).toString();
    // QR encode the ciphertext
    if (encrypted.length > 1200) {
      return res.json({
        success: false,
        error: "Data too large for QR. Please use file download instead.",
      });
    } else {
      const qrPng = qr.imageSync(encrypted, { type: "png" });
      const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");

      res.json({ success: true, qrCode: qrBase64, encrypted }); //- Returns both QR image and raw ciphertext
    }
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Encryption/QR generation failed" });
  }
});
//Route for file encryption
app.post("/api/encrypt-file", (req, res) => {
  //get the data from frontend
  const { base64, passphrase, filename } = req.body;
  //check their existence
  if (!base64 || !passphrase || !filename) {
    return res.status(400).json({ error: "Missing required Data" });
  }
  try {
    //encryting the file
    const encrypted = CryptoJS.AES.encrypt(base64, passphrase).toString();
    if (encrypted.length > 1200) {
      return res.json({
        success: false,
        error:
          "Encrypted data too large for QR. File saved successfully — use the download link instead.",
      });
    } else {
      //generate image from encryted data.
      const qrPng = qr.imageSync(encrypted, { type: "png" });
      const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");
      //storing the file
      const fileId = Math.floor(100000 + Math.random() * 900000);

      if (!fs.existsSync(path.join(__dirname, "encrypted"))) {
        fs.mkdirSync(path.join(__dirname, "encrypted"), { recursive: true });
      }
      const filePath = path.join(
        __dirname,
        "encrypted",
        filename + "_" + fileId + ".enc"
      );
      fs.writeFileSync(filePath, encrypted);
      //sending the encryted file and QR
      res.json({
        success: true,
        qrCode: qrBase64,
        downloadUrl: `/encrypted/${filename}_${fileId}.enc`,
        encrypted: encrypted,
        message: `Encrypted file saved: ${filePath}`,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to encrypt File...." });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
