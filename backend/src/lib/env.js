import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/agri_insights',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_dev_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
