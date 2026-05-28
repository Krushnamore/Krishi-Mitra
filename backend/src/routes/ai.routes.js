import express from 'express';
import { chat, getYojnas, getNearbyRetailers, cropDiagnosis } from '../controllers/ai.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/chat', authenticate, requireRole('farmer'), chat);
router.post('/yojna', authenticate, requireRole('farmer'), getYojnas);
router.get('/nearby-retailers', authenticate, requireRole('farmer'), getNearbyRetailers);
router.post('/crop-diagnosis', authenticate, requireRole('farmer'), cropDiagnosis);

export default router;