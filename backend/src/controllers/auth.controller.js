import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import { ENV } from '../lib/env.js';
import { sendOTPEmail } from '../lib/email.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const {
      name, email, password, role, phone,
      farmSize, cropTypes, shopName, shopAddress,
    } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'Name, email, password, and role are required' });

    if (!['farmer', 'retailer'].includes(role))
      return res.status(400).json({ message: 'Role must be farmer or retailer' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: 'Email already registered' });

    const user = new User({
      name, email, password, role,
      phone: phone || '',
      farmSize: farmSize || '',
      cropTypes: cropTypes || [],
      shopName: shopName || '',
      shopAddress: shopAddress || '',
    });

    await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, phone: user.phone,
        shopName: user.shopName, shopAddress: user.shopAddress,
        farmSize: user.farmSize, cropTypes: user.cropTypes,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, phone: user.phone,
        location: user.location,
        farmSize: user.farmSize, cropTypes: user.cropTypes,
        shopName: user.shopName, shopAddress: user.shopAddress,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.status(200).json({
    user: {
      id: req.user._id, name: req.user.name, email: req.user.email,
      role: req.user.role, phone: req.user.phone,
      location: req.user.location,
      farmSize: req.user.farmSize, cropTypes: req.user.cropTypes,
      shopName: req.user.shopName, shopAddress: req.user.shopAddress,
    },
  });
};

// PATCH /api/auth/location
export const updateLocation = async (req, res) => {
  try {
    const { lat, lng, city } = req.body;
    await User.findByIdAndUpdate(req.user._id, { location: { lat, lng, city } });
    res.status(200).json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'No account found with this email' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: otpHash,
      resetPasswordExpiry: otpExpiry,
    });

    // Send OTP via email
    const emailConfigured = ENV.EMAIL_USER && ENV.EMAIL_PASS;

    if (emailConfigured) {
      try {
        await sendOTPEmail(user.email, otp, user.name);
        console.log(`✅ OTP email sent to ${user.email}`);
      } catch (emailError) {
        console.error('❌ Email send failed:', emailError.message);
        // Still return success but warn
        return res.status(200).json({
          message: 'OTP generated but email delivery failed. Check server email config.',
          emailError: emailError.message,
          // Expose OTP as fallback
          otp,
        });
      }
    }

    const response = {
      message: emailConfigured
        ? `OTP sent to ${user.email}. Check your inbox (and spam folder).`
        : 'Email not configured on server.',
      email: user.email,
    };

    // Always expose OTP in development, also expose if email not configured
    if (ENV.NODE_ENV === 'development' || !emailConfigured) {
      response.otp = otp;
      response.note = emailConfigured
        ? 'Dev mode: OTP shown here'
        : 'Email not configured — copy OTP from here';
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to generate reset OTP', error: error.message });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordToken: otpHash,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};