import express from 'express';
import cors from 'cors';
import { ENV } from './lib/env.js';
import { connectDB } from './lib/db.js';
import { verifyEmailConfig, sendOTPEmail } from './lib/email.js';
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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin))
        return callback(null, true);

      if (origin.endsWith('.vercel.app'))
        return callback(null, true);

      if (origin.endsWith('.onrender.com'))
        return callback(null, true);

      console.warn('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.options('*', cors());

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

/* ===========================
   TEST EMAIL ROUTE
=========================== */
app.get('/test-email', async (req, res) => {
  try {
    await sendOTPEmail(
      'YOUR_EMAIL@gmail.com', // Replace with your email
      '123456',
      'Krushna'
    );

    res.json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    console.error('❌ Test Email Error:', error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* ===========================
   API ROUTES
=========================== */
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ai', aiRoutes);

/* ===========================
   HEALTH CHECK
=========================== */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    env: ENV.NODE_ENV,
  });
});

/* ===========================
   404 HANDLER
=========================== */
app.use('/api/*', (req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
});

/* ===========================
   GLOBAL ERROR HANDLER
=========================== */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(ENV.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
});

/* ===========================
   START SERVER
=========================== */
const startServer = async () => {
  app.listen(ENV.PORT, '0.0.0.0', () => {
    console.log(
      `✅ Server on port ${ENV.PORT} | env: ${ENV.NODE_ENV}`
    );
  });

  try {
    await connectDB();
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error(
      '❌ MongoDB failed to connect:',
      error.message
    );
  }

  try {
    console.log('📧 Verifying email configuration...');
    await verifyEmailConfig();
  } catch (error) {
    console.error('❌ Email config failed:', error);
  }
};

startServer();