import nodemailer from "nodemailer";
import { ENV } from "./env.js";

// Gmail SMTP using IPv4 + Port 587
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
  family: 4, // Force IPv4
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Verify SMTP connection
export const verifyEmailConfig = async () => {
  try {
    console.log("📧 EMAIL_USER:", ENV.EMAIL_USER);
    console.log("📧 EMAIL_PASS exists:", !!ENV.EMAIL_PASS);

    await transporter.verify();

    console.log("✅ Email service ready");
  } catch (error) {
    console.error("❌ SMTP VERIFY ERROR:");
    console.error(error);
  }
};

// Send OTP Email
export const sendOTPEmail = async (toEmail, otp, userName = "") => {
  try {
    console.log("📧 Sending OTP email to:", toEmail);

    const info = await transporter.sendMail({
      from:
        ENV.EMAIL_FROM ||
        `Krishi Mitra <${ENV.EMAIL_USER}>`,
      to: toEmail,
      subject: "Krishi Mitra - Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color:#16a34a;">🌾 Krishi Mitra</h2>

          <p>Hello ${userName || "User"},</p>

          <p>Use the OTP below to reset your password:</p>

          <div style="
            background:#f0fdf4;
            border:2px dashed #16a34a;
            padding:20px;
            text-align:center;
            margin:20px 0;
            border-radius:10px;
          ">
            <h1 style="
              margin:0;
              color:#16a34a;
              letter-spacing:6px;
            ">
              ${otp}
            </h1>
          </div>

          <p>This OTP expires in <b>15 minutes</b>.</p>

          <p>If you didn't request this password reset, you can ignore this email.</p>

          <hr />

          <p style="font-size:12px;color:#666;">
            © ${new Date().getFullYear()} Krishi Mitra
          </p>
        </div>
      `,
    });

    console.log("✅ Email sent:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ EMAIL SEND ERROR:");
    console.error(error);

    throw error;
  }
};