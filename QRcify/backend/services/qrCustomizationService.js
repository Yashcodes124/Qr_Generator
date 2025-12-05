import qr from "qr-image";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export async function generateCustomQR(qrData, customOptions = {}) {
  try {
    const {
      data, // URL or text
      darkColor = "#000000",
      lightColor = "#FFFFFF",
      size = 300,
      margin = 2,
      format = "png", // png, svg, pdf
      errorCorrection = "H", // L, M, Q, H
    } = {
      data: qrData,
      ...customOptions,
    };

    console.log(`🎨 Generating custom QR with options:`, customOptions);

    // Generate base QR code
    const qrOptions = {
      type: format,
      width: size,
      margin: margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      ec_level: errorCorrection,
    };

    const qrPng = qr.imageSync(data, qrOptions);

    // Convert to Base64
    const base64 = qrPng.toString("base64");
    const dataUrl = `data:image/${format};base64,${base64}`;

    return {
      success: true,
      qrCode: dataUrl,
      buffer: qrPng,
      format,
      size,
      darkColor,
      lightColor,
    };
  } catch (error) {
    console.error("❌ QR customization error:", error);
    throw error;
  }
}

export async function addLogoToQR(qrBuffer, logoPath, logoSize = 0.2) {
  try {
    console.log(`🎨 Adding logo to QR code`);

    // Read logo
    const logoBuffer = await fs.readFile(logoPath);

    // Calculate dimensions
    const qrImage = sharp(qrBuffer);
    const qrMetadata = await qrImage.metadata();
    const qrWidth = qrMetadata.width;
    const logoWidth = Math.floor(qrWidth * logoSize);

    // Resize and overlay logo
    const logoResized = await sharp(logoBuffer)
      .resize(logoWidth, logoWidth, {
        fit: "cover",
        background: { r: 255, g: 255, b: 255 },
      })
      .toBuffer();

    const centerX = Math.floor((qrWidth - logoWidth) / 2);
    const centerY = Math.floor((qrWidth - logoWidth) / 2);

    const result = await qrImage
      .composite([
        {
          input: logoResized,
          left: centerX,
          top: centerY,
        },
      ])
      .toBuffer();

    console.log(`✅ Logo added successfully`);
    return result;
  } catch (error) {
    console.error("❌ Logo overlay error:", error);
    throw error;
  }
}

export function validateColorFormat(color) {
  // Validate hex color
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

export function validateQROptions(options) {
  const errors = [];

  // Validate colors
  if (options.darkColor && !validateColorFormat(options.darkColor)) {
    errors.push("Dark color must be valid hex (e.g., #000000)");
  }
  if (options.lightColor && !validateColorFormat(options.lightColor)) {
    errors.push("Light color must be valid hex (e.g., #FFFFFF)");
  }

  // Validate size
  if (options.size && (options.size < 100 || options.size > 1000)) {
    errors.push("Size must be between 100 and 1000");
  }

  // Validate margin
  if (options.margin && (options.margin < 0 || options.margin > 10)) {
    errors.push("Margin must be between 0 and 10");
  }

  // Validate error correction
  if (
    options.errorCorrection &&
    !["L", "M", "Q", "H"].includes(options.errorCorrection)
  ) {
    errors.push("Error correction must be L, M, Q, or H");
  }

  // Validate format
  if (options.format && !["png", "svg", "pdf"].includes(options.format)) {
    errors.push("Format must be png, svg, or pdf");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
