import nodemailer from 'nodemailer';

let transporter = null;

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,        // ✅ port 465 (SSL) works on Render — 587 is blocked
    secure: true,     // ✅ true for port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,  // Gmail App Password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function verifyEmailConfig() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email service not configured: EMAIL_USER or EMAIL_PASS missing');
    return false;
  }

  try {
    transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email service configured (Gmail SMTP)');
    return true;
  } catch (error) {
    console.warn('⚠️  Email service not configured:', error.message);
    transporter = null;
    return false;
  }
}

export async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    transporter = createTransporter();
  }

  const from = process.env.EMAIL_FROM || `Krishi Mitra <${process.env.EMAIL_USER}>`;

  await transporter.sendMail({ from, to, subject, html, text });
  console.log('✅ Email sent to', to);
}

export async function sendOTPEmail(to, otp) {
  return sendEmail({
    to,
    subject: 'Krishi Mitra — Your Verification Code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#16a34a;">🌾 Krishi Mitra</h2>
        <p>Your one-time verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#15803d;text-align:center;padding:24px 0;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
    text: `Your Krishi Mitra OTP is: ${otp}. Expires in 10 minutes.`,
  });
}

export async function sendWelcomeEmail(to, name, role) {
  return sendEmail({
    to,
    subject: 'Welcome to Krishi Mitra!',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#16a34a;">🌾 Welcome, ${name}!</h2>
        <p>Your <strong>${role}</strong> account has been created successfully.</p>
        <a href="${process.env.FRONTEND_URL || 'https://krishi-mitra-beryl.vercel.app'}/login"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Go to Dashboard →
        </a>
      </div>
    `,
    text: `Welcome to Krishi Mitra, ${name}! Your ${role} account is ready.`,
  });
}

export async function sendPasswordResetEmail(to, resetToken) {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  return sendEmail({
    to,
    subject: 'Krishi Mitra — Reset Your Password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#16a34a;">🌾 Reset Your Password</h2>
        <p>Click the button below to reset your password.</p>
        <a href="${url}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Reset Password →
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:16px;">This link expires in 1 hour.</p>
      </div>
    `,
    text: `Reset your Krishi Mitra password: ${url}`,
  });
}