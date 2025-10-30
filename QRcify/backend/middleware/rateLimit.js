// backend/middleware/rateLimit.js

import rateLimit from "express-rate-Limit";

export const qrGeneationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 min
  max: 50, // Limit each IP to 50 QR generations per windowMs
  message: {
    error: "Too many QR codes generated from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default qrGeneationLimiter;
