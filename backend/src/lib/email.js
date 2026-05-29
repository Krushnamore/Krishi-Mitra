import sgMail from '@sendgrid/mail';

// ✅ Set API key once at module load
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = process.env.EMAIL_FROM || 'Krishi Mitra <more96899@gmail.com>';

export async function verifyEmailConfig() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️  Email not configured: SENDGRID_API_KEY missing');
    return false;
  }
  console.log('✅ Email service configured (SendGrid)');
  return true;
}

export async function sendEmail({ to, subject, html, text }) {
  await sgMail.send({ to, from: FROM, subject, html, text });
  console.log('✅ Email sent to', to);
}

export async function sendOTPEmail(to, otp, name) {
  return sendEmail({
    to,
    subject: 'Krishi Mitra — Your Password Reset OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#16a34a;">🌾 Krishi Mitra</h2>
        <p>Hello <strong>${name || ''}</strong>,</p>
        <p>Your password reset OTP is:</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#15803d;text-align:center;padding:24px 0;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;">This OTP expires in 15 minutes. Do not share it with anyone.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;">If you did not request this, ignore this email.</p>
      </div>
    `,
    text: `Your Krishi Mitra OTP is: ${otp}. Expires in 15 minutes.`,
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