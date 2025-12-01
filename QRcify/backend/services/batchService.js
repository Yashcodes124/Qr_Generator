import path from "path";
import { fileURLToPath } from "url";
import qr from "qr-image";
import { createWriteStream } from "fs";
import archiver from "archiver";
import { mkdir } from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function generateBatchQRs(urls, outputDir) {
  try {
    console.log(`📦 Generating ${urls.length} QR codes...`);
    await mkdir(outputDir, { recursive: true });

    const qrFiles = [];

    // Generate QR for each url
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i].trim();

      if (!url || !url.startsWith("http")) {
        console.warn(`⚠️ Skipping invalid URL at index ${i}: ${url}`);
        continue;
      }
      try {
        // Generate QR code
        const qrPng = qr.imageSync(url, { type: "png" });

        // Create filename
        const filename = `qr_${i + 1}_${encodeURIComponent(url.substring(0, 20))}.png`;
        const filepath = path.join(outputDir, filename);

        // Write to file
        const writeStream = createWriteStream(filepath);
        writeStream.write(qrPng);
        writeStream.end();

        qrFiles.push(filename);
        console.log(`✅ QR ${i + 1}/${urls.length} generated: ${filename}`);
      } catch (err) {
        console.error(
          `❌ Failed to generate QR for URL ${i + 1}: ${err.message}`
        );
      }
    }

    console.log(`✅ All QR codes generated: ${qrFiles.length} files`);
    return qrFiles;
  } catch (err) {
    console.error("❌ Batch QR generation error:", err);
    throw err;
  }
}

export async function createZipFile(sourceDir, outputZipPath) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Creating ZIP file: ${outputZipPath}`);

    const output = createWriteStream(outputZipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`✅ ZIP file created: ${archive.pointer()} bytes`);
      resolve(outputZipPath);
    });

    archive.on("error", (err) => {
      console.error("❌ ZIP creation error:", err);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, "QR-Codes");
    archive.finalize();
  });
}
