// backend/middleware/validateInput.js
import { body, param, query, validationResult } from "express-validator";

// ==================== ERROR HANDLER ====================
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

// ==================== URL VALIDATORS ====================
export const validateUrlInput = [
  body("url")
    .trim()
    .notEmpty()
    .withMessage("URL is required")
    .isURL({
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ["http", "https"],
    })
    .withMessage("Invalid URL format. Must start with http:// or https://")
    .isLength({ max: 2048 })
    .withMessage("URL too long (max 2048 characters)")
    .custom((url) => {
      // Block localhost in production
      if (process.env.NODE_ENV === "production") {
        if (url.includes("localhost") || url.includes("127.0.0.1")) {
          throw new Error("Localhost URLs not allowed in production");
        }
      }
      return true;
    }),
  handleValidationErrors,
];

// ==================== ENCRYPTION VALIDATORS ====================
export const validateEncryption = [
  body("secretData")
    .trim()
    .notEmpty()
    .withMessage("Secret data is required")
    .isLength({ min: 1, max: 5000 })
    .withMessage("Secret data must be between 1 and 5000 characters"),

  body("passphrase")
    .trim()
    .notEmpty()
    .withMessage("Passphrase is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Passphrase must be 8-128 characters")
    .matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/)
    .withMessage("Passphrase contains invalid characters")
    .custom((passphrase) => {
      // Require mix of character types
      const hasUppercase = /[A-Z]/.test(passphrase);
      const hasLowercase = /[a-z]/.test(passphrase);
      const hasNumber = /[0-9]/.test(passphrase);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
        passphrase
      );

      const score = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(
        Boolean
      ).length;

      if (score < 2) {
        throw new Error(
          "Passphrase must contain at least 2 of: uppercase, lowercase, numbers, special characters"
        );
      }
      return true;
    }),

  handleValidationErrors,
];

// ==================== FILE VALIDATORS ====================
export const validateFileUpload = [
  body("base64")
    .trim()
    .notEmpty()
    .withMessage("File data is required")
    .custom((value) => {
      // Check if valid base64
      if (!/^[A-Za-z0-9+/=]*$/.test(value)) {
        throw new Error("Invalid base64 encoding");
      }

      // Calculate actual file size
      const binaryString = Buffer.from(value, "base64").toString("binary");
      const fileSizeBytes = Buffer.from(binaryString, "binary").length;
      const maxSizeBytes = 50 * 1024 * 1024; // 50MB

      if (fileSizeBytes > maxSizeBytes) {
        throw new Error(
          `File too large. Maximum size is 50MB (your file: ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB)`
        );
      }

      return true;
    }),

  body("filename")
    .trim()
    .notEmpty()
    .withMessage("Filename is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Filename too long")
    .custom((filename) => {
      // Prevent path traversal
      if (
        filename.includes("/") ||
        filename.includes("\\") ||
        filename.includes("..")
      ) {
        throw new Error("Invalid filename. No path characters allowed");
      }

      // Check file extension whitelist
      const allowedExtensions = [
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "txt",
        "csv",
        "json",
        "xml",
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "zip",
        "rar",
        "7z",
        "tar",
        "gz",
        "mp3",
        "mp4",
        "avi",
        "mkv",
      ];

      const extension = filename.split(".").pop().toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        throw new Error(
          `File type not allowed. Allowed: ${allowedExtensions.join(", ")}`
        );
      }

      return true;
    }),

  body("passphrase")
    .trim()
    .notEmpty()
    .withMessage("Passphrase is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Passphrase must be 8-128 characters"),

  handleValidationErrors,
];

// ==================== VCARD VALIDATORS ====================
export const validateVCard = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2-100 characters"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .isMobilePhone()
    .withMessage("Invalid phone number format"),

  body("email")
    .trim()
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Invalid email format"),

  body("company")
    .trim()
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage("Company name too long"),

  handleValidationErrors,
];

// ==================== WIFI VALIDATORS ====================
export const validateWiFi = [
  body("ssid")
    .trim()
    .notEmpty()
    .withMessage("SSID (Network name) is required")
    .isLength({ min: 1, max: 32 })
    .withMessage("SSID must be 1-32 characters"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("WiFi password is required")
    .isLength({ min: 8, max: 63 })
    .withMessage("WiFi password must be 8-63 characters"),

  body("encryption")
    .trim()
    .notEmpty()
    .withMessage("Encryption type is required")
    .isIn(["WPA", "WEP", "nopass"])
    .withMessage("Invalid encryption type. Must be WPA, WEP, or nopass"),

  handleValidationErrors,
];

// ==================== DECRYPTION VALIDATORS ====================
export const validateDecryption = [
  body("cipher")
    .trim()
    .notEmpty()
    .withMessage("Encrypted data is required")
    .custom((cipher) => {
      // Check format: salt::iv::ciphertext
      if (!cipher.includes("::")) {
        throw new Error("Invalid cipher format. Missing :: separators");
      }
      const parts = cipher.split("::");
      if (parts.length !== 3) {
        throw new Error(
          "Invalid cipher format. Expected: salt::iv::ciphertext"
        );
      }
      return true;
    }),

  body("passphrase")
    .trim()
    .notEmpty()
    .withMessage("Passphrase is required")
    .isLength({ min: 8 })
    .withMessage("Passphrase must be at least 8 characters"),

  handleValidationErrors,
];

// ==================== URL SHORTENER VALIDATORS ====================
export const validateUrlShorten = [
  body("originalURL")
    .trim()
    .notEmpty()
    .withMessage("Original URL is required")
    .isURL({ require_protocol: true })
    .withMessage("Invalid URL format"),

  body("customAlias")
    .trim()
    .optional({ checkFalsy: true })
    .isLength({ min: 3, max: 50 })
    .withMessage("Custom alias must be 3-50 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Custom alias can only contain letters, numbers, hyphens, underscores"
    ),

  body("title")
    .trim()
    .optional({ checkFalsy: true })
    .isLength({ max: 255 })
    .withMessage("Title too long"),

  handleValidationErrors,
];

export default {
  validateUrlInput,
  validateEncryption,
  validateFileUpload,
  validateVCard,
  validateWiFi,
  validateDecryption,
  validateUrlShorten,
  handleValidationErrors,
};
