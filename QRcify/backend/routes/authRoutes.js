import express from "express";
import bcrypt from "bcrypt";
import { generateAuthToken } from "../utils/authUtils.js";
import User from "../models/user.js";
import { Sequelize } from "sequelize";
import {
  generateResetToken,
  getResetTokenExpiry,
  sendResetEmail,
} from "../utils/passwordReset.js";
import {
  generateOTP,
  getOTPExpiry,
  sendOTPEmail,
  sendWelcomeEmail,
} from "../services/emailService.js";

const router = express.Router();
// Test route
router.post("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth routes are working!",
    timestamp: new Date().toISOString(),
  });
});
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: "Email already Exists. Please login or use different email",
      });
    }
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    console.log(`📧 Registering user: ${email}`);
    console.log(`   OTP: ${otp}`);
    console.log(`   Expiry: ${otpExpiry}`);

    // ✅ Create user (not verified yet)
    const newUser = await User.create({
      name,
      email,
      password, // Will be hashed by User.beforeCreate hook
      isVerified: false,
      otp: otp,
      otpExpires: otpExpiry,
    });

    console.log(`✅ User created (not verified): ${newUser.id}`);

    // ✅ Send OTP email
    const emailSent = await sendOTPEmail(email, otp, name);

    res.json({
      success: true,
      message: "Registration successful. Please check your email for OTP.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isVerified: newUser.isVerified,
      },
      emailSent: emailSent,
      note: "OTP expires in 30 seconds",
    });
  } catch (err) {
    console.error("failed to register", err);
    res.status(500).json({ err: "Registration failed.", message: err.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    console.log(`🔍 Verifying OTP for: ${email}`);

    // ✅ Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // ✅ Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        error: "Email already verified. Please login.",
      });
    }

    // ✅ Check if OTP expired
    if (new Date() > user.otpExpires) {
      return res.status(400).json({
        error: "OTP expired. Please register again.",
      });
    }

    // ✅ Check if OTP matches
    if (user.otp !== otp.trim()) {
      console.log(`❌ OTP mismatch. Expected: ${user.otp}, Got: ${otp.trim()}`);
      return res.status(400).json({
        error: "Invalid OTP. Please try again.",
      });
    }

    // ✅ Mark as verified
    user.isVerified = true;
    user.otp = null; // Clear OTP
    user.otpExpires = null;
    await user.save();

    console.log(`✅ User verified: ${user.id} (${email})`);

    // ✅ Send welcome email
    await sendWelcomeEmail(email, user.name);

    // ✅ Generate JWT token
    const token = generateAuthToken(user);

    res.json({
      success: true,
      message: "Email verified successfully!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("❌ OTP verification failed:", error);
    res.status(500).json({
      error: "Verification failed",
      message: error.message,
    });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log(`🔄 Resending OTP for: ${email}`);

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({
        error: "Email already verified. Please login.",
      });
    }

    // ✅ Generate new OTP
    const newOTP = generateOTP();
    const newExpiry = getOTPExpiry();

    user.otp = newOTP;
    user.otpExpires = newExpiry;
    await user.save();

    console.log(`📧 New OTP for ${email}: ${newOTP}`);

    // ✅ Send OTP email
    await sendOTPEmail(email, newOTP, user.name);

    res.json({
      success: true,
      message: "New OTP sent to your email",
      note: "OTP expires in 15 minutes",
    });
  } catch (error) {
    console.error("❌ Resend OTP failed:", error);
    res.status(500).json({
      error: "Failed to resend OTP",
      message: error.message,
    });
  }
});
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("🔐 Forgot password request for:", email);

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    console.log("👤 User found:", user ? "Yes" : "No");

    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: "If email exists, reset link sent",
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpires = getResetTokenExpiry();
    console.log(
      "🔑 Reset token generated:",
      resetToken.substring(0, 10) + "..."
    );

    // Save to database
    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpires;
    await user.save();
    console.log("💾 Reset token saved to database");

    // ✅ THIS IS THE CRITICAL LINE - Send email
    console.log("📧 Calling sendResetEmail function...");
    const emailSent = await sendResetEmail(email, resetToken, user.name);
    console.log("✅ Email result:", emailSent);

    res.json({
      success: true,
      message: "Password reset link sent to email",
      emailSent: emailSent,
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({
      error: "Failed to process request",
      message: error.message,
    });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: "Token and password required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({
      where: {
        resetToken: resetToken,
        resetTokenExpires: {
          [Sequelize.Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    // Updateing the new Password password
    user.password = newPassword; // Will be hashed by beforeCreate hook
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "User Not Found" });
    }

    if (!user.isVerified) {
      //is email verified?
      return res.status(400).json({
        error: "Email not verified. Please check your email for OTP.",
        unverified: true,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid Credentials." });
    }
    //generate JWT token
    const token = generateAuthToken(user);
    console.log(`Login SUccessfull.", ${user.email} `);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server error" });
  }
});

router.post("/logout", async (req, res) => {
  res.json({
    success: true,
    message: "Logout Successfull.",
  });
});
export default router;
