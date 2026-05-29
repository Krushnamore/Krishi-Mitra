import nodemailer from 'nodemailer';
import { ENV } from './env.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (toEmail, otp, userName = '') => {
  const mailOptions = {
    from: ENV.EMAIL_FROM || `Krishi Mitra <${ENV.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Krishi Mitra — Password Reset OTP',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #16a34a, #15803d); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px 24px; }
    .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .otp-box { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-box .otp { font-size: 42px; font-weight: bold; color: #16a34a; letter-spacing: 10px; font-family: 'Courier New', monospace; }
    .otp-box .expires { font-size: 13px; color: #6b7280; margin-top: 8px; }
    .warning { background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 6px; margin-top: 16px; }
    .warning p { color: #92400e; font-size: 13px; margin: 0; }
    .footer { background: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌾 Krishi Mitra</h1>
      <p>AI-Powered Agricultural Platform</p>
    </div>
    <div class="body">
      <p>Hello${userName ? ' <strong>' + userName + '</strong>' : ''},</p>
      <p>We received a request to reset your password. Use the OTP below:</p>
      <div class="otp-box">
        <div class="otp">${otp}</div>
        <div class="expires">⏱ This OTP expires in <strong>15 minutes</strong></div>
      </div>
      <p>Enter this OTP on the password reset page to set your new password.</p>
      <div class="warning">
        <p>⚠️ If you didn't request a password reset, you can safely ignore this email. Your account remains secure.</p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Krishi Mitra &bull; Smart Agri Platform</p>
      <p style="margin-top:4px;">Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service ready');
  } catch (error) {
    console.warn('⚠️ Email service not configured:', error.message);
  }
};