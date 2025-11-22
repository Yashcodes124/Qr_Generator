import nodemailer from "nodemailer";

// ✅ Configure email transporter
let transporter;

try {
  console.log("📧 Initializing email transporter...");
  console.log("   Email:", process.env.EMAIL_USER);
  transporter = nodemailer.createTransport({
    service: "gmail", // Or your email service
    auth: {
      user: process.env.EMAIL_USER || "your-email@gmail.com",
      pass: process.env.EMAIL_PASSWORD || "your-app-password",
      // For Gmail: Use App Password, not regular password
      // Setup: https://support.google.com/accounts/answer/185833
    },
  });
  console.log("✅ Email transporter created successfully");
  // ✅ Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Email transporter error:", error.message);
      console.log("⚠️  Email verification will be disabled until configured");
    } else {
      console.log("✅ Email transporter ready");
    }
  });
} catch (error) {
  console.error("❌ Failed to setup email transporter:", error.message);
}

// ✅ Generate random OTP (6 digits)
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ Calculate OTP expiry (30sec from now)
export function getOTPExpiry() {
  const expiry = new Date();
  expiry.setMinutes(expiry.getSeconds() + 30);
  return expiry;
}

// ✅ Send OTP Email
export async function sendOTPEmail(email, otp, userName) {
  if (!transporter) {
    console.warn("⚠️  Email service not configured, skipping email send");
    console.log(`📧 OTP for ${email}: ${otp}`); // Log to console for testing
    return true; // Don't fail if email not configured
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔐 QRcify Pro - Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🔐 QRcify Pro</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.9;">Email Verification</p>
          </div>
          
          <div style="background: #f9fafb; padding: 2rem; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hello ${userName}! 👋</h2>
            
            <p style="color: #555; line-height: 1.6;">
              Welcome to QRcify Pro! Please verify your email address to activate your account.
            </p>
            
            <div style="background: white; border: 2px dashed #667eea; padding: 1.5rem; text-align: center; margin: 2rem 0; border-radius: 8px;">
              <p style="color: #999; margin: 0 0 0.5rem 0; font-size: 0.9rem;">Your Verification Code:</p>
              <p style="font-size: 2.5rem; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 4px;">
                ${otp}
              </p>
              <p style="color: #999; margin: 0.5rem 0 0 0; font-size: 0.85rem;">
                Valid for 30 sec
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              ✅ Enter this code in the verification field to activate your account.
            </p>
            
            <p style="color: #999; font-size: 0.9rem; line-height: 1.6; margin-top: 2rem;">
              <strong>⚠️ Security Note:</strong>
              <br/>
              • Never share this code with anyone
              <br/>
              • QRcify will never ask for your OTP via email
              <br/>
              • This code expires in 30 sec
            </p>
            
            <div style="background: #f0f7ff; border-left: 4px solid #3498db; padding: 1rem; margin-top: 2rem; border-radius: 4px;">
              <p style="color: #555; margin: 0; font-size: 0.9rem;">
                <strong>Didn't request this email?</strong>
                <br/>
                If you didn't sign up for QRcify Pro, please ignore this email or contact our support team.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 1rem; color: #999; font-size: 0.85rem; border-top: 1px solid #ddd; margin-top: 1rem;">
            <p style="margin: 0;">© 2025 QRcify Pro. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
    // Don't throw - let signup continue with warning
    return false;
  }
}

// ✅ Send Welcome Email (after verification)
export async function sendWelcomeEmail(email, userName) {
  if (!transporter) return true;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🎉 Welcome to QRcify Pro - Account Verified!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #27ae60 0%, #219a52 100%); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🎉 Welcome, ${userName}!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 2rem; border-radius: 0 0 10px 10px;">
            <p style="color: #555; line-height: 1.6;">
              Your email has been verified successfully! Your QRcify Pro account is now active and ready to use.
            </p>
            
            <div style="background: white; padding: 1.5rem; margin: 2rem 0; border-radius: 8px; border-left: 4px solid #27ae60;">
              <h3 style="color: #2c3e50; margin-top: 0;">Get Started:</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li>📌 Generate URL QR codes instantly</li>
                <li>🔒 Create encrypted text QR codes</li>
                <li>📁 Encrypt and share files securely</li>
                <li>📇 Generate digital business cards</li>
                <li>📶 Create WiFi network QR codes</li>
                <li>📊 Track your QR statistics</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="https://qrcify.example.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.75rem 2rem; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Go to Dashboard →
              </a>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to send welcome email to ${email}:`,
      error.message
    );
    return false;
  }
}
