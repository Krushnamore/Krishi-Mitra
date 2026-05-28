import express from 'express';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getMonthlyTrend,
} from '../controllers/product.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All product routes require authentication
// Retailers can manage products; farmers can view retailer products via separate route
router.get('/', authenticate, getProducts);
router.get('/stats', authenticate, getProductStats);
router.get('/trend', authenticate, getMonthlyTrend);
router.post('/', authenticate, requireRole('retailer'), addProduct);
router.put('/:id', authenticate, requireRole('retailer'), updateProduct);
router.delete('/:id', authenticate, requireRole('retailer'), deleteProduct);

export default router;
