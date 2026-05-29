import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = process.env.EMAIL_FROM || 'Krishi Mitra <noreply@yourdomain.com>';

// ── Generic sender ─────────────────────────────────────
export async function sendEmail({ to, subject, html, text }) {
  await sgMail.send({
    to,
    from: FROM,
    subject,
    html,
    text,
  });
  console.log('✅ Email sent to', to);
}

// ── OTP email ──────────────────────────────────────────
export async function sendOTPEmail(to, otp) {
  return sendEmail({
    to,
    subject: 'Krishi Mitra — Your Verification Code',
    html: `<h2>Your OTP is: <strong>${otp}</strong></h2><p>Expires in 10 minutes.</p>`,
    text: `Your Krishi Mitra OTP is: ${otp}`,
  });
}

// ── Welcome email ──────────────────────────────────────
export async function sendWelcomeEmail(to, name, role) {
  return sendEmail({
    to,
    subject: 'Welcome to Krishi Mitra!',
    html: `<h2>Welcome, ${name}!</h2><p>Your ${role} account is ready.</p>`,
    text: `Welcome to Krishi Mitra, ${name}! Your ${role} account is ready.`,
  });
}

// ── Password reset email ───────────────────────────────
export async function sendPasswordResetEmail(to, resetToken) {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  return sendEmail({
    to,
    subject: 'Krishi Mitra — Reset Your Password',
    html: `<p>Click to reset: <a href="${url}">${url}</a></p><p>Expires in 1 hour.</p>`,
    text: `Reset your password: ${url}`,
  });
}

// ── Startup check ──────────────────────────────────────
export async function verifyEmailService() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️  Email service not configured: SENDGRID_API_KEY missing');
    return false;
  }
  console.log('✅ Email service configured (SendGrid)');
  return true;
}