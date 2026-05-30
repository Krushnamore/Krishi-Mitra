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
  // ✅ START LISTENING FIRST — Render must detect the port immediately
  // If we await DB before listen(), Render times out with "No open ports detected"
  app.listen(ENV.PORT, '0.0.0.0', () => {
    console.log(`✅ Server on port ${ENV.PORT} | env: ${ENV.NODE_ENV}`);
  });

  // Connect to MongoDB after server is already listening
  try {
    await connectDB();
  } catch (error) {
    console.error('❌ MongoDB failed to connect:', error.message);
    // Don't exit — server is still running, DB may recover
  }

  // Verify email config after server is already listening
  try {
    await verifyEmailConfig();
  } catch (error) {
    console.warn('⚠️ Email config warning:', error.message);
    // Don't exit — email is non-critical for server to run
  }
};

startServer();