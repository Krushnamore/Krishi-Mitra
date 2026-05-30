import nodemailer from "nodemailer";
import { ENV } from "./env.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
});

export const verifyEmailConfig = async () => {
  try {
    console.log("📧 EMAIL_USER:", ENV.EMAIL_USER);
    console.log("📧 EMAIL_PASS exists:", !!ENV.EMAIL_PASS);

    await transporter.verify();

    console.log("✅ Email service ready");
  } catch (error) {
    console.error("❌ SMTP VERIFY ERROR");
    console.error(error);
  }
};

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
        <h2>🌾 Krishi Mitra</h2>
        <p>Hello ${userName || "User"},</p>
        <p>Your OTP for password reset is:</p>

        <div style="
          font-size:32px;
          font-weight:bold;
          color:green;
          letter-spacing:5px;
          margin:20px 0;
        ">
          ${otp}
        </div>

        <p>This OTP expires in 15 minutes.</p>

        <p>If you did not request this OTP, ignore this email.</p>
      `,
    });

    console.log("✅ Email sent:", info.messageId);

    return true;
  } catch (error) {
    console.error("❌ EMAIL SEND ERROR");
    console.error(error);
    throw error;
  }
};