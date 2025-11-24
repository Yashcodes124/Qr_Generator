import csvParse from "csv-parse";
import qr from "qr-image";
import archiver from "archiver";
import fs from "fs/promises";
import path from "path";
import os from "os";

async function generateBatch(zipPath, csvText) {
  // Parse CSV
  const records = csvParse(csvText, { columns: false, trim: true });
  // records: [["URL1"], ["URL2"], ...]

  // Create ZIP archive
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(output);
  records.forEach(([text], i) => {
    // Create QR PNG buffer (change to SVG if needed)
    const qrBuffer = qr.imageSync(text, { type: "png" });
    archive.append(qrBuffer, { name: `qr_${i + 1}.png` });
  });

  await archive.finalize();
  // Wait for ZIP to finish then return path
  await new Promise((res) => output.on("close", res));
  return zipPath;
}
export default { generateBatch };
