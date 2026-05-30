import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify SMTP connection
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service ready");
  } catch (error) {
    console.error("❌ SMTP Error:", error);
  }
};

// Send OTP Email
export const sendOTPEmail = async (toEmail, otp, userName = "") => {
  try {
    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        `Krishi Mitra <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Krishi Mitra - Password Reset OTP",
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 500px;
            margin: auto;
            background: #fff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: #16a34a;
            color: white;
            text-align: center;
            padding: 25px;
          }
          .content {
            padding: 25px;
          }
          .otp-box {
            text-align: center;
            background: #f0fdf4;
            border: 2px dashed #16a34a;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .otp {
            font-size: 36px;
            font-weight: bold;
            color: #16a34a;
            letter-spacing: 8px;
          }
          .footer {
            text-align: center;
            padding: 15px;
            font-size: 12px;
            color: #666;
            background: #f9fafb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🌾 Krishi Mitra</h2>
            <p>Password Reset Request</p>
          </div>

          <div class="content">
            <p>Hello ${
              userName ? `<strong>${userName}</strong>` : "User"
            },</p>

            <p>Use the OTP below to reset your password:</p>

            <div class="otp-box">
              <div class="otp">${otp}</div>
              <p>Expires in 15 minutes</p>
            </div>

            <p>
              If you did not request a password reset, you can safely ignore
              this email.
            </p>
          </div>

          <div class="footer">
            © ${new Date().getFullYear()} Krishi Mitra
          </div>
        </div>
      </body>
      </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};