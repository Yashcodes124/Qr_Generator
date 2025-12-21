import ShortenedURL from "../models/ShortenedURL.js";
import qr from "qr-image";
import QRHistory from "../models/QRHistory.js";
import { where } from "sequelize";

// Generate random short code (6-10 characters)
function generateShortCode(length = 6) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Validate URL
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

export async function shortenURL(urlData, req) {
  try {
    const { originalURL, customAlias, title, description, tags, expiresAt } =
      urlData;

    // Validate original URL
    if (!originalURL || !isValidURL(originalURL)) {
      throw new Error("Invalid URL provided");
    }

    // Validate custom alias if provided
    if (customAlias) {
      if (customAlias.length < 3 || customAlias.length > 50) {
        throw new Error("Custom alias must be 3-50 characters");
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
        throw new Error(
          "Custom alias can only contain letters, numbers, hyphens, and underscores"
        );
      }

      // Check if alias already exists
      const existing = await ShortenedURL.findOne({
        where: { customAlias },
      });
      if (existing) {
        throw new Error("Custom alias already taken");
      }
    }

    // Generate short code
    let shortCode = customAlias || generateShortCode();

    // Ensure uniqueness
    while (await ShortenedURL.findOne({ where: { shortCode } })) {
      shortCode = generateShortCode();
    }

    // Generate QR code for shortened URL
    const baseURL =
      process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const shortURL = `${baseURL}/s/${shortCode}`;
    const qrPng = qr.imageSync(shortURL, { type: "png" });
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64");

    // Create shortened URL record
    const record = await ShortenedURL.create({
      userId: req.user.userId,
      shortCode,
      originalURL,
      shortURL,
      customAlias: customAlias || null,
      title: title || null,
      description: description || null,
      qrCode: qrBase64,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      tags: tags || [],
      ipAddress: req.clientIp,
      userAgent: req.get("User-Agent"),
    });

    console.log(`✅ URL shortened: ${shortCode} → ${originalURL}`);

    return {
      id: record.id,
      shortCode,
      shortURL,
      originalURL,
      customAlias,
      title,
      description,
      qrCode: qrBase64,
      createdAt: record.createdAt,
      clicks: 0,
    };
  } catch (error) {
    console.error("❌ URL shortening error:", error);
    throw error;
  }
}

export async function resolveShortURL(shortCode) {
  try {
    const record = await ShortenedURL.findOne({
      where: { shortCode },
    });

    if (!record) {
      throw new Error("Short URL not found");
    }

    // Check if expired
    if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
      throw new Error("Short URL has expired");
    }

    if (!record.isActive) {
      throw new Error("Short URL is disabled");
    }

    // Increment click count
    // await record.update({
    //   clicks: record.clicks + 1,
    // });
    await QRHistory.increment("clicks", {
      where: { id: record.id },
      by: 1,
    });

    return record;
  } catch (error) {
    console.error("❌ URL resolution error:", error);
    throw error;
  }
}

export async function getUserShortenedURLs(req, limit = 50, offset = 0) {
  try {
    const urls = await ShortenedURL.findAll({
      where: { userId: req.user.userId },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      attributes: [
        "id",
        "shortCode",
        "originalURL",
        "shortURL",
        "customAlias",
        "title",
        "clicks",
        "isActive",
        "createdAt",
      ],
    });

    const total = await ShortenedURL.count({
      where: { userId: req.user.userId },
    });

    return {
      urls,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error("❌ Failed to get user URLs:", error);
    throw error;
  }
}

export async function getURLStats(urlId, req) {
  try {
    const url = await ShortenedURL.findOne({
      where: {
        id: urlId,
        userId: req.user.userId,
      },
    });

    if (!url) {
      throw new Error("URL not found or unauthorized");
    }

    return {
      id: url.id,
      shortCode: url.shortCode,
      shortURL: url.shortURL,
      originalURL: url.originalURL,
      title: url.title,
      description: url.description,
      clicks: url.clicks,
      isActive: url.isActive,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
      expiresAt: url.expiresAt,
    };
  } catch (error) {
    console.error("❌ Failed to get URL stats:", error);
    throw error;
  }
}

export async function deleteShortURL(urlId, req) {
  try {
    const url = await ShortenedURL.findOne({
      where: {
        id: urlId,
        userId: req.user.userId,
      },
    });

    if (!url) {
      throw new Error("URL not found or unauthorized");
    }

    await url.destroy();
    console.log(`✅ Shortened URL deleted: ${url.shortCode}`);

    return { message: "URL deleted successfully" };
  } catch (error) {
    console.error("❌ Failed to delete URL:", error);
    throw error;
  }
}

export async function toggleURLStatus(urlId, req) {
  try {
    const url = await ShortenedURL.findOne({
      where: {
        id: urlId,
        userId: req.user.userId,
      },
    });

    if (!url) {
      throw new Error("URL not found or unauthorized");
    }

    await url.update({
      isActive: !url.isActive,
    });

    console.log(`✅ URL status toggled: ${url.shortCode}`);

    return {
      id: url.id,
      isActive: url.isActive,
    };
  } catch (error) {
    console.error("❌ Failed to toggle URL status:", error);
    throw error;
  }
}
