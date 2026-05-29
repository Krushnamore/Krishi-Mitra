import express from 'express';
import {
  register,
  login,
  getMe,
  updateLocation,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.patch('/location', authenticate, updateLocation);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;