import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from './lib/env.js';
import { connectDB } from './lib/db.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import aiRoutes from './routes/ai.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 20mb limit for base64 image uploads (crop diagnosis)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', auth: 'JWT' });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: ENV.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(`✅ Server running on port: ${ENV.PORT}`);
      console.log(`✅ Auth: JWT (farmer | retailer)`);
      console.log(`✅ Crop diagnosis: vision AI enabled`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error.message);
    process.exit(1);
  }
};

startServer();