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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  ENV.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any vercel.app subdomain
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests
app.options('*', cors());

// 20mb limit for base64 image uploads (crop diagnosis)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    auth: 'JWT',
    env: ENV.NODE_ENV,
  });
});

// 404 for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    message: err.message || 'Something went wrong!',
    error: ENV.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(`✅ Server running on port: ${ENV.PORT}`);
      console.log(`✅ Allowed origins:`, allowedOrigins);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error.message);
    process.exit(1);
  }
};

startServer();