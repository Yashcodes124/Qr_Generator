// // #!/usr/bin/env node
// import express from "express";
// import qr from "qr-image"; //inquirer is a prompt library not for image
// import cors from "cors";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url); //converting the url path to normal
// const __dirname = path.dirname(__filename);
// // const fullPath = path.join(__dirname, "../frontend/index.html");

// const app = express();
// const port = 3000;
// app.use(cors());
// app.use(express.json());
// app.use(express.static(path.join(__dirname, "../frontend")));

// // Serve main page
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/index.html"));
// }); //now express will find my frontend/index.html other than where script is launched from.

// // Generate QR from URL
// app.post("/generate", (req, res) => {
//   const { url } = req.body;
//   if (!url) {
//     return res.status(400).json({ error: "URL is required for QR generation" });
//   }
//   try {
//     const qrPng = qr.imageSync(url, { type: "png" });
//     const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");
//     // Save URL with a newline
//     fs.appendFile("urls.txt", url + "\n", (err) => {
//       if (err) console.log("Failed to write URL to file", err);
//     });
//     res.json({ qrCode: qrBase64 });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to generate QR code" });
//   }
// });

// // Start server ONCE (outside any route)
// app.listen(port, () => {
//   console.log("🚀 Server running at http://localhost:3000");
// });
import express from "express";
import qr from "qr-image";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

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

    res.json({ qrCode: qrBase64 });
  } catch (err) {
    console.error("Error generating QR:", err);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
