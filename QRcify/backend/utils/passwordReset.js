import crypto from "crypto";
import { sendPasswordResetEmail } from "../services/emailService.js";

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function getResetTokenExpiry() {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // 1 hour expiry
  return expiry;
}

export async function sendResetEmail(email, resetToken, userName) {
  const resetLink = `http://localhost:3000?reset=${resetToken}`;
  return await sendPasswordResetEmail(email, resetLink, userName);
}
