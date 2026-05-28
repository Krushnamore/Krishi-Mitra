import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { ENV } from '../lib/env.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const {
      name, email, password, role, phone,
      farmSize, cropTypes,
      shopName, shopAddress,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    if (!['farmer', 'retailer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be farmer or retailer' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = new User({
      name,
      email,
      password,
      role,
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
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        farmSize: user.farmSize,
        cropTypes: user.cropTypes,
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

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        farmSize: user.farmSize,
        cropTypes: user.cropTypes,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
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
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      location: req.user.location,
      farmSize: req.user.farmSize,
      cropTypes: req.user.cropTypes,
      shopName: req.user.shopName,
      shopAddress: req.user.shopAddress,
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