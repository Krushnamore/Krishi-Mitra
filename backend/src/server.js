import express from 'express';
import cors from 'cors';
import { ENV } from './lib/env.js';
import { connectDB } from './lib/db.js';
import { verifyEmailConfig } from './lib/email.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:3000',
  ENV.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (origin.endsWith('.onrender.com')) return callback(null, true);
    console.warn('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', env: ENV.NODE_ENV });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const startServer = async () => {
  // ✅ Fallback to 5000 if ENV.PORT is undefined/missing in your .env file
  const PORT = ENV.PORT || 5000; 

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server actively listening on port ${PORT} | env: ${ENV.NODE_ENV || 'development'}`);
  });

  try {
    await connectDB();
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB failed to connect:', error.message);
  }

  try {
    await verifyEmailConfig();
  } catch (error) {
    console.warn('⚠️ Email config warning:', error.message);
  }
};

startServer();